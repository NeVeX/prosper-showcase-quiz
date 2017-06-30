$( document ).ready(function() {
    init();
});

var quizMasterKey;

function init() {

    $("#scores-div").hide();

    console.log( "question-control.js activated" );
    quizMasterKey = localStorage.getItem("quiz-master-key"); // may or may not be set

    var startQuestion = 1;
    var queryStartOverride = getParameterByName("start");
    if ( queryStartOverride ) {
        startQuestion = parseInt(queryStartOverride);
    }
    console.log("Starting question from "+startQuestion);
    getQuestion(startQuestion);
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

function resetHiddenAnswers() {
    $("#answer-div-one").fadeTo(1, 1);
    $("#answer-div-two").fadeTo(1, 1);
    $("#answer-div-three").fadeTo(1, 1);
    $("#answer-div-four").fadeTo(1, 1);
    $("#timer-text").fadeTo(1, 1);
}

function onQuizDataReturned(questionNumber, data) {

    console.log("Got data back from quiz api: "+data);
    // show the question for a moment
    $("#question-text").html(data.question);

    $("#answer-text-one").html(data.answerOne);
    $("#answer-text-two").html(data.answerTwo);
    var howManyQuestionsInPlay = 2;

    if ( data.answerThree) {
        howManyQuestionsInPlay++;
        $("#answer-text-three").html(data.answerThree);
    } else {
        hideAnswerDiv(3, 1);
    }
    if ( data.answerFour) {
        howManyQuestionsInPlay++;
        $("#answer-text-four").html(data.answerFour);
    } else {
        hideAnswerDiv(4, 1);
    }
    var isMoreQuestions = questionNumber < data.totalQuestions;

    if ( questionNumber > 1 ) {
        setTimeout(showAllTheAnswers, 3000, questionNumber, data, howManyQuestionsInPlay, isMoreQuestions);
    } else {
        showAllTheAnswers(questionNumber, data, howManyQuestionsInPlay, isMoreQuestions);
    }
}

function showAllTheAnswers(questionNumber, data, howManyQuestionsInPlay, isMoreQuestions) {
    // Reset everything from the previous round
    resetHiddenAnswers();

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
            onTimeElapsedForQuestion(currentQuestion, isMoreQuestions);
        }
    },1000);

    getAnswerToQuestionAndStartTimers(currentQuestion, howManyQuestionsInPlay, timeForEachQuestionMs);
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
        return "#answer-div-one";
    }
    if ( number === 2) {
        return "#answer-div-two";
    }
    if ( number === 3) {
        return "#answer-div-three";
    }
    if ( number === 4) {
        return "#answer-div-four";
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

function hideAnswerDiv(answerNumber, timeToFade) {
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

function onTimeElapsedForQuestion(currentQuestion, isMoreQuestions) {
    // show the correct answer
    $("#timer-text").fadeTo(1, 0);
    pauseQuiz();
    $.ajax({
        type: "GET",
        headers: { "Quiz-Key" : quizMasterKey },
        url: "answers?number="+currentQuestion,
        success: function(data) {
            onAnswerToQuestionReturned(data.answer, currentQuestion, isMoreQuestions);
        },
        error: function(error) {
            if ( quizMasterKey ) {
                onError(error);
            } else {
                onAnswerToQuestionReturned("** You cannot know the answer **", currentQuestion, isMoreQuestions);
            }
        }
    });
}

function onAnswerToQuestionReturned(answer, currentQuestion, isMoreQuestions) {

    // hide the other divs
    var i;
    for ( i = 1; i <= 4; i++) {
        if ( !(i === answer)) {
            hideAnswerDiv(i, 1000);
        }
    }

    var showAnswerInterval = setInterval(function() {
        clearInterval(showAnswerInterval); // stop it
        hideAnswerDiv(answer, 1);
        if ( isMoreQuestions) {
            getQuestion(currentQuestion + 1); // go to the next question
        } else {
            onGameOver();
        }
    },5000); // show it for 5 seconds
}

function pauseQuiz() {
    $.ajax({
        type: "POST",
        url: "pause",
        headers: { "Content-Type": "application/json", "Quiz-Key" : quizMasterKey },
        success: function(data) {
            console.log("Response to pausing game: "+data.message);
        },
        error: function(error) {
            if ( quizMasterKey /*&& !(error.status === 403)*/) {
                onError("Could not pause game");
            } else {
                console.log("Error response occurred, but we don't care");
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

    $("#question-text").html("Game Over!<br>Now calculating the results...");
    $("#answer-div-one").hide();
    $("#answer-div-two").hide();
    $("#answer-div-three").hide();
    $("#answer-div-four").hide();
    $("#timer-text").hide();
    $("#help-text-div").hide();
    // Give the illusion of anticipation
    setTimeout(fetchScoresOnGameOver, 6000);
}

function fetchScoresOnGameOver() {
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
                scoresHtml += "<h1><b class=\"score-amount-number\">" + k + " Points</b>" + scoresAsKey[k].join(', ') + "</h1><br><br>";
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