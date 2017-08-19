function QuizMaster(config, questionsApi, slackApi){
    if ( !config.QUIZ_MASTER_KEY) {
        throw new Error("No quiz master key defined");
    }

    console.log("Will use quiz master key: " + config.QUIZ_MASTER_KEY);
    this.questionApi = questionsApi;
    this.slackApi = slackApi;
}


var QUIZ_KEY_HEADER = "Quiz-Key";

QuizMaster.prototype.isQuizMasterKeyCorrect = function(request) {
   return checkIsQuizMasterKeyCorrect(request);
};

QuizMaster.prototype.getQuestionForNumber = function (request, response) {

    var questionNumber = request.query.number;
    if ( !questionNumber ) {
        return response.status(422).json({"error": "You must provide a question number"});
    }
    
    var questionInformation = this.questionApi.getQuestionForNumber(request, questionNumber);
    if ( questionInformation.error ) {
        return response.status(422).json({error: questionInformation.error});
    }
    return response.status(200).json(questionInformation);
    
};

QuizMaster.prototype.startQuiz = function (request, response) {

    var quizStarted = this.questionApi.startQuiz(request);
    if ( quizStarted ) {
        this.slackApi.quizHasStarted();
    }
    response.status(200).json( { isStarted: quizStarted } );

};

QuizMaster.prototype.stopQuiz = function (request, response) {

    var stopResponse = this.questionApi.stopQuiz(request);
    if ( stopResponse.error ) {
        return response.status(422).json(stopResponse);
    }

    var isStoppedStatus = stopResponse.isStopped;
    if ( isStoppedStatus ) {
        this.slackApi.quizHasStopped();
    }
    return response.status(200).json( {isStopped: isStoppedStatus} );

};

QuizMaster.prototype.sendQuestionToSlack = function (request, response) {
    var questionNumber = request.body.number;
    if ( !questionNumber ) {
        return response.status(403).json( { error: "No question number provided"} );
    }

    var fullQuestion = this.questionApi.getQuestionForNumber(request, questionNumber);
    if ( !fullQuestion ) {
        return response.status(403).json( { error: "Could not find question ["+questionNumber+"]"} );
    }

    console.log("Sending question [" + questionNumber + "] to all slack users");
    this.slackApi.sendNewQuestionToSlackUsers(fullQuestion);
    return response.status(200).json( { message: "success" } );
};

QuizMaster.prototype.getCurrentScores = function (request, response) {
    var currentScores = this.questionApi.getCurrentScores();
    if ( !currentScores ) {
        return response.status(500).json({error: "Could not get current scores"});
    }
    // The current scores are not filled with user information, so get user info before returning
    var updatedCurrentScores = this.slackApi.updateCurrentScoresWithUserInfo(currentScores);
    return response.status(200).json(updatedCurrentScores);
};

QuizMaster.prototype.getStatisticsForQuestion = function (request, response) {

    var questionNumber = request.query.number;
    if ( !questionNumber) {
        return response.status(422).json( {"error": "You must provide a question number"} );
    }
    
    var stats = this.questionApi.getStatisticsForQuestion(questionNumber);
    // check if we have a fastest name - we can get the full name using the slack info
    if ( stats && stats.fastestPlayerToCorrectlyAnswer ) {
        stats.fastestPlayerToCorrectlyAnswer = this.slackApi.getSlackFullName(stats.fastestPlayerToCorrectlyAnswer);
    }
    return response.status(200).json(stats);
};

function checkIsQuizMasterKeyCorrect(request) {
    var quizMasterKey = request.get(QUIZ_KEY_HEADER);
    return quizMasterKey && QUIZ_MASTER_KEY === quizMasterKey;
}

module.exports = QuizMaster;