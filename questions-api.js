
var questionsService = require('./questions-service');

exports.getQuestionForNumber = function (request, questionNumber) {

    console.log("New request received to getQuestionForNumber");

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
    console.log("New request received to /prosperquiz/answers");

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

exports.getCurrentScores = function (request, response) {
    console.log("New GET request received to /prosperquiz/scores");
    return response.status(200).json(questionsService.getCurrentScores());
};

exports.reduceScoreBonus = function (request, response) {
    console.log("New PATCH request received to /prosperquiz/scores");
    if ( request.nevex.isQuizMaster ) {
        // By default we decrease the score...
        var newScoreAmount = questionsService.changeAnswersLeftDown();
        return response.status(200).json({"newScoreAmount": newScoreAmount});
    } else {
        return response.status(403).json( { "error": "You are not authorized to reduce rhe score bonus"});
    }
};


exports.stopQuiz = function (request, response) {
    console.log("New POST request received to /prosperquiz/stop");
    if ( request.nevex.isQuizMaster ) {
        var isStopped = questionsService.stopQuiz();
        return response.status(200).json({"isStopped": isStopped});
    } else {
        return response.status(403).json({"error": "You are not authorized to stop the quiz"});
    }
};

exports.pauseQuiz = function (request, response) {
    console.log("New POST request received to /prosperquiz/pause");
    if ( request.nevex.isQuizMaster ) {
        var isPaused = questionsService.pauseQuiz();
        return response.status(200).json({"isPaused": isPaused});
    } else {
        return response.status(403).json({"error": "You are not authorized to pause the quiz"});
    }
};
