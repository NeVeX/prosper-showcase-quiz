
var QUIZ_SLACK_TOKEN = process.env.PROSPER_QUIZ_SLACK_KEY;
var APPLICATION_SLACK_OAUTH_TOKEN = process.env.PROSPER_QUIZ_APPLICATION_OAUTH_TOKEN;

if (!APPLICATION_SLACK_OAUTH_TOKEN) {
    throw new Error("No application oauth token defined");
}

if (!QUIZ_SLACK_TOKEN) {
    throw new Error("No application quiz key defined");
}

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
    var userId = request.body.user_id;
    if ( !userId) {
        return response.status(422).json( { text: "No userId provided"} );
    }
    var slashCommandChannelId = request.body.channel_id;
    // check the text entered
    if ( textEntered === 'play') {
        console.log("Player ["+name+"] with userId ["+userId+"] has opted to join the quiz");
        updateSlackUserInfo(name, true, userId, slashCommandChannelId);
        return response.status(200).json( { text: "Hurrah! You're now part of the interactive quiz - good luck!"} );
    } else if ( textEntered === 'stop') {
        console.log("Player ["+name+"] has opted to stop playing in the the quiz");
        removeSlackUserFromQuiz(name);
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
            var personalChannelId = slackUserInfo[slackName].personalChannelId;
            var wantsToPlay = slackUserInfo[slackName].wantsToPlay;
            if ( !personalChannelId || !wantsToPlay ) {
                continue; // don't annoy this person
            }

            // Slack won't allow lots of responses in 30 minutes using response_urls :-(
            request.post({
                url:'https://slack.com/api/chat.postMessage',
                form: {
                    token: APPLICATION_SLACK_OAUTH_TOKEN,
                    channel: personalChannelId,
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

function updateSlackUserInfo(name, wantsToPlay, userId, slashCommandChannelId) {
    if ( !(name in slackUserInfo) ) {
        slackUserInfo[name] = {};
    }
    var playerInfo = {};
    playerInfo.wantsToPlay = wantsToPlay;
    playerInfo.userId = userId;
    playerInfo.slashCommandChannelId = slashCommandChannelId;
    slackUserInfo[name] = playerInfo;

    setPersonalChannelIdForUser(playerInfo);
    setProfileInfoForUser(playerInfo);
}

function removeSlackUserFromQuiz(name) {
    if (slackUserInfo.hasOwnProperty(name)) {
        var userInfo = slackUserInfo[name];
        userInfo.personalChannelId = null;
        userInfo.slashCommandChannelId = null;
        userInfo.wantsToPlay = false;
    }
}

function setPersonalChannelIdForUser(playerInfo) {
    console.log("Getting personal IM channel for player user id ["+playerInfo.userId+"]");
    // We need to open an IM to the user and get the channel info to participate in the quiz
    request.post({
        url:'https://slack.com/api/im.open',
        form: {
            token: APPLICATION_SLACK_OAUTH_TOKEN,
            return_im: false,
            user: playerInfo.userId
        }},
        function( error, httpResponse, body) {
            if (error) {
                console.log("There was an error trying to get the personal channel id for user Id ["+playerInfo.userId+"]: "+JSON.stringify(error));
            } else {
                if ( body ) {
                    var parsedBody = JSON.parse(body);
                    if ( parsedBody && parsedBody.channel && parsedBody.channel.id) {
                        playerInfo.personalChannelId = parsedBody.channel.id;
                        if ( !playerInfo.slashCommandChannelId || (playerInfo.slashCommandChannelId != playerInfo.personalChannelId)) {
                            sendSimpleSlackMessageToChannel(playerInfo.personalChannelId, "Hi there - so just letting you know, we'll play the quiz in this channel");
                        }
                    }
                }
            }
        }
    );
}


function setProfileInfoForUser(playerInfo) {
    console.log("Getting profile info for player user id ["+playerInfo.userId+"]");

    request.post({
        url:'https://slack.com/api/users.profile.get',
        form: {
            token: APPLICATION_SLACK_OAUTH_TOKEN,
            include_labels: false,
            user: playerInfo.userId
        }},
    function( error, httpResponse, body) {
        if (error) {
            console.log("There was an error trying to get the profile info for user Id ["+playerInfo.userId+"]: "+JSON.stringify(error));
        } else {
            if ( body ) {
                var parsedBody = JSON.parse(body);
                if ( !parsedBody ) { return }

                var firstName = parsedBody.profile.first_name;
                var lastName = parsedBody.profile.last_name;
                var email = parsedBody.profile.email; // might need this later...
                if ( firstName && lastName ) {
                    playerInfo.firstName = firstName;
                    playerInfo.lastName = lastName;
                }
            }
        }
    });
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

exports.updateCurrentScoresWithUserInfo = function (currentScores) {
    console.log("Updating current scores with more user info");
    // current scores is an array
    for ( var score in currentScores ) {
        if ( currentScores.hasOwnProperty(score)) {
            var slackName = currentScores[score].name;
            // try and find this name in the player info we have
            if (slackUserInfo.hasOwnProperty(slackName)) {
                var playerInfo = slackUserInfo[slackName];
                if (playerInfo.firstName && playerInfo.lastName) {
                    // set this new information on the current score
                    currentScores[score].name = playerInfo.firstName + " " + playerInfo.lastName;
                }
            }
        }
    }
    return currentScores; // return the (possibly) updated data
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
            var personalChannelId = slackUserInfo[slackName].personalChannelId;
            var wantsToPlay = slackUserInfo[slackName].wantsToPlay;
            if ( !personalChannelId || !wantsToPlay ) {
                continue; // they stopped already
            }

            // Slack won't allow lots of responses in 30 minutes using response_urls :-(
            var message = "The quiz is now over - thanks for playing, I hope you had fun!";
            sendSimpleSlackMessageToChannel(personalChannelId, message);
            slackUserInfo[slackName].wantsToPlay = false;
            slackUserInfo[slackName].personalChannelId = null;
        }
    }
};

function sendSimpleSlackMessageToChannel(channelId, message) {
    request.post({
            url:'https://slack.com/api/chat.postMessage',
            form: {
                token: APPLICATION_SLACK_OAUTH_TOKEN,
                channel: channelId,
                text: message
            }},
        function( error, httpResponse, body) {
            if (error) {
                console.log("There was an error sending a chat.postMessage to slack: "+JSON.stringify(error));
            }
        });
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
