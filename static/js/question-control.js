$( document ).ready(function() {
    init();
});

var QUESTION_SHOWN_WITHOUT_ANSWERS_PER_CHARACTER_SIZE = 18;
var CORRECT_ANSWER_SHOWN_TIME_MS = 3500;
var SHOW_GAME_OVER_TIME_MS = 5500;
var SHOW_STATS_TIME_MS = 6500;
var ANSWER_WRONG_CLASS_NAME = "answer-wrong";
var ANSWER_RIGHT_CLASS_NAME = "answer-right";

var ANSWER_DIV_ONE = "#answer-div-one";
var ANSWER_DIV_TWO = "#answer-div-two";
var ANSWER_DIV_THREE = "#answer-div-three";
var ANSWER_DIV_FOUR = "#answer-div-four";

var ANSWER_QUESTION_PREFIX = "#answer-prefix-";
var ANSWER_PREFIX = "#answer-text-";
var ANSWER_STAT_PREFIX = "#answer-percent-stat-";
var FASTEST_ANSWER_DIV = "#fastest-player-answer-div";
var FASTEST_ANSWER_PLAYER_NAME = "#fastest-answer-player-name";

var quizMasterKey;

function init() {

    $("#scores-div").hide();

    fadeAllAnswerDivsToOpacityZero();
    $("#timer-text").fadeTo(1, 0);
    // hideChart();

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
    setupCheckForRegisteredPlayers(onUpdatedPlayersRegisteredAmount);
    getQuestion(startQuestion);
}

