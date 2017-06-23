
var express = require('express');
var httpClient = require('request');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();
var questionsService = require('./questions-service');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use('/prosperquiz', express.static(path.join(__dirname, 'static'))); // get references to the html's

app.get('/prosperquiz/questions', function(request, response) {
    console.log("New request received to /prosperquiz/questions");
    var questionNumber = request.query.number;
    if ( questionNumber ) {
        var questionChangeKey = request.query["key"];
        var questionToReturn = questionsService.getQuestion(questionNumber, questionChangeKey);
        if ( questionToReturn) { 
            return response.status(200).json(questionToReturn);
        } else {
            return response.status(422).json({"error": "Could not find question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
});

// Ya, ya - this should be a sub-resourse under "questions" - but again, this is as quick app - not a design poc app
app.get('/prosperquiz/answers', function(request, response) {
    console.log("New request received to /prosperquiz/answers");
    var questionNumber = request.query.number;
    if ( questionNumber ) {
        var questionChangeKey = request.query["key"];
        var answerToReturn = questionsService.getAnswer(questionNumber, questionChangeKey);
        if ( answerToReturn) {
            return response.status(200).json(answerToReturn);
        } else {
            return response.status(422).json({"error": "Could not find answer to question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
});

// Ya, ya - this should be a sub-resourse under "questions" - but again, this is as quick app - not a design poc app
app.post('/prosperquiz/pause', function(request, response) {
    console.log("New POST request received to /prosperquiz/pause");
    var questionToChangeKey = request.body["key"];
    var pauseResponse = questionsService.pauseQuiz(questionToChangeKey);
    return response.status(200).json(pauseResponse);
});


var questionHtml = fs.readFileSync('static/question.html');

app.get('/prosperquiz', function(request, response) {
    console.log("New GET request received to /prosperquiz");
    response.setHeader('Content-Type', 'text/html');
    var startQuestion = request.query.start;
    if ( !startQuestion ) {
        startQuestion = 1;
    }
    response.setHeader("Start-Question", startQuestion);
    response.status(200).end(questionHtml);
});

app.post('/prosperquiz/slack', function(request, response) {
    console.log("New POST request received to /prosperquiz/slack");

    var token = request.body.token;
    if ( !token && !(token === "MwU4GkhdkJS88MWMS0JsLqlI")) {
        return response.status(403).json({});
    }

    var name = request.body.user_name;
    if ( !name ) {
        return response.status(422).json({ "error": "No name provided"});
    }
    var answer = request.body.text;
    if ( !answer ) {
        answer = answer.trim();
    }
    if ( !answer || !isNumber(answer)) {
        // 200 for slack
        return response.status(200).json({"text": "Looks like you provided an invalid answer number, try again with a valid answer"});
    }
    console.log("Got an valid answer ["+answer+"] from ["+name+"]");

    var scoreResult = questionsService.storeScore(name, answer);
    if ( scoreResult && !scoreResult.error ) {
        return response.status(200).json({"text": "Thank you for your answer to question "+scoreResult.currentQuestion});
    } else {
        if ( scoreResult.error) {
            // needs to be a 200 for slack response
            return response.status(200).json({"text": scoreResult.error});
        } else {
            return response.status(500).json({"text": "Could not save answer"});
        }
    }
});

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

app.get('/prosperquiz/scores', function(request, response) {
    console.log("New GET request received to /prosperquiz/scores");
    return response.status(200).json(questionsService.getCurrentScores());
});

app.post('/prosperquiz/stop', function(request, response) {
    console.log("New POST request received to /prosperquiz/stop");
    var changeQuestionKey = request.body["key"];
    return response.status(200).json(questionsService.stopGame(changeQuestionKey));
});

var portNumber = 34343;
app.listen(portNumber);
console.log('Server started and listening on port '+portNumber+'...');
