var QUIZ_MASTER_KEY = process.env.QUIZ_MASTER_KEY;


if ( !QUIZ_MASTER_KEY) {
    throw new Error("No quiz master key defined");
}

console.log("Will use quiz master key: "+QUIZ_MASTER_KEY);

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
        return response.status(200).json(questionInformation);
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
};

exports.startQuiz = function (request, response) {

    var quizStarted = questionApi.startQuiz(request);
    if ( quizStarted ) {
        slackApi.quizHasStarted();
    }
    response.status(200).json( { isStarted: quizStarted } );

};

exports.stopQuiz = function (request, response) {

    var stopResponse = questionApi.stopQuiz(request);
    if ( stopResponse.error ) {
        return response.status(422).json(stopResponse);
    }

    var isStoppedStatus = stopResponse.isStopped;
    if ( isStoppedStatus ) {
        slackApi.quizHasStopped();
    }
    return response.status(200).json( {isStopped: isStoppedStatus} );

};

exports.sendQuestionToSlack = function (request, response) {
    var questionNumber = request.body.number;
    if ( questionNumber ) {
        var fullQuestion = questionApi.getQuestionForNumber(request, questionNumber);
        if ( fullQuestion ) {
            console.log("Sending question ["+questionNumber+"] to all slack users");
            slackApi.sendNewQuestionToSlackUsers(fullQuestion);
            return response.status(200).json( { message: "success" } );
        }
        return response.status(403).json( { error: "Could not find question ["+questionNumber+"]"} );
    }
    return response.status(403).json( { error: "No question number provided"} );
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

exports.getStatisticsForQuestion = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        var questionNumber = request.query.number;
        if ( questionNumber) {
            var stats = questionApi.getStatisticsForQuestion(questionNumber);
            // check if we have a fastest name - we can get the full name using the slack info
            if ( stats && stats.fastestPlayerToCorrectlyAnswer ) {
                stats.fastestPlayerToCorrectlyAnswer = slackApi.getSlackFullName(stats.fastestPlayerToCorrectlyAnswer);
            }
            return response.status(200).json(stats);
        } else {
            return response.status(422).json( {"error": "You must provide a question number"} );
        }
    } else {
        return response.status(403).json({"error": "You are not authorized to view the statistics"});
    }
};

exports.getTotalPlayersRegistered = function (request, response) {
    var totalAmountOfRegisteredPlayers = slackApi.getTotalPlayersRegistered();
    if ( !totalAmountOfRegisteredPlayers ) {
        totalAmountOfRegisteredPlayers = 0;
    }
    return response.status(200).json( { total_registered_players: totalAmountOfRegisteredPlayers })
};

function checkIsQuizMasterKeyCorrect(request) {
    var quizMasterKey = request.get(QUIZ_KEY_HEADER);
    return quizMasterKey && QUIZ_MASTER_KEY === quizMasterKey;
}
