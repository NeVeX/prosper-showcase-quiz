$( document ).ready(function() {
    init();
});

var QUESTION_SHOWN_WITHOUT_ANSWERS_TIME_MS = 5000;
var CORRECT_ANSWER_SHOWN_TIME_MS = 3000;
var SHOW_GAME_OVER_TIME_MS = 5500;

var ANSWER_DIV_ONE = "#answer-div-one";
var ANSWER_DIV_TWO = "#answer-div-two";
var ANSWER_DIV_THREE = "#answer-div-three";
var ANSWER_DIV_FOUR = "#answer-div-four";

var quizMasterKey;

function init() {

    $("#scores-div").hide();
    fadeAllAnswers();
    $("#timer-text").fadeTo(1, 0);
    hideChart();

    console.log( "question-control.js activated" );
    quizMasterKey = localStorage.getItem("quiz-master-key"); // may or may not be set

    var startQuestion = 1;
    var queryStartOverride = getParameterByName("start");
    if ( queryStartOverride ) {
        startQuestion = parseInt(queryStartOverride);
    }
    console.log("Starting question from "+startQuestion);
    if ( startQuestion === 1) {
        startNewQuiz(); // only start new quiz on question 1
    }
    getQuestion(startQuestion);
}

function startNewQuiz() {
    console.log("Starting a new quiz");
    $.ajax({
        type: "POST",
        headers: { "Quiz-Key" : quizMasterKey},
        url: "start",
        success: function(data) {
            console.log("Quiz started response: "+JSON.stringify(data));
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error); // only error on when we are the quiz master
            }
        }
    })
}

function getQuestion(questionNumber) {
    console.log("Getting question "+questionNumber);
    $.ajax({
		type: "GET",
        headers: { "Quiz-Key" : quizMasterKey},
		url: "questions?number="+questionNumber,
		success: function(data) {
            onQuizDataReturned(questionNumber, data);
		},
		error: function(error) {
            onError(error);
        }
	})	
}

function fadeAllAnswers() {
    fadeAnswerDiv(1, 1);
    fadeAnswerDiv(2, 1);
    fadeAnswerDiv(3, 1);
    fadeAnswerDiv(4, 1);
}

function fadeAllAnswersToVisible() {
    $(ANSWER_DIV_ONE).fadeTo(1, 1);
    $(ANSWER_DIV_TWO).fadeTo(1, 1);
    $(ANSWER_DIV_THREE).fadeTo(1, 1);
    $(ANSWER_DIV_FOUR).fadeTo(1, 1);
    $("#timer-text").fadeTo(1, 1);
}

function showAllAnswers() {
    $("#all-questions-div").show();
}

function hideAllAnswers() {
    $("#all-questions-div").hide();
}

function onQuizDataReturned(questionNumber, data) {

    console.log("Got data back from quiz api: "+data);
    // show the question for a moment
    $("#question-text").html(data.question);
    hideChart();
    $("#answer-text-one").html(data.answerOne);
    $("#answer-text-two").html(data.answerTwo);
    var howManyQuestionsInPlay = 2;

    if ( data.answerThree) {
        howManyQuestionsInPlay++;
        $("#answer-text-three").html(data.answerThree);
    } else {
        fadeAnswerDiv(3, 1);
    }
    if ( data.answerFour) {
        howManyQuestionsInPlay++;
        $("#answer-text-four").html(data.answerFour);
    } else {
        fadeAnswerDiv(4, 1);
    }
    var isMoreQuestions = questionNumber < data.totalQuestions;

    setTimeout(showAllTheAnswers, QUESTION_SHOWN_WITHOUT_ANSWERS_TIME_MS, questionNumber, data, howManyQuestionsInPlay, isMoreQuestions);

}

function showAllTheAnswers(questionNumber, data, howManyQuestionsInPlay, isMoreQuestions) {
    sendQuestionToSlackUsers(questionNumber);
    unPauseTheQuiz();
    // Reset everything from the previous round
    showAllAnswers();
    fadeAllAnswersToVisible();
    startAllTheTimers(data.timeAllowed, howManyQuestionsInPlay, questionNumber, isMoreQuestions);
}

