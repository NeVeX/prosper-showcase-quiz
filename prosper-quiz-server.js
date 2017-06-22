
var express = require('express');
var httpClient = require('request');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();
var questionsService = require('./questions-service');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'static'))); // get references to the html's

app.get('/prosperquiz/questions', function(request, response) {
    console.log("New request received to /prosperquiz/questions");
    var questionNumber = request.query.number;
    if ( questionNumber ) {

        var questionToReturn = questionsService.getQuestion(questionNumber);
        if ( questionToReturn) { 
            return response.status(200).json(questionToReturn);
        } else {
            return response.status(422).json({"error": "Could not find question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
});

var questionHtml = fs.readFileSync('static/question.html');

app.get('/prosperquiz', function(request, response) {
    console.log("New GET request received to /prosperquiz");
    response.setHeader('Content-Type', 'text/html');
    var startQuestion = request.query.start;
    if ( startQuestion ) {
        response.setHeader("Start-Question", startQuestion);
    }
    response.status(200).end(questionHtml);
});

app.post('/prosperquiz', function(request, response) {
    console.log("New POST request received to /prosperquiz");
    var name = request.body.name;
    var answer = request.body.answer; 
    if ( name && answer) {
        var success = questionsService.storeScore(name, answer);
        if ( success ) {
            return response.status(200).json({"message": "Thank you for your answer"});
        } else {
            return response.status(500).json({"error": "Could not save answer"});
        }
    } else {
        return response.status(422).json({"error": "You must provide name and answer"});
    }
});


app.get('/prosperquiz/scores', function(request, response) {
    console.log("New GET request received to /prosperquiz/scores");
    return response.status(200).json(questionsService.getCurrentScores());
});


var portNumber = 34343;
app.listen(portNumber);
console.log('Listening on port '+portNumber+'...');
