module.exports = function(request, response, next) {
    if(!quizMaster.isQuizMasterKeyCorrect(request)){
        return response.status(403);
    }
    return next();
}