var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));

var allPlayerScores = {};
var answerStatistics = {};
var questions = null;
var currentQuestionInUse = null; // Not in play at the start
var currentAnswersInUse = null;

var isQuizPaused = false;
var isQuizStopped = true;
var isQuizReady = false;


function QuestionsService(questionValidator, fileToLoad){
    this.questionValidator = questionValidator;

    if(fileToLoad){
        loadQuestionsFromFile(fileToLoad); // default questions
    }
}

function loadQuestionsFromFile(fileName) {
    return fs.readFileAsync(fileName)
    .then(function(questionsJson){
        return doLoadQuestionsFromJson(questionsJson);;
    })
    .then(function(result){
        isQuizReady = true;
    })
    .catch(function(err){
        throw Error("Could not load questions from file "+fileName);    
    });
}

QuestionsService.prototype.loadQuestionsFromJson = doLoadQuestionsFromJson;

function doLoadQuestionsFromJson(questionsJson) {

    if ( !questionsJson ) {
        return Promise.reject({ isError: true, message: "Questions JSON is null/empty" });
    }

    try{
        var parsedQuestions = JSON.parse(questionsJson);
        // validate the json
        if ( !parsedQuestions || parsedQuestions.length == 0 ) {
            return Promise.reject({ isError: true, message: "Could not load questions - no data found" });
        }
    } catch(e){
        return Promise.reject({ isError: true, message: "Could not load questions - "+e.message });
    }
        // make sure each one is valid
    var errorsFound = [];
    var promises = [];
    for (var i=0; i< parsedQuestions.length; i++) { //for var question in parsedQuestions was giving 1 and 0 instead of objects, very strange.
        var question = parsedQuestions[i];
        promises.push(this.questionValidator.validateQuestion(question)
                        .catch(function(err){
                            errorsFound.push("Invalid data for question ["+(i+1)+"] - " + err.message);
                        }));
    }

    return Promise.all(promises)
    .then(function(results){
        if ( errorsFound.length !== 0 ) {
            console.log("Encountered ["+errorsFound.length+"] problems while trying to load questions. ["+errorsFound+"]");
            return Promise.reject({ isError: true, errors: errorsFound});
        }

        questions = parsedQuestions;
        console.log("Successfully loaded a total of ["+questions.length+"] questions");
        return Promise.resolve({ isError: false });
    });
}

QuestionsService.prototype.startQuiz = function() {
    allPlayerScores = {};
    answerStatistics = {};
    console.log("Started a new game");
    isQuizPaused = true;
    isQuizStopped = false;
    return true;
};

QuestionsService.prototype.setCurrentQuestion = function(questionNumber) {
    if ( questionNumber === currentAnswersInUse) {
        console.log("No setting question to ["+questionNumber+"] since that is the current question in play");
        return false;
    }
    var question = getQuestion(questionNumber);
    if ( question ) {
        currentQuestionInUse = questionNumber;
        currentAnswersInUse = getTotalAnswersForQuestion(question);
        console.log("Changed the question in use to ["+currentQuestionInUse+"] - answers is use ["+currentAnswersInUse+"]");
        return true;
    }
    return false;
};

QuestionsService.prototype.getStatisticsForQuestion = function(questionNumber) {
    if ( ! getQuestion(questionNumber) ) {
        return { error: "Question number ["+questionNumber+"] is invalid"};
    }
    var statsQuestion = answerStatistics[questionNumber];
    if ( !statsQuestion ) {
        statsQuestion = {}; // default to empty
    }

    var totalAnswers = statsQuestion.totalAnswers ? statsQuestion.totalAnswers : 0;
    var answerOneCount = statsQuestion[1] ? statsQuestion[1] : 0;
    var answerTwoCount = statsQuestion[2] ? statsQuestion[2] : 0;
    var answerThreeCount = statsQuestion[3] ? statsQuestion[3] : 0;
    var answerFourCount = statsQuestion[4] ? statsQuestion[4] : 0;

    // Calculate percentages
    var answerOnePercent = 0, answerTwoPercent = 0, answerThreePercent = 0, answerFourPercent = 0;
    if ( totalAnswers > 0 ) {
        answerOnePercent = Math.round((answerOneCount / totalAnswers) * 100);
        answerTwoPercent = Math.round((answerTwoCount / totalAnswers) * 100);
        answerThreePercent = Math.round((answerThreeCount / totalAnswers) * 100);
        answerFourPercent = Math.round((answerFourCount / totalAnswers) * 100);
    }

    return {
        "answerOneCount": answerOneCount,
        "answerTwoCount" : answerTwoCount,
        "answerThreeCount": answerThreeCount,
        "answerFourCount": answerFourCount,
        "answerOnePercent" : answerOnePercent,
        "answerTwoPercent" : answerTwoPercent,
        "answerThreePercent" : answerThreePercent,
        "answerFourPercent" : answerFourPercent,
        "fastestPlayerToCorrectlyAnswer": statsQuestion.fastestPlayerToCorrectlyAnswer,
        "totalAnswers": totalAnswers
    }

};

QuestionsService.prototype.generateTestData = function() {

    // TODO: make this waaaay better - actually make it more random and support dynamic question answer sizes!
    var totalQuestions = questions.length;
    for (var i = 1; i < 100; i++) {
        var name = "test-name-"+i;
        for (var q = 1; q <= totalQuestions; q++) {
            var answer = 1; // will be wrong for some questions
            if ( Math.floor(Math.random() * 2) === 1) {
                answer = this.getAnswerForQuestion(q).answer; // actually get the answer
            }
            // record a score
            recordPlayerAnswerWithGameState(name, answer, q, 4);
        }
    }
    console.log("Successfully generated test data");
    return true;
};

QuestionsService.prototype.getAnswerForQuestion = function(questionNumber) {
    var question = getQuestion(questionNumber);
    if ( question ) {
        return { answer: question.correctAnswer}
    }
};

QuestionsService.prototype.changeAnswersLeftDown = function() {
    var answersInUse = currentAnswersInUse;
    if ( answersInUse ) {
        var newScoreAmount = getScoreAmountForAnswersLeft(answersInUse);
        if ( answersInUse > 2 ) {
            var previousScoreAmount = newScoreAmount;
            --answersInUse;
            newScoreAmount = getScoreAmountForAnswersLeft(answersInUse);
            console.log("Changing scoreAmount from [" + previousScoreAmount + "] to [" + newScoreAmount + "]");
            // Now set the score amount
            currentAnswersInUse = answersInUse;
        }
        return newScoreAmount;
    }
    return null;
};

QuestionsService.prototype.pauseQuiz = function() {
    console.log("Paused the game at question ["+currentQuestionInUse+"]");
    isQuizPaused = true;
    return true;
};

QuestionsService.prototype.unPauseQuiz = function() {
    if ( !currentQuestionInUse || !currentAnswersInUse) {
        console.log("Cannot Un-Paused the game since question in play is not set");
        return false; // the data isn't correct, so do not un pause
    }

    console.log("Un-Paused the game at question ["+currentQuestionInUse+"]");
    isQuizPaused = false;
    return true; // it's unpaused
};

function getScoreAmountForAnswersLeft(currentAnswersInUse) {
    if ( currentAnswersInUse && currentAnswersInUse > 0 ) {
        if ( currentAnswersInUse === 4 ) {
            return 5; // there's four questions in play
        } else if ( currentAnswersInUse === 3 ) {
            return 3; // there's three questions in play
        }
        return 1; // default
     }
     return 0; // hmmm...
}

function getTotalAnswersForQuestion(question) {
    if ( question.answerFour) {
        return 4;
    } else if ( question.answerThree) {
        return 3;
    } else if ( question.answerTwo) {
        return 2;
    }
    return 1; // only one answer? (shouldn't happen)
}

QuestionsService.prototype.stopQuiz = function() {
    this.pauseQuiz();
    isQuizStopped = true;
    return isQuizStopped;
};

function getQuestion(number) {
    var questionKey = number - 1;
    if ( questionKey >= 0 && questionKey < questions.length) {
        return questions[questionKey];
    }
    return null;
}

QuestionsService.prototype.getQuestionForNumber = function(questionNumber) {
    var foundQuestion = getQuestion(questionNumber);
    if ( foundQuestion ) {
        // Don't return the direct question object, create the response we want to send to the client
        return {
            question: foundQuestion.question,
            answerOne: foundQuestion.answerOne,
            answerTwo: foundQuestion.answerTwo,
            answerThree: foundQuestion.answerThree,
            answerFour: foundQuestion.answerFour,
            timeAllowedSeconds: foundQuestion.timeAllowedSeconds,
            totalQuestions: questions.length // Add the total questions in this quiz
        };
    }
    return null;
};

QuestionsService.prototype.recordPlayerAnswer = function(name, answer) {
    return recordPlayerAnswerWithGameState(name, answer, currentQuestionInUse, currentAnswersInUse);
};

function recordPlayerAnswerWithGameState(name, answerGiven, questionInPlay, answersInUse) {
    if ( isQuizStopped) {
        return { error: "The quiz is over - no more answers can be accepted" }
    }
    if ( isQuizPaused ) {
        return { error: "Question "+questionInPlay+" is currently not accepting answers, since the round is either waiting to start, or has finished already" }
    }

    var scoreAmount = getScoreAmountForAnswersLeft(answersInUse);
    // console.log("Recording player "+name+" answer "+answer+" for question in play "+questionInPlay);
    var currentQuestion = getQuestion(questionInPlay);
    if ( !currentQuestion ) {
        console.log("Could not get the current question: "+questionInPlay);
        return { error: "Could not record score for question "+questionInPlay };
    }
    var correctAnswer = currentQuestion.correctAnswer;
    // console.log("Correct answer: "+correctAnswer+" - given answer "+answer);
    if ( !(name in allPlayerScores) ) {
        allPlayerScores[name] = {};
    }

    // We only allow one answer per question now
    if ( (questionInPlay in allPlayerScores[name]) ) {
        // console.log("Not allowing player to answer again since they already answered");
        return { error: "Looks like you already answered question "+questionInPlay+" - I can't let you answer it again"};
    }

    var isAnswerCorrect = correctAnswer == answerGiven;
    if ( isAnswerCorrect ) {
        allPlayerScores[name][questionInPlay] = scoreAmount; // Give them the score
    } else {
        allPlayerScores[name][questionInPlay] = 0; // Give them nothing
    }

    if ( answerGiven > 0 && answerGiven <= getTotalAnswersForQuestion(currentQuestion) ) {
        updateStatistics(questionInPlay, answerGiven);

        // If the answer is correct, see if this person is the first to answer - give them more points if so
        if ( isAnswerCorrect ) {
            var bonusScoreToAdd = getScoreForFastestCorrectAnswer(questionInPlay, answersInUse, name);
            allPlayerScores[name][questionInPlay] += bonusScoreToAdd;
        }
    }

    return { currentQuestion: questionInPlay};
}

function getScoreForFastestCorrectAnswer(questionNumber, answersInUse, playerName) {
    // Only get a bonus score if the current question does not have a fastest player added already
    if ( answerStatistics[questionNumber] && !answerStatistics[questionNumber].fastestPlayerToCorrectlyAnswer) {
        answerStatistics[questionNumber].fastestPlayerToCorrectlyAnswer = playerName;
        // The bonus will be equal to the current top score amount in play
        var bonusScore = getScoreAmountForAnswersLeft(answersInUse);
        console.log("Player ["+playerName+"] will get a bonus score of ["+bonusScore+"] for answering the fastest");
        return bonusScore;
    }
    return 0; // no bonus points
}

function updateStatistics(currentQuestion, answerGiven) {
    // See if we have already set statistics on this
    if ( !answerStatistics[currentQuestion]) {
        answerStatistics[currentQuestion] = {
            totalAnswers: 0
        }
    }

    if ( ! answerStatistics[currentQuestion][answerGiven] ) {
        answerStatistics[currentQuestion][answerGiven] = 0;
    }
    answerStatistics[currentQuestion][answerGiven]++; // now just increment it
    answerStatistics[currentQuestion].totalAnswers++; // increment the total answers given too
}

QuestionsService.prototype.getCurrentScores = function() {
    var returnScores = [];
    for ( var playerName in allPlayerScores ) {
        var totalPlayerScore = 0;
        if ( allPlayerScores.hasOwnProperty(playerName) ) {
            for ( var questionNumber in allPlayerScores[playerName] ) {
                if ( allPlayerScores[playerName].hasOwnProperty(questionNumber)) {
                    totalPlayerScore += allPlayerScores[playerName][questionNumber];
                }
            }
        }
        returnScores.push({"name": playerName, "score": totalPlayerScore});
    }
    return returnScores;
};


module.exports = QuestionsService;