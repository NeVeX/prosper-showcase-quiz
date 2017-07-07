
var QUIZ_SLACK_TOKEN = "MwU4GkhdkJS88MWMS0JsLqlI";
var QUIZ_INTERACTIVE_SLACK_TOKEN = "ZeCyYAq4NvlpMGmoP5ZxIQd8";
var APPLICATION_SLACK_OAUTH_TOKEN = "";
var questionService = require('./questions-service');
var request = require('request');

var slackUserInfo = {};

exports.slackAnswer = function (request, response) {
    console.log("New POST request received to /prosperquiz/slack");

    var token = request.body.token;
    var authResponse = checkSlackRequestAuthentication(token, response);
    if ( authResponse ) {
        return;
    }

    var name = request.body.user_name;
    var answer = request.body.text;
    recordSlackAnswer(name, answer, response);
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
    // var slackQuestionToSend = {
    var slackQuestion = questionInformation.question;
    var slackAttachments = [ {
            text: answersRawText,
            fallback: "Something went wrong",
            callback_id: "slack",
            color: "#3AA3E3",
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

                request.post({
                    url:'https://slack.com/api/chat.postMessage',
                    form: {
                        token: APPLICATION_SLACK_OAUTH_TOKEN,
                        channel: channelId,
                        text: slackQuestion,
                        attachments: JSON.stringify(slackAttachments)
                    }},
                    function( error, httpResponse, body) {
                        console.log("error: "+error+"\nresponse: "+httpResponse+"\nbody: "+body);
                        if (error) {
                            console.log("There was an error sending the data to slack for the new question: "+JSON.stringify(error));
                        } else {
                            console.log("Successfully sent new question to slack");
                        }
                    });
            // Slack won't allow lots of responses in 30 minutes using response_urls :-(
            // request({
            //     url: responseUrl,
            //     method: "POST",
            //     json: true,
            //     body: slackQuestionToSend
            // }, function (error, response, body) {
            //     if (error) {
            //         console.log("There was an error sending the data to slack for the new question: "+JSON.stringify(error));
            //     } else {
            //         console.log("Successfully sent new question to slack");
            //     }
            // });
        }
    }


};

function checkSlackRequestAuthentication(token, response) {
    if ( token && ( token === QUIZ_SLACK_TOKEN || token === QUIZ_INTERACTIVE_SLACK_TOKEN) ) {
        console.log("Slack authentication passed");
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
    console.log("Updated slack user info for user ["+name+"] - response url ["+channelId+"]");
}

exports.slackInteractive = function (request, response) {

    console.log("New POST request received to /prosperquiz/testing");

    var token = request.body.token;

    console.log("Payload: "+JSON.stringify(request.body));

    var authResponse = checkSlackRequestAuthentication(token, response);
    if ( authResponse ) {
        return;
    }

    var textEntered = request.body.text;
    if ( ! textEntered ) {
        // For slack we respond with 200
        return response.status(200).json( { text: "You didn't provide a command"} );
    }

    var name = request.body.user_name;
    if ( !name ) {
        return response.status(422).json( { text: "No username provided"} );
    }
    var channelId = request.body.channel_id;
    textEntered = textEntered.trim();
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
        return response.status(200).json({ text: "Hmmm - You shouldn't of gotten here"})
    }
};

exports.slackInteractiveAnswer = function (request, response) {
    console.log("New request received to slackInteractiveAnswer");

    // Slack gives the request body as a single x-www-url-encoded key called "payload" that contains
    // JSON that's also encoded - so it's a bit fucked
    // Here I just rely on JSON library to parse and handle the encoding (escaping) madness
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

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