function startAllTheTimers(timeAllowed, howManyQuestionsInPlay, currentQuestion, isMoreQuestions) {

    var timeForEachQuestionMs = ((timeAllowed * 0.62) / (howManyQuestionsInPlay-2)) * 1000;
    console.log("Time (ms) allowed for each question: "+timeForEachQuestionMs);

    var timeLeft = timeAllowed;
    $("#timer-text").text(timeLeft);
    var timeLeftInterval = setInterval(function() {
        $("#timer-text").text(timeLeft--);
        if(timeLeft < 0) {
            console.log("Timer is done");
            clearInterval(timeLeftInterval);
            onTimeElapsedForQuestion(currentQuestion, isMoreQuestions, howManyQuestionsInPlay);
        }
    }, 1000);

    getAnswerToQuestionAndStartTimers(currentQuestion, howManyQuestionsInPlay, timeForEachQuestionMs);
}

function sendQuestionToSlackUsers(questionNumber) {
    console.log("Sending new question ["+questionNumber+"] to slack users");

    $.ajax({
        type: "POST",
        url: "slack/sendquestion",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        data: JSON.stringify( { number: questionNumber } ),
        success: function(data) {
            console.log("Response to sending question ["+questionNumber+"] to slack: "+JSON.stringify(data));
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError("Could not send question to slack users");
            } else {
                console.log("Error response occurred when sending question to slack users, but we don't care");
            }
        }
    });


}

// TODO: Remove this duplicated code - merge it below
function getAnswerToQuestionAndStartTimers(currentQuestion, howManyQuestionsInPlay, timeForEachQuestionMs) {

    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "answers?number="+currentQuestion,
        success: function(data) {
            startQuestionRemovalTimerUsingGivenCorrectAnswer(data.answer, howManyQuestionsInPlay, timeForEachQuestionMs);
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error);
            }
        }
    });
}

function getAnswerDivIdForNumber(number) {
    if ( number === 1) {
        return ANSWER_DIV_ONE;
    }
    if ( number === 2) {
        return ANSWER_DIV_TWO;
    }
    if ( number === 3) {
        return ANSWER_DIV_THREE;
    }
    if ( number === 4) {
        return ANSWER_DIV_FOUR;
    }
}

function startQuestionRemovalTimerUsingGivenCorrectAnswer(answerNumber, howManyQuestionsInPlay, timeForEachQuestionMs) {

    var answerDivIdsThatCanBeRemoved = [];
    var i;
    for( i = 1; i <= 4; i++) {
        if ( !(answerNumber === i) && i <= howManyQuestionsInPlay ) {
            answerDivIdsThatCanBeRemoved.push(getAnswerDivIdForNumber(i));
        }
    }

    var fadeOutAnswerInterval = setInterval(function() {
        if ( howManyQuestionsInPlay <= 2) {
            clearInterval(fadeOutAnswerInterval); // stop it
            console.log("Only 2 or fewer questions remain - not fading anymore")
            return; // nothing to do
        }
        // randomize!
        var itemToFadeOut = Math.floor(Math.random() * answerDivIdsThatCanBeRemoved.length);
        var itemDivId = answerDivIdsThatCanBeRemoved[itemToFadeOut];
        console.log("Will fade out answer div: "+itemDivId);
        // $(itemDivId).animate({ opacity: 0 }); // fade it out, but keep the elements in tact (no fadeOut)
        reduceAnswerScoreAmount();
        $(itemDivId).fadeTo(1550, 0);
        --howManyQuestionsInPlay; // less questions in play now

        // Remove the item from the array now
        var indexOfDiv = answerDivIdsThatCanBeRemoved.indexOf(itemDivId);
        if(indexOfDiv != -1) {
            answerDivIdsThatCanBeRemoved.splice(indexOfDiv, 1);
        }
    }, timeForEachQuestionMs);

}

function fadeAnswerDiv(answerNumber, timeToFade) {
    $(getAnswerDivIdForNumber(answerNumber)).fadeTo(timeToFade, 0); // hide it
}

function reduceAnswerScoreAmount() {
    // call the server to let it know to reduce the score
    $.ajax({
        type: "PATCH",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "scores",
        success: function(data) {
            console.log("Success returned from down grading the score amount: "+data);
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error);
            } else {
                console.log("Error occurred while trying to down grade the score amount: "+error);
            }
        }
    });
}

function onTimeElapsedForQuestion(currentQuestion, isMoreQuestions, howManyQuestionsInPlay) {
    // show the correct answer
    $("#timer-text").fadeTo(1, 0);
    pauseQuiz();
    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "answers?number="+currentQuestion,
        success: function(data) {
            onAnswerToQuestionReturned(data.answer, currentQuestion, isMoreQuestions, howManyQuestionsInPlay);
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error);
            } else {
                onAnswerToQuestionReturned("** You cannot know the answer **", currentQuestion, isMoreQuestions, howManyQuestionsInPlay);
            }
        }
    });
}

