
var questionsService = require('./questions-service');

exports.getQuestionForNumber = function (request, questionNumber) {

    var questionToReturn = questionsService.getQuestionForNumber(questionNumber);
    if ( questionToReturn) {
        questionToReturn.didQuestionChange = false;
        if ( request.nevex.isQuizMaster ) {
            // Change the question in play
            questionToReturn.didQuestionChange = questionsService.setCurrentQuestion(questionNumber);
        }
        return questionToReturn;
    } else {
        return { error: "Could not find question "+questionNumber};
    }
};

exports.getAnswerForQuestion = function (request, response) {

    if ( ! request.nevex.isQuizMaster ) {
        return response.status(403).json({"error": "You are not authorized to view answers"});
    }

    var questionNumber = request.query.number;
    if ( questionNumber ) {
        var answerResponse = questionsService.getAnswerForQuestion(questionNumber);
        if ( answerResponse ) {
            return response.status(200).json( { "answer": answerResponse.answer} );
        } else {
            return response.status(422).json({"error": "Could not find answer to question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
};

exports.getCurrentScores = function () {
    return questionsService.getCurrentScores();
};

exports.reduceScoreBonus = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        // By default we decrease the score...
        var newScoreAmount = questionsService.changeAnswersLeftDown();
        return response.status(200).json({"newScoreAmount": newScoreAmount});
    } else {
        return response.status(403).json( { "error": "You are not authorized to reduce rhe score bonus"});
    }
};

exports.startQuiz = function (request) {
    if ( request.nevex.isQuizMaster ) {
        return questionsService.startQuiz();
    }
    return false; // not authorized
};

exports.stopQuiz = function (request) {
    if ( request.nevex.isQuizMaster ) {
        return { isStopped: questionsService.stopQuiz() }
    } else {
        return { error: "You are not authorized to stop the quiz"};
    }
};

exports.pauseQuiz = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        var isPaused = questionsService.pauseQuiz();
        return response.status(200).json({"isPaused": isPaused});
    } else {
        return response.status(403).json({"error": "You are not authorized to pause the quiz"});
    }
};

exports.unPauseQuiz = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        var isPaused = questionsService.unPauseQuiz();
        return response.status(200).json({"isUnPaused": isPaused});
    } else {
        return response.status(403).json({"error": "You are not authorized to un-pause the quiz"});
    }
};

exports.getStatisticsForQuestion = function (request, response) {

    if ( request.nevex.isQuizMaster ) {
        var questionNumber = request.query.number;
        if ( questionNumber) {
            var stats = questionsService.getStatisticsForQuestion(questionNumber);
            return response.status(200).json(stats);
        } else {
            return response.status(422).json( {"error": "You must provide a question number"} );
        }
    } else {
        return response.status(403).json({"error": "You are not authorized to view the statistics"});
    }

};