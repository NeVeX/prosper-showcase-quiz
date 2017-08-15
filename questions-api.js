
function QuestionsApi(questionsService){
    this.questionsService = questionsService;
}


QuestionsApi.prototype.getQuestionForNumber = function (request, questionNumber) {

    var questionToReturn = this.questionsService.getQuestionForNumber(questionNumber);
    if ( !questionToReturn) {
        return { error: "Could not find question "+questionNumber};
    }

    questionToReturn.didQuestionChange = false;
    if ( request.nevex.isQuizMaster ) {
        // Change the question in play
        questionToReturn.didQuestionChange = this.questionsService.setCurrentQuestion(questionNumber);
    }
    return questionToReturn;
    
};

QuestionsApi.prototype.getAnswerForQuestion = function (request, response) {

    if ( !request.nevex.isQuizMaster ) {
        return response.status(403).json({"error": "You are not authorized to view answers"});
    }

    var questionNumber = request.query.number;
    if ( !questionNumber ) {
        return response.status(422).json({"error": "You must provide a question number"});
    }
    var answerResponse = this.questionsService.getAnswerForQuestion(questionNumber);
    if ( !answerResponse ) {
        return response.status(422).json({"error": "Could not find answer to question "+questionNumber});
    } 

    return response.status(200).json( { "answer": answerResponse.answer} );
};

QuestionsApi.prototype.setQuestions = function (request, response) {

    if ( !request.nevex.isQuizMaster  ) {
        return response.status(403).json({"error": "You are not allowed to set the questions"});
    }

    this.questionsService.loadQuestionsFromJson(JSON.stringify(request.body))
    .then(function(result){
        return response.status(422).json(result);
    })
    .catch(function(err){
        return response.status(201).json({"message": "Successfully updated the questions"})
    });
};

QuestionsApi.prototype.getCurrentScores = function () {
    return this.questionsService.getCurrentScores();
};

QuestionsApi.prototype.reduceScoreBonus = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        // By default we decrease the score...
        var newScoreAmount = this.questionsService.changeAnswersLeftDown();
        return response.status(200).json({"newScoreAmount": newScoreAmount});
    }
    
    return response.status(403).json( { "error": "You are not authorized to reduce rhe score bonus"});
};

QuestionsApi.prototype.startQuiz = function (request) {
    if ( request.nevex.isQuizMaster ) {
        return this.questionsService.startQuiz();
    }
    return false; // not authorized
};

QuestionsApi.prototype.stopQuiz = function (request) {
    if ( request.nevex.isQuizMaster ) {
        return { isStopped: this.questionsService.stopQuiz() }
    } 

    return { error: "You are not authorized to stop the quiz"};
};

QuestionsApi.prototype.pauseQuiz = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        var isPaused = this.questionsService.pauseQuiz();
        return response.status(200).json({"isPaused": isPaused});
    }

    return response.status(403).json({"error": "You are not authorized to pause the quiz"});
};

QuestionsApi.prototype.unPauseQuiz = function (request, response) {
    if ( request.nevex.isQuizMaster ) {
        var isPaused = this.questionsService.unPauseQuiz();
        return response.status(200).json({"isUnPaused": isPaused});
    } 

    return response.status(403).json({"error": "You are not authorized to un-pause the quiz"});
};

QuestionsApi.prototype.getStatisticsForQuestion = function (questionNumber) {
    return this.questionsService.getStatisticsForQuestion(questionNumber);
};

module.exports = QuestionsApi;