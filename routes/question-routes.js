module.exports = function(app, questionsApi){
    app.post('/prosperquiz/questions', questionsApi.setQuestions);
    app.get('/prosperquiz/answers', questionsApi.getAnswerForQuestion);
    app.patch('/prosperquiz/scores', questionsApi.reduceScoreBonus);
    app.post('/prosperquiz/pause', questionsApi.pauseQuiz);
    app.post('/prosperquiz/unpause', questionsApi.unPauseQuiz);
}