var CHANGE_QUESTION_KEY = "nevex";
var fs = require('fs');

var questionsJson = fs.readFileSync('config/questions.json');

if ( !questionsJson ) {
    throw Error("Did not load questions from json file");
}

var questions = JSON.parse(questionsJson);

console.log("Read a total of ["+questions.length+"] questions");

var allPlayerScores = {};
var currentQuestionInUse = null; // Not in play at the start

module.exports = {
    getQuestion : function(questionNumber, questionChangeKey) {
        return doGetQuestion(questionNumber, questionChangeKey);
    },
    stopGame : function(questionChangeKey) {
        return doStopGame(questionChangeKey);
    },
    storeScore: function(name, answer) {
        return recordPlayerAnswer(name, answer);
    },
    getCurrentScores: function() {
        return doGetCurrentScores();
    }
};

function startNewGame() {
    console.log("Starting a new game");
    allPlayerScores = {};
}

function doStopGame(questionChangeKey) {
    if ( questionChangeKey && CHANGE_QUESTION_KEY === questionChangeKey) {
        console.log("Stopping game at question ["+currentQuestionInUse+"] - the provided key is correct");
        currentQuestionInUse = null;
    } else {
        console.log("Will not stop game - the provided key is in-correct");
    }
    return { isStopped: currentQuestionInUse === null }
}

function getQuestionForNumber(number) {
    var questionKey = number - 1;
    if ( questionKey >= 0 && questionKey < questions.length) {
        return questions[questionKey];
    }
    return null;
}

function doGetQuestion(questionNumber, questionChangeKey) {
    var foundQuestion = getQuestionForNumber(questionNumber);
    if ( foundQuestion) {
        if ( questionChangeKey === CHANGE_QUESTION_KEY) {
            if ( currentQuestionInUse === null ) {
                // looks like we are starting a new game
                startNewGame();
            }
            // Only allow question to change if the key is present
            currentQuestionInUse = questionNumber;
            console.log("Changed the question in use to ["+currentQuestionInUse+"] since the given key is correct");
        } else {
            console.log("Not changing the question since the given question is incorrect");
        }
        // Don't return the direct question object, create the response we want to send to the client
        return {
            question: foundQuestion.question,
            answerOne: foundQuestion.answerOne,
            answerTwo: foundQuestion.answerTwo,
            answerThree: foundQuestion.answerThree,
            answerFour: foundQuestion.answerFour,
            timeAllowed: foundQuestion.timeAllowed,
            totalQuestions: questions.length // Add the total questions in this quiz
        };
    }
    return null;
}

function recordPlayerAnswer(name, answer) {

    if ( !currentQuestionInUse ) {
        return { error: "There is no live game at the moment - check back later" }
    }

    var questionInPlay = currentQuestionInUse; // don't use public variable while doing this update (in case it changes)

    console.log("Recording player "+name+" answer "+answer+" for question in play "+questionInPlay);
    var currentQuestion = getQuestionForNumber(questionInPlay);
    if ( !currentQuestion ) {
        console.log("Could not get the current question: "+questionInPlay);
        return { error: "Could not record score for question "+questionInPlay };
    }
    var correctAnswer = currentQuestion.correctAnswer;
    console.log("Correct answer: "+correctAnswer+" - given answer "+answer);
    if ( !(name in allPlayerScores) ) {
        allPlayerScores[name] = {}; 
        allPlayerScores[name][questionInPlay] = 0;
    }
    if ( correctAnswer == answer) {
        console.log("Answer given is correct");
        allPlayerScores[name][questionInPlay] = 1; // Don't increment, just give a point
    } else {
        console.log("Answer given is not correct");
    }
    return { currentQuestion: questionInPlay};
}

function doGetCurrentScores() {
    var returnScores = [];
    for ( playerName in allPlayerScores ) {
        var totalPlayerScore = 0;
        if ( allPlayerScores.hasOwnProperty(playerName) ) {
            for ( questionNumber in allPlayerScores[playerName] ) {
                if ( allPlayerScores[playerName].hasOwnProperty(questionNumber)) {
                    totalPlayerScore += allPlayerScores[playerName][questionNumber];
                }
            }
        }
        returnScores.push({"name": playerName, "score": totalPlayerScore});
    }
    return returnScores;
}

