module.exports = function(app, quizMaster){
    app.get('/prosperquiz/questions', quizMaster.getQuestionForNumber);
    app.get('/prosperquiz/scores', quizMaster.getCurrentScores);
    app.get('/prosperquiz/stats', quizMaster.getStatisticsForQuestion);
    app.post('/prosperquiz/slack/sendquestion', quizMaster.sendQuestionToSlack);
    app.post('/prosperquiz/start', quizMaster.startQuiz);
    app.post('/prosperquiz/stop', quizMaster.stopQuiz);
}