function onUpdatedPlayersRegisteredAmount(amount) {
    $(PLAYERS_REGISTERED_ID).text(amount);
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

function onQuizDataReturned(questionNumber, data) {

    resetAllAnswersForNewQuestion();

    console.log("Got data back from quiz api: "+data);
    // show the question for a moment
    $("#question-text").html(data.question);
    // hideChart();
    $("#answer-text-one").html(data.answerOne);
    $("#answer-text-two").html(data.answerTwo);
    var howManyQuestionsInPlay = 2;

    if ( data.answerThree) {
        howManyQuestionsInPlay++;
        $("#answer-text-three").html(data.answerThree);
    } else {
        fadeAnswerDivToOpacityZero(3, 1);
    }
    if ( data.answerFour) {
        howManyQuestionsInPlay++;
        $("#answer-text-four").html(data.answerFour);
    } else {
        fadeAnswerDivToOpacityZero(4, 1);
    }
    var isMoreQuestions = questionNumber < data.totalQuestions;

    // determine the dynamic read speed (roughly)
    var timeToWaitMs = 1200;
    if ( data.question.length > QUESTION_SHOWN_WITHOUT_ANSWERS_PER_CHARACTER_SIZE) {
        timeToWaitMs = (data.question.length / QUESTION_SHOWN_WITHOUT_ANSWERS_PER_CHARACTER_SIZE) * 1000;
    }
    console.log("Determined to show the question for a dynamic wait time of ["+timeToWaitMs+"]");

    setTimeout(showAllTheAnswers, timeToWaitMs, questionNumber, data, howManyQuestionsInPlay, isMoreQuestions);
}

function showAllTheAnswers(questionNumber, data, howManyQuestionsInPlay, isMoreQuestions) {
    sendQuestionToSlackUsers(questionNumber, function () {
        unPauseTheQuiz();
        // Reset everything from the previous round
        showAllAnswers();
        startAllTheTimers(data, howManyQuestionsInPlay, questionNumber, isMoreQuestions);
    });
}

function startAllTheTimers(questionData, howManyQuestionsInPlay, currentQuestion, isMoreQuestions) {

    var timeAllowedSeconds = questionData.timeAllowedSeconds;
    var timeForEachQuestionMs = ((timeAllowedSeconds * 0.70) / (howManyQuestionsInPlay-2)) * 1000;
    console.log("Time (ms) allowed for each question: "+timeForEachQuestionMs);

    var timeLeft = timeAllowedSeconds;
    $("#timer-text").text(timeLeft);

    var checkForFastestPlayerInterval = setInterval(function () {
        getStatsForQuestion(currentQuestion,
            function (data) {
                if ( data && data.fastestPlayerToCorrectlyAnswer ) {
                    console.log("Got a fastest player answer ["+data.fastestPlayerToCorrectlyAnswer+"]");
                    clearInterval(checkForFastestPlayerInterval);

                    $(FASTEST_ANSWER_PLAYER_NAME).text(data.fastestPlayerToCorrectlyAnswer);
                    $(FASTEST_ANSWER_DIV).fadeTo(0, 1);
                }
            },
            function (error) {
                if ( quizMasterKey ) {
                    onError(error);
                }
            }
        );
    }, 250);

    var timeLeftInterval = setInterval(function() {
        $("#timer-text").text(timeLeft--);
        if(timeLeft < 0) {
            console.log("This round is now over");
            clearInterval(timeLeftInterval);
            clearInterval(checkForFastestPlayerInterval); // stop trying to get the fastest person
            onTimeElapsedForQuestion(currentQuestion, isMoreQuestions, howManyQuestionsInPlay);
        }
    }, 1000);

    getAnswerToQuestionAndStartTimers(questionData, currentQuestion, howManyQuestionsInPlay, timeForEachQuestionMs);
}

function sendQuestionToSlackUsers(questionNumber, onSuccessFunction) {
    console.log("Sending new question ["+questionNumber+"] to slack users");

    $.ajax({
        type: "POST",
        url: "slack/sendquestion",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        data: JSON.stringify( { number: questionNumber } ),
        success: function(data) {
            console.log("Response to sending question ["+questionNumber+"] to slack: "+JSON.stringify(data));
            onSuccessFunction();
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
function getAnswerToQuestionAndStartTimers(questionData, currentQuestion, howManyQuestionsInPlay, timeForEachQuestionMs) {

    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "answers?number="+currentQuestion,
        success: function(data) {
            startQuestionRemovalTimerUsingGivenCorrectAnswer(data.answer, howManyQuestionsInPlay, timeForEachQuestionMs, questionData);
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

function getWordForNumber(number) {
    if ( number === 1) {
        return "one";
    }
    if ( number === 2) {
        return "two";
    }
    if ( number === 3) {
        return "three";
    }
    if ( number === 4) {
        return "four";
    }
}

function startQuestionRemovalTimerUsingGivenCorrectAnswer(answerNumber, howManyQuestionsInPlay, timeForEachQuestionMs, questionData) {

    var answerNumbersThatCanBeRemoved = [];
    var randomizeAnswerRemoval = true;
    if ( !questionData && !questionData.answerRemovals && questionData.answerRemovals.length == 0 ) {
        // Let's randomly assign which answers to remove over time
        var i;
        for (i = 1; i <= 4; i++) {
            if (!(answerNumber === i) && i <= howManyQuestionsInPlay) {
                answerNumbersThatCanBeRemoved.push(i);
            }
        }
        console.log("Randomly calculated the answers to remove as: "+questionData.answerRemovals);
    } else {
        console.log("Using the provided answers to remove array: "+questionData.answerRemovals);
        // Let's just use the given data instead of trying to randomize
        answerNumbersThatCanBeRemoved = questionData.answerRemovals;
        randomizeAnswerRemoval = false;
    }

    var fadeOutAnswerInterval = setInterval(function() {
        if ( howManyQuestionsInPlay <= 2) {
            clearInterval(fadeOutAnswerInterval); // stop it
            console.log("Only 2 or fewer questions remain - not fading anymore");
            return; // nothing to do
        }
        var answerNumberToMarkWrong;
        if ( randomizeAnswerRemoval ) {
            // randomize!
            var randomIndexToRemove = Math.floor(Math.random() * answerNumbersThatCanBeRemoved.length);
            answerNumberToMarkWrong = answerNumbersThatCanBeRemoved[randomIndexToRemove];
        } else {
            // just take the first element - it will be the "next" to mark as removable
            answerNumberToMarkWrong = answerNumbersThatCanBeRemoved[0];
        }

        console.log("Will mark answer div: "+answerNumberToMarkWrong+" as wrong");
        // $(itemDivId).animate({ opacity: 0 }); // fade it out, but keep the elements in tact (no fadeOut)
        reduceAnswerScoreAmount();

        // $(itemDivId).fadeTo(1550, 0);
        // $(itemDivId).addClass(ANSWER_WRONG_CLASS_NAME);

        addWrongAnswerClassToQuestion(answerNumberToMarkWrong);

        --howManyQuestionsInPlay; // less questions in play now

        // Remove the item from the array now
        var indexOfDiv = answerNumbersThatCanBeRemoved.indexOf(answerNumberToMarkWrong);
        if(indexOfDiv != -1) {
            answerNumbersThatCanBeRemoved.splice(indexOfDiv, 1);
        }
    }, timeForEachQuestionMs);

}

function removeWrongAnswerClassToQuestion(questionNumber) {
    changeWrongClassForAnswer(questionNumber, false, ANSWER_WRONG_CLASS_NAME);
}

function addWrongAnswerClassToQuestion(questionNumber) {
    changeWrongClassForAnswer(questionNumber, true, ANSWER_WRONG_CLASS_NAME);
}

function removeRightAnswerClassToQuestion(questionNumber) {
    changeWrongClassForAnswer(questionNumber, false, ANSWER_RIGHT_CLASS_NAME);
}

function addRightAnswerClassToQuestion(questionNumber) {
    changeWrongClassForAnswer(questionNumber, true, ANSWER_RIGHT_CLASS_NAME);
}

function changeWrongClassForAnswer(questionNumber, isAddingClass, className) {

    var questionPrefix = ANSWER_QUESTION_PREFIX + getWordForNumber(questionNumber);
    var answer = ANSWER_PREFIX + getWordForNumber(questionNumber);
    var stats = ANSWER_STAT_PREFIX + getWordForNumber(questionNumber);

    if ( isAddingClass ) {
        $(questionPrefix).addClass(className);
        $(answer).addClass(className);
        $(stats).addClass(className);
    } else {
        $(questionPrefix).removeClass(className);
        $(answer).removeClass(className);
        $(stats).removeClass(className);
    }
}

function fadeAllAnswerDivsToOpacityZero() {
    fadeAnswerDivToOpacityZero(1, 1);
    fadeAnswerDivToOpacityZero(2, 1);
    fadeAnswerDivToOpacityZero(3, 1);
    fadeAnswerDivToOpacityZero(4, 1);

    $(FASTEST_ANSWER_DIV).fadeTo(0, 0);

}

function showAllAnswers() {
    $("#all-questions-div").fadeTo(1, 1);

    $(ANSWER_DIV_ONE).fadeTo(1, 1);
    $(ANSWER_DIV_TWO).fadeTo(1, 1);
    $(ANSWER_DIV_THREE).fadeTo(1, 1);
    $(ANSWER_DIV_FOUR).fadeTo(1, 1);
    $("#timer-text").fadeTo(1, 1);
}

function resetAllAnswersForNewQuestion() {
    hideAllAnswers();

    removeWrongAnswerClassToQuestion(1);
    removeWrongAnswerClassToQuestion(2);
    removeWrongAnswerClassToQuestion(3);
    removeWrongAnswerClassToQuestion(4);

    removeRightAnswerClassToQuestion(1);
    removeRightAnswerClassToQuestion(2);
    removeRightAnswerClassToQuestion(3);
    removeRightAnswerClassToQuestion(4);

    $(ANSWER_STAT_PREFIX+getWordForNumber(1)).text("");
    $(ANSWER_STAT_PREFIX+getWordForNumber(2)).text("");
    $(ANSWER_STAT_PREFIX+getWordForNumber(3)).text("");
    $(ANSWER_STAT_PREFIX+getWordForNumber(4)).text("");

}

function hideAllAnswers() {
    $("#all-questions-div").fadeTo(0, 0); // maintain space in browser (don't collapse)
    $(FASTEST_ANSWER_PLAYER_NAME).text("");
    $(FASTEST_ANSWER_DIV).fadeTo(0, 0);
}


function fadeAnswerDivToOpacityZero(answerNumber, timeToFade) {
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

    // mark the other divs as wrong
    var i;
    for ( i = 1; i <= 4; i++) {
        if ( !(i === answer)) {
            // fadeAnswerDivToOpacityZero(i, 1000);
            addWrongAnswerClassToQuestion(i);
        } else {
            addRightAnswerClassToQuestion(i);
        }
    }

    var showAnswerInterval = setInterval(function() {
        clearInterval(showAnswerInterval); // stop it
        // fadeAnswerDivToOpacityZero(answer, 1);
        // hideAllAnswers();
        getStatsForQuestion(currentQuestion,
            function (data) {
                showStats(data, currentQuestion, isMoreQuestions);
            },
            function (error) {
                if ( quizMasterKey ) {
                    onError(error);
                }
            }
        );

    }, CORRECT_ANSWER_SHOWN_TIME_MS); // show it for a moment
}

function getStatsForQuestion(currentQuestion, onSuccess, onFailure) {
    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "stats?number="+currentQuestion,
        success: function(data) {
            onSuccess(data);
        },
        error: function(error) {
            onFailure(error);
        }
    });
}

function showStats(stats, currentQuestion, isMoreQuestions) {

    if ( stats ) {
        var percentOne = stats.answerOnePercent ? stats.answerOnePercent : 0;
        var percentTwo = stats.answerTwoPercent ? stats.answerTwoPercent : 0;
        var percentThree = stats.answerThreePercent ? stats.answerThreePercent : 0;
        var percentFour = stats.answerFourPercent ? stats.answerFourPercent : 0;

        $(ANSWER_STAT_PREFIX+getWordForNumber(1)).text(percentOne+"%");
        $(ANSWER_STAT_PREFIX+getWordForNumber(2)).text(percentTwo+"%");
        $(ANSWER_STAT_PREFIX+getWordForNumber(3)).text(percentThree+"%");
        $(ANSWER_STAT_PREFIX+getWordForNumber(4)).text(percentFour+"%");
    }

    setTimeout(function () {
        if ( isMoreQuestions) {
            getQuestion(currentQuestion + 1); // go to the next question
        } else {
            onGameOver();
        }
    }, SHOW_STATS_TIME_MS); // Leave the chart on screen for a certain amount of time
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
    stopCheckForRegisteredPlayers();
    $("#question-text").html("Quiz Over!<br>Now calculating the results...");
    fadeAllAnswerDivsToOpacityZero();
    $("#help-text-div").hide();
    $("#answers-and-chart-div").hide();
    // hideChart();
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
    var noAnswersHtml = '<h2>No answers were given!</h2>';
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
            $(scoresTextId).html(noAnswersHtml);
        } else {
            var keys = Object.keys(scoresAsKey);
            var i;
            // keys.reverse(); - does a lexicographical, which when using negative numbers, makes this go out of whack
            keys.sort( function(a,b) { return b - a; }); // sort in reverse order (highest number first)
            var scoresHtml = "";
            for (i = 0; i < keys.length; i++) {
                var k = keys[i];
                scoresHtml += "<h1><b class=\"score-amount-number\">" + k + " Points.</b>" + scoresAsKey[k].join(', ') + "</h1><br><br>";
            }
            $(scoresTextId).html(scoresHtml);
        }
    } else {
        $(scoresTextId).html(noAnswersHtml);
    }
}

function onError(error) {
    console.log("Error occurred: "+error);
    alert("An error occurred! Lol!");
}

