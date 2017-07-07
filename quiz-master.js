var QUIZ_MASTER_KEY = "nevex";
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
    }s
};

function checkIsQuizMasterKeyCorrect(request) {
    var quizMasterKey = request.get(QUIZ_KEY_HEADER);
    return quizMasterKey && QUIZ_MASTER_KEY === quizMasterKey;
}
