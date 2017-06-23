$( document ).ready(function() {
    init();
});

var questionChangeKey;

function init() {
    console.log( "control.js activated" );
    var startQuestion = 1;
    var queryStartOverride = getParameterByName("start");
    if ( queryStartOverride ) {
        startQuestion = parseInt(queryStartOverride);
    }

    questionChangeKey = getParameterByName("key");
    if ( questionChangeKey ) {
        console.log("Will use the changeQuestionKey ["+questionChangeKey+"]");
    } else {
        console.log("No changeQuestionKey detected");
        questionChangeKey = "";
    }

    console.log("Starting question from "+startQuestion);
    getQuestion(startQuestion);
}

function getQuestion(questionNumber) {
    console.log("Getting question "+questionNumber);
    $.ajax({
		type: "GET",  
		url: "questions?number="+questionNumber+"&key="+questionChangeKey,
		success: function(data) {
            onQuizDataReturned(questionNumber, data);
		},
		error: function(error) {
            onError(error);
        }
	})	
}

function onQuizDataReturned(questionNumber, data) {
    console.log("Got data back from quiz api");
    // So this is a terrible way to set html - but feck it, I have to see if this whole app will even work
    // so for now, setting this here in a terrible way. Forgive me.
    console.log(data);
    $("#question").html("<b>Question "+ questionNumber +":</b> "+data.question);
    $("#answer-one").html("<b style=\"margin-right: 15px\">Answer 1:</b> "+data.answerOne);
    $("#answer-two").html("<b style=\"margin-right: 15px\">Answer 2:</b> "+data.answerTwo);
    if ( data.answerThree) {
        $("#answer-three").html("<b style=\"margin-right: 15px\">Answer 3:</b> "+data.answerThree);
    } else {
        $("#answer-three").html("");
    }
    if ( data.answerFour) {
        $("#answer-four").html("<b style=\"margin-right: 15px\">Answer 4: </b>"+data.answerFour);
    } else {
        $("#answer-four").html("");
    }

    var isMoreQuestions = questionNumber < data.totalQuestions;
    startTimer(data.timeAllowed, questionNumber, isMoreQuestions);
}

function startTimer(timeAllowed, currentQuestion, isMoreQuestions) {
    var timeLeft = 3;
    $("#timer").html(timeLeft);
    var timeLeftInterval = setInterval(function() {
        $("#timer").html(timeLeft--);
        if(timeLeft < 0) {
            console.log("Timer is done");
            clearInterval(timeLeftInterval);
            onTimeElapsedForQuestion(currentQuestion, isMoreQuestions);
        }
    },1000);
}

function onTimeElapsedForQuestion(currentQuestion, isMoreQuestions) {
    // show the correct answer
    $("#timer").html(""); // hide the timer
    pauseQuiz();
    $.ajax({
        type: "GET",
        url: "answers?number="+currentQuestion+"&key="+questionChangeKey,
        success: function(data) {
            $("#timer").html("Correct answer: "+data.answer); // Use the timer to show the correct answer
            var showAnswerInterval = setInterval(function() {
                clearInterval(showAnswerInterval); // stop it
                if ( isMoreQuestions) {
                    getQuestion(currentQuestion + 1); // go to the next question
                } else {
                    onGameOver();
                }
            },5000); // show it for 5 seconds
        },
        error: function(error) {
            onError(error);
        }
    });
}

function pauseQuiz() {
    var jsonBodyForStop = JSON.stringify({ key: questionChangeKey});
    $.ajax({
        type: "POST",
        url: "pause",
        headers: { "Content-Type": "application/json"},
        data: jsonBodyForStop,
        success: function(data) {
            console.log("Response to pausing game: "+data.message);
        },
        error: function(error) {
            console.log("Error occurred while asking to pause the game: "+error);
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
    $("#question").html("Game Over!<br>So how many questions did people get correct?");
    $("#answer-two").html("");
    $("#answer-three").html("");
    $("#answer-four").html("");
    $("#timer").html("");
    $("#help-text-div").html("");

    var jsonBodyForStop = JSON.stringify({ key: questionChangeKey});
    console.log("stop request: "+jsonBodyForStop);
    $.ajax({
        type: "POST",
        url: "stop",
        headers: { "Content-Type": "application/json"},
        data: jsonBodyForStop,
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
    if ( scores && scores.length > 0 ) {
        console.log("Scores returned: "+scores)
        var scoresAsKey = { };
        for ( score in scores) {
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
            $("#answer-one").html("No answers where given!");
        } else {
            var keys = Object.keys(scoresAsKey);
            var i;
            keys.reverse();
            var scoresHtml = "";
            for (i = 0; i < keys.length; i++) {
                var k = keys[i];
                scoresHtml += "<b style='color: blue; margin-right: 15px'>" + k + " Correct:</b>" + scoresAsKey[k].join(', ') + "<br><br>";
            }
            $("#answer-one").html(scoresHtml);
        }
    } else {
        $("#answer-one").html("No answers where given!");
    }
}


function onError(error) {
    console.log("Error occurred: "+error);
    alert("An error occurred! Lol!");
}