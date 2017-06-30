
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();
var quizMaster = require('./quiz-master');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
// app.use('/prosperquiz', express.static(path.join(__dirname, 'static', 'landingpage'))); // get references to the html's
app.use('/prosperquiz', express.static(path.join(__dirname, 'static'))); // get references to the html's

var landingPageHtml = fs.readFileSync('static/landing-page.html');
var questionsHtml = fs.readFileSync('static/question.html');
var quizKeyHeader = "Quiz-Key";

app.get('/prosperquiz/questions', function(request, response) {
    console.log("New POST request received to /prosperquiz/questions");
    var questionNumber = request.query.number;
    if ( questionNumber ) {
        var questionToReturn = quizMaster.getQuestionForNumber(questionNumber);
        if ( questionToReturn) {
            var quizMasterKey = request.get(quizKeyHeader);
            if ( quizMasterKey) {
                // See if the key can change the current question in play
                quizMaster.setCurrentQuestion(questionNumber, quizMasterKey);
            }
            return response.status(200).json(questionToReturn);
        } else {
            return response.status(422).json({"error": "Could not find question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number"});
    }
});

app.get('/prosperquiz/answers', function(request, response) {
    console.log("New request received to /prosperquiz/answers");
    var questionNumber = request.query.number;
    var quizMasterKey = request.get(quizKeyHeader);
    if ( questionNumber && quizMasterKey ) {

        var answerResponse;
        try {
            answerResponse = quizMaster.getAnswerForQuestion(questionNumber, quizMasterKey);
        } catch (error) {
            // Not authorized
            return response.status(403).json({"error": "You are not authorized to view answers"});
        }
        if ( answerResponse ) {
            return response.status(200).json( { "answer": answerResponse.answer} );
        } else {
            return response.status(422).json({"error": "Could not find answer to question "+questionNumber});
        }
    } else {
        return response.status(422).json({"error": "You must provide a question number and key"});
    }
});

app.get('/prosperquiz', function(request, response) {
    console.log("New GET request received to /prosperquiz");
    response.setHeader('Content-Type', 'text/html');
    return response.status(200).end(landingPageHtml);
});

app.get('/prosperquiz/start', function(request, response) {
    console.log("New GET request received to /prosperquiz/start");
    response.setHeader('Content-Type', 'text/html');
    return response.status(200).end(questionsHtml);
});

app.post('/prosperquiz/slack', function(request, response) {
    // console.log("New POST request received to /prosperquiz/slack");

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

    var scoreResult = quizMaster.recordPlayerAnswer(name, answer);
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
    return response.status(200).json(quizMaster.getCurrentScores());
});

// Change the score amount (bonus multiplier of sorts)
app.patch('/prosperquiz/scores', function(request, response) {
    console.log("New PATCH request received to /prosperquiz/scores");
    var quizMasterKey = request.get(quizKeyHeader);
    if ( quizMasterKey ) {
        // By default we decrease the score...
        var newScoreAmount = quizMaster.changeAnswersLeftDown(quizMasterKey);
        if ( newScoreAmount ) {
            return response.status(200).json({"newScoreAmount": newScoreAmount});
        }
        return response.status(403).json({"error": "You are not authorized to change the score of this the quiz"});
    }
    return response.status(422).json( { "error": "No key provided"});
});

app.post('/prosperquiz/stop', function(request, response) {
    console.log("New POST request received to /prosperquiz/stop");
    var quizMasterKey = request.get(quizKeyHeader);
    if ( quizMasterKey ) {
        var isStopped = quizMaster.stopQuiz(quizMasterKey);
        if ( isStopped ) {
            return response.status(200).json({"isStopped": isStopped});
        }
        return response.status(403).json({"error": "You are not authorized to stop the game"});
    }
    return response.status(422).json( { "error": "No key provided"});
});

app.post('/prosperquiz/pause', function(request, response) {
    console.log("New POST request received to /prosperquiz/pause");
    var quizMasterKey = request.get(quizKeyHeader);
    if ( quizMasterKey ) {
        var isPaused = quizMaster.pauseQuiz(quizMasterKey);
        if ( isPaused ) {
            return response.status(200).json({"isPaused": isPaused});
        }
        return response.status(403).json({"error":"You are not authorized to pause the game"});
    }
    return response.status(422).json( { "error": "No key provided"});
});

app.post('/prosperquiz/test/data', function(request, response) {
    console.log("New POST request received to /prosperquiz/test/data");
    var quizMasterKey = request.get(quizKeyHeader);
    if ( quizMasterKey ) {
        var didGenerateData = quizMaster.generateTestData(quizMasterKey);
        if ( didGenerateData ) {
            return response.status(200).json({"didGenerateData": didGenerateData});
        }
        return response.status(403).json({"error":"You are not authorized to generate test data"});
    }
    return response.status(422).json( { "error": "No key provided"});
});

var portNumber = 34343;
app.listen(portNumber);
console.log('Server started and listening on port ['+portNumber+']...');
