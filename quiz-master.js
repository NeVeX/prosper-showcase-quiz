var QUIZ_MASTER_KEY = process.env.QUIZ_MASTER_KEY;

if ( !QUIZ_MASTER_KEY) {
    throw new Error("No quiz master key defined");
}

var QUIZ_KEY_HEADER = "Quiz-Key";

var questionApi = require('./questions-api');
var slackApi = require('./slack-api');

exports.isQuizMasterKeyCorrect = function(request) {
   return checkIsQuizMasterKeyCorrect(request);
};

exports.getQuestionForNumber = function (request, response) {

    var questionNumber = request.query.number;
    if ( questionNumber ) {
        var questionInformation = questionApi.getQuestionForNumber(request, questionNumber);
        if ( questionInformation.error ) {
            return response.status(422).json({error: questionInformation.error});
        }
        if ( questionInformation.didQuestionChange) {
            // question has changed, so send updates to slack
            slackApi.sendNewQuestionToSlackUsers(questionInformation);

        }
        return response.status(200).json(questionInformation);
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
};

exports.stopQuiz = function (request, response) {

    var stopResponse = questionApi.stopQuiz(request);
    if ( stopResponse.error ) {
        return response.status(422).json(stopResponse.error);
    }

    var isStoppedStatus = stopResponse.isStopped;
    slackApi.quizHasStopped();
    return response.status(200).json({isStopped: isStoppedStatus});

};

exports.getCurrentScores = function (request, response) {
    var currentScores = questionApi.getCurrentScores();
    if ( !currentScores ) {
        return response.status(500).json({error: "Could not get current scores"});
    }
    // The current scores are not filled with user information, so get user info before returning
    var updatedCurrentScores = slackApi.updateCurrentScoresWithUserInfo(currentScores);
    return response.status(200).json(updatedCurrentScores);
};


function checkIsQuizMasterKeyCorrect(request) {
    var quizMasterKey = request.get(QUIZ_KEY_HEADER);
    return quizMasterKey && QUIZ_MASTER_KEY === quizMasterKey;
}
