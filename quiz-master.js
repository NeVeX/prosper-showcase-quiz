var questionsService = require('./questions-service');

var QUIZ_MASTER_KEY = "nevex";

module.exports = {
    // startNewGame: function (quizMasterKey) {
    //     return doStartNewGame(quizMasterKey);
    // },
    generateTestData: function (quizMasterKey) {
        return doGenerateTestData(quizMasterKey);
    },
    changeAnswersLeftDown: function (quizMasterKey) {
        return doChangeAnswersLeftDown( quizMasterKey);
    },
    setCurrentQuestion: function(questionNumber, quizMasterKey) {
        return doSetCurrentQuestion(questionNumber, quizMasterKey);
    },
    getQuestionForNumber : function(questionNumber) {
        return doGetQuestionForNumber(questionNumber);
    },
    stopQuiz : function(quizMasterKey) {
        return doStopQuiz(quizMasterKey);
    },
    pauseQuiz: function(quizMasterKey) {
        return doPauseQuiz(quizMasterKey);
    },
    recordPlayerAnswer: function(name, answer) {
        return doRecordPlayerAnswer(name, answer);
    },
    getCurrentScores: function() {
        return doGetCurrentScores();
    },
    getAnswerForQuestion: function(questionNumber, quizMasterKey) {
        return doGetAnswerForQuestion(questionNumber, quizMasterKey);
    }
};

function doChangeAnswersLeftDown(quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey)) {
        return questionsService.changeAnswersLeftDown();
    } else {
        console.log("Not allowed to change score amount down since quiz master key is incorrect");
    }
}

function doGenerateTestData(quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey)) {
        return questionsService.generateTestData();
    } else {
        console.log("Not allowed to generate test data");
    }
}


function doSetCurrentQuestion(questionNumber, quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey)) {
        if ( questionNumber === "1") { // hack for now...
            return questionsService.startNewGame();
        } else {
            return questionsService.setCurrentQuestion(questionNumber);
        }
    } else {
        console.log("Not allowed to set question to ["+questionNumber+"] since quiz master key is incorrect");
    }
}

function doPauseQuiz(quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey) ) {
        return questionsService.pauseQuiz();
    } else {
        console.log("Will not pause game since quiz master key is incorrect");
    }
}

function isQuizMasterKeyCorrect(quizMasterKey) {
    return quizMasterKey && QUIZ_MASTER_KEY === quizMasterKey;
}

// function doStartNewGame(quizMasterKey) {
//     if ( isQuizMasterKeyCorrect(quizMasterKey) ) {
//         return questionsService.startNewGame();
//     } else {
//         console.log("Will not start new game since quiz master key is incorrect");
//     }
// }

function doGetAnswerForQuestion(questionNumber, quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey) ) {
        return questionsService.getAnswerForQuestion(questionNumber);
    } else {
        console.log("Will not give answer to question ["+questionNumber+"] since quiz master key is incorrect");
        throw new Error("Not authorized to view answers")
    }
}

function doStopQuiz(quizMasterKey) {
    if ( isQuizMasterKeyCorrect(quizMasterKey)) {
        return questionsService.stopQuiz();
    } else {
        console.log("Will not stop game since quiz master key is incorrect");
    }
}

function doGetQuestionForNumber(questionNumber) {
    return questionsService.getQuestionForNumber(questionNumber);
}

function doRecordPlayerAnswer(name, answer) {
    return questionsService.recordPlayerAnswer(name, answer);
}

function doGetCurrentScores() {
    return questionsService.getCurrentScores();
}

