
var fs = require('fs');

var questionsJson = fs.readFileSync('config/questions.json');

if ( !questionsJson ) {
    throw Error("Did not load questions from json file");
}

var questions = JSON.parse(questionsJson);

console.log("Read in json questions: "+questions);
console.log("Questions size: "+questions.length);
console.log("Question 1: "+questions[0].question);
console.log("Question 2: "+questions[1].question);

var allPlayerScores = {};

module.exports = {
    getQuestion : function(questionNumber) {
        return doGetQuestion(questionNumber);
    },
    storeScore: function(name, answer) {
        return recordPlayerAnswer(name, answer);
    },
    getCurrentScores: function() {
        return doGetCurrentScores();
    }
}

var currentQuestionInUse = 1;

function doGetQuestion(questionNumber) {
    var questionRequested = --questionNumber;
    if ( questionRequested >= 0 && questionRequested < questions.length) {
        var questionToReturn = questions[questionRequested];
        if ( questionToReturn) {
            currentQuestionInUse = questionNumber;
            questionToReturn.totalQuestions = questions.length;
            delete questionToReturn.correctAnswer; // don't want it leaked to the front end
            return questionToReturn;
        }
    } 
    return null;
}

function recordPlayerAnswer(name, answer) {

    // STOP THE SCORE FROM INCREASING!

    console.log("Recording player "+name+" answer "+answer+" for question in play "+currentQuestionInUse);
    var correctAnswer = questions[currentQuestionInUse-1].correctAnswer;
    console.log("Correct answer: "+correctAnswer+" - given answer "+answer);
    if ( !allPlayerScores[name]) {
        allPlayerScores[name] = {}; 
        allPlayerScores[name][currentQuestionInUse] = 0;
    }
    if ( correctAnswer == answer) {
        console.log("Answer given is correct");
        allPlayerScores[name][currentQuestionInUse] = 1; // Don't increment, just give a point
    } else {
        console.log("Answer given is not correct");
    }
    return true;
}

function doGetCurrentScores() {

    // this is broken....

    var returnScores = [];
    for ( playerName in allPlayerScores) {
        var totalScore = 0;
        if ( allPlayerScores.hasOwnProperty(playerName)) {
            for ( questionNumber in playerName ) {
                if ( playerName.hasOwnProperty(questionNumber)) {
                    console.log("playerScore "+playerName);
                    totalScore += playerName[questionNumber];
                }
            }
        }
        returnScores.push({"name": playerName, "score": totalScore});
    }
    return returnScores;
}