function onAnswerToQuestionReturned(answer, currentQuestion, isMoreQuestions, howManyAnswersInPlay) {

    // hide the other divs
    var i;
    for ( i = 1; i <= 4; i++) {
        if ( !(i === answer)) {
            fadeAnswerDiv(i, 1000);
        }
    }

    var showAnswerInterval = setInterval(function() {
        clearInterval(showAnswerInterval); // stop it
        fadeAnswerDiv(answer, 1);
        hideAllAnswers();
        showChartData(currentQuestion, isMoreQuestions, howManyAnswersInPlay);

    }, CORRECT_ANSWER_SHOWN_TIME_MS); // show it for a 2 seconds
}

function showChartData(currentQuestion, isMoreQuestions, totalAnswersInPlay) {
    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "stats?number="+currentQuestion,
        success: function(data) {

            showChartStatisticsForQuestion(data, totalAnswersInPlay);

            setTimeout(function () {
                if ( isMoreQuestions) {
                    getQuestion(currentQuestion + 1); // go to the next question
                } else {
                    onGameOver();
                }
            }, 6000); // Leave the chart on screen for about 6 seconds
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error);
            }
        }
    });
}

function pauseQuiz() {
    $.ajax({
        type: "POST",
        url: "pause",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        success: function(data) {
            console.log("Response to pausing quiz: "+JSON.stringify(data));
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError("Could not pause quiz");
            } else {
                console.log("Error response occurred to pausing quiz, but we don't care");
            }
        }
    });
}

function unPauseTheQuiz() {
    $.ajax({
        type: "POST",
        url: "unpause",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        success: function(data) {
            console.log("Response to un-pausing quiz: "+JSON.stringify(data));
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError("Could not un-pause quiz");
            } else {
                console.log("Error response occurred to un-pausing quiz, but we don't care");
            }
        }
    });
}


function getParameterByName(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function onGameOver() {
    console.log("GAME OVER");

    $("#question-text").html("Quiz Over!<br>Now calculating the results...");
    fadeAllAnswers();
    $("#help-text-div").hide();
    $("#answers-and-chart-div").hide();
    hideChart();
    // Give the illusion of anticipation
    setTimeout(fetchScoresOnGameOver, SHOW_GAME_OVER_TIME_MS);
}

function fetchScoresOnGameOver() {
    $.ajax({
        type: "GET",
        url: "scores",
        success: function(data) {
            onScoresReturned(data);
        },
        error: function(error) {
            onError(error);
        }
    });

    $.ajax({
        type: "POST",
        url: "stop",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        success: function(data) {
            console.log("Response to stopping game: "+data);
        },
        error: function(error) {
            console.log("Error occurred while asking to stop the game: "+error);
        }
    });
}


function onScoresReturned(scores) {
    var scoresTextId = "#scores-div";
    $("#question-text").text("Here's how the leader board looks");
    $("#scores-div").show();

    if ( scores && scores.length > 0 ) {
        console.log("Scores returned: "+scores);
        var scoresAsKey = { };
        for ( var score in scores) {
            if ( scores.hasOwnProperty(score)) {
                var name = scores[score].name;
                var playerScore = scores[score].score;
                console.log("Score - Name: "+name +" "+playerScore);
                if ( !scoresAsKey[playerScore]) {
                    scoresAsKey[playerScore] = [];
                }
                scoresAsKey[playerScore].push(name);
            }
        }

        if ( scoresAsKey.length == 0) {
            $(scoresTextId).html("No answers where given!");
        } else {
            var keys = Object.keys(scoresAsKey);
            var i;
            keys.reverse();
            var scoresHtml = "";
            for (i = 0; i < keys.length; i++) {
                var k = keys[i];
                scoresHtml += "<h1><b class=\"score-amount-number\">" + k + " Points.</b>" + scoresAsKey[k].join(', ') + "</h1><br><br>";
            }
            $(scoresTextId).html(scoresHtml);
        }
    } else {
        $(scoresTextId).html("No answers where given!");
    }
}


function onError(error) {
    console.log("Error occurred: "+error);
    alert("An error occurred! Lol!");
}