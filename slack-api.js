
var QUIZ_SLACK_TOKEN = "0FJvX68ua7K4K6WWaJ5WMYWt";
var APPLICATION_SLACK_OAUTH_TOKEN = "";
var questionService = require('./questions-service');
var request = require('request');

var slackUserInfo = {};

exports.slackInteractive = function (request, response) {
    var token = request.body.token;

    var authResponse = checkSlackRequestAuthentication(token, response);
    if ( authResponse ) {
        return;
    }

    var textEntered = request.body.text;
    if ( textEntered ) {
        textEntered = textEntered.trim(); // trim it
    }
    if ( ! textEntered ) {
        // For slack we respond with 200
        return response.status(200).json( { text: "You didn't provide any command text. e.g. '/quiz play'"} );
    }

    var name = request.body.user_name;
    if ( !name ) {
        return response.status(422).json( { text: "No username provided"} );
    }
    var channelId = request.body.channel_id;
    // check the text entered
    if ( textEntered === 'play') {
        console.log("Player ["+name+"] has opted to join the quiz");
        updateSlackUserInfo(name, true, channelId);
        return response.status(200).json( { text: "Woohoo - you've entered into the interactive quiz!"} );
    } else if ( textEntered === 'stop') {
        console.log("Player ["+name+"] has opted to stop playing in the the quiz");
        updateSlackUserInfo(name, false, null);
        return response.status(200).json( { text: "Ok - I won't annoy you anymore with this quiz"} );
    }
    else {
        // We'll just treat this like they are answering normally (i.e. /quiz 2)
        return recordSlackAnswer(name, textEntered, response);
    }
};


exports.sendNewQuestionToSlackUsers = function (questionInformation) {
    console.log("Sending new question to slack users");
    var answersRawText = "1. "+questionInformation.answerOne+"\n2. "+questionInformation.answerTwo;
    var availableActions = [
        {
            name: "answer",
            text: "Answer 1",
            type: "button",
            value: "1"
        },
        {
            name: "answer",
            text: "Answer 2",
            type: "button",
            value: "2"
    }];
    if ( questionInformation.answerThree) {
        answersRawText += "\n3. "+questionInformation.answerThree;
        availableActions.push({
            name: "answer",
            text: "Answer 3",
            type: "button",
            value: "3"
        });
    }
    if ( questionInformation.answerFour) {
        answersRawText += "\n4. "+questionInformation.answerFour;
        availableActions.push({
            name: "answer",
            text: "Answer 4",
            type: "button",
            value: "4"
        });
    }

    // for each player that is still active and playing - send the question
    var slackQuestion = questionInformation.question;
    var slackAttachments = [ {
            text: answersRawText,
            fallback: "Something went wrong",
            callback_id: "slack",
            color: "#0d1b52",
            attachment_type: "default",
            actions: availableActions
        }];

    for ( var slackName in slackUserInfo ) {
        if (slackUserInfo.hasOwnProperty(slackName)) {
            // Get the url to post to
            var channelId = slackUserInfo[slackName].channelId;
            var wantsToPlay = slackUserInfo[slackName].wantsToPlay;
            if ( !channelId || !wantsToPlay ) {
                continue; // don't annoy this person
            }

            // Slack won't allow lots of responses in 30 minutes using response_urls :-(
            request.post({
                url:'https://slack.com/api/chat.postMessage',
                form: {
                    token: APPLICATION_SLACK_OAUTH_TOKEN,
                    channel: channelId,
                    text: slackQuestion,
                    attachments: JSON.stringify(slackAttachments)
                }},
                function( error, httpResponse, body) {
                    if (error) {
                        console.log("There was an error sending the data to slack for the new question: "+JSON.stringify(error));
                    }
                });
        }
    }


};

function checkSlackRequestAuthentication(token, response) {
    if ( token && token === QUIZ_SLACK_TOKEN ) {
        return null; // all good
    } else {
        return response.status(403).json({});
    }
}

function recordSlackAnswer(name, answer, response) {

    if ( !name ) {
        return response.status(422).json({ "error": "No name provided"});
    }
    if ( answer ) {
        answer = answer.trim();
    }
    if ( !answer || !isNumber(answer)) {
        // 200 for slack
        return response.status(200).json({"text": "Looks like you provided an invalid answer number, try again with a valid answer"});
    }

    var scoreResult = questionService.recordPlayerAnswer(name, answer);
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
}

function updateSlackUserInfo(name, wantsToPlay, channelId) {
    if ( !(name in slackUserInfo) ) {
        slackUserInfo[name] = {};
    }
    var playerInfo = {};
    playerInfo.wantsToPlay = wantsToPlay;
    playerInfo.channelId = channelId;
    slackUserInfo[name] = playerInfo;
}

exports.slackInteractiveAnswer = function (request, response) {
    /**
     * Slack gives the request body as a single x-www-url-encoded key called "payload" that contains
     * JSON that's also encoded - so it's a bit fucked
     * So here I just rely on JSON library to parse and handle the encoding (escaping) madness
     */
    var stringifyBody = JSON.stringify(request.body);
    var parsedJson = JSON.parse(stringifyBody);
    var data = JSON.parse(parsedJson.payload);

    var token = data.token;
    var authResponse = checkSlackRequestAuthentication(token, response);
    if ( authResponse ) {
        return;
    }

    var name = data.user.name;
    var answerNumber = data.actions[0].value;
    return recordSlackAnswer(name, answerNumber, response);

};

exports.quizHasStopped = function() {
    if ( !slackUserInfo ) {
        return; // nothing to do
    }
    console.log("The quiz is over - so sending a goodbye to everyone that participated");
    // don't send any more updates to people
    for ( var slackName in slackUserInfo ) {
        if (slackUserInfo.hasOwnProperty(slackName)) {
            // Get the url to post to
            var channelId = slackUserInfo[slackName].channelId;
            var wantsToPlay = slackUserInfo[slackName].wantsToPlay;
            if ( !channelId || !wantsToPlay ) {
                continue; // they stopped already
            }

            // Slack won't allow lots of responses in 30 minutes using response_urls :-(
            request.post({
                    url:'https://slack.com/api/chat.postMessage',
                    form: {
                        token: APPLICATION_SLACK_OAUTH_TOKEN,
                        channel: channelId,
                        text: "The quiz is now over - thanks for playing!"
                    }},
                function( error, httpResponse, body) {
                    if (error) {
                        console.log("There was an error sending the data to slack for the end of the quiz: "+JSON.stringify(error));
                    }
                });
            slackUserInfo[slackName] = {}; // remove the info
        }
    }
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
