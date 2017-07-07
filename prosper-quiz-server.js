'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();
var quizMaster = require('./quiz-master');
var slackApi = require('./slack-api');
var questionsApi = require('./questions-api');
var testApi = require('./test-api');

var landingPageHtml = fs.readFileSync('static/landing-page.html');
var questionsHtml = fs.readFileSync('static/question.html');

app.use(bodyParser.urlencoded( { extended: false}));
app.use(bodyParser.json());
app.use('/prosperquiz', express.static(path.join(__dirname, 'static'))); // get references to the html's

app.use(function(request, response, next) {
    request.nevex = {};
    // Set a simple boolean to indicate if this request is from the quiz master
    request.nevex.isQuizMaster = quizMaster.isQuizMasterKeyCorrect(request);
    next();
});

app.post('/prosperquiz/slack', slackApi.slackInteractive);
app.post('/prosperquiz/slack/interactive', slackApi.slackInteractiveAnswer);
app.post('/prosperquiz/test/data', testApi.generateTestData);
app.get('/prosperquiz/questions', quizMaster.getQuestionForNumber);
app.get('/prosperquiz/answers', questionsApi.getAnswerForQuestion);
app.get('/prosperquiz/scores', questionsApi.getCurrentScores);
app.patch('/prosperquiz/scores', questionsApi.reduceScoreBonus);
app.post('/prosperquiz/stop', questionsApi.stopQuiz);
app.post('/prosperquiz/pause', questionsApi.pauseQuiz);

app.get('/prosperquiz', function(request, response) {
    response.setHeader('Content-Type', 'text/html');
    return response.status(200).end(landingPageHtml);
});

app.get('/prosperquiz/start', function(request, response) {
    response.setHeader('Content-Type', 'text/html');
    return response.status(200).end(questionsHtml);
});


module.exports = app;
var portNumber = 34343;
app.listen(portNumber);
console.log('Server started and listening on port ['+portNumber+']...');
