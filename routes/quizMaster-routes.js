module.exports = function(app, quizMaster, middleware){
    app.get('/prosperquiz/questions', middleware, quizMaster.getQuestionForNumber);
    app.get('/prosperquiz/scores', middleware, quizMaster.getCurrentScores);
    app.get('/prosperquiz/stats', middleware, quizMaster.getStatisticsForQuestion);
    app.post('/prosperquiz/slack/sendquestion', middleware, quizMaster.sendQuestionToSlack);
    app.post('/prosperquiz/start', middleware, quizMaster.startQuiz);
    app.post('/prosperquiz/stop', middleware, quizMaster.stopQuiz);
}


