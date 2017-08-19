//TODO: move this to be DI'd
var quizMaster = require('../api/quiz-master');

module.exports = function(request, response, next) {
    request.nevex = {};
    // Set a simple boolean to indicate if this request is from the quiz master
    request.nevex.isQuizMaster = quizMaster.isQuizMasterKeyCorrect(request);
    return next();
}