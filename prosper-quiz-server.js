'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();
var quizMaster = require('./quiz-master');

var container = require("./dependency/container");
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

require("./routes/question-routes")(app, questionsApi);
require("./routes/quizMaster-routes")(app, quizMaster);
require("./routes/slack-routes")(app, container.slackApi);

app.post('/prosperquiz/test/data', testApi.generateTestData);

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
