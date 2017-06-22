$( document ).ready(function() {
    init();
});

var questionChangeKey;

function init() {
    console.log( "control.js activated" );
    var startQuestion = 1;
    var queryStartOverride = getParameterByName("start");
    if ( queryStartOverride ) {
        startQuestion = queryStartOverride;
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
		url: "prosperquiz/questions?number="+questionNumber+"&key="+questionChangeKey,
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
    console.log(data);
    $("#question").html(questionNumber +": "+data.question);
    $("#answer-one").html("1: "+data.answerOne);
    $("#answer-two").html("2: "+data.answerTwo);
    if ( data.answerThree) {
        $("#answer-three").html("3: "+data.answerThree);
    } else {
        $("#answer-three").html("");
    }
    if ( data.answerFour) {
        $("#answer-four").html("4: "+data.answerFour); 
    } else {
        $("#answer-four").html("");
    }

    var isMoreQuestions = questionNumber < data.totalQuestions;
    startTimer(data.timeAllowed, questionNumber, isMoreQuestions);
}

function startTimer(timeAllowed, currentQuestion, isMoreQuestions) {
    var timeLeft = timeAllowed;
    $("#timer").html(timeLeft);
    var timeLeftInterval = setInterval(function() {
        $("#timer").html(timeLeft--);
        if(timeLeft < 0) {
            console.log("Timer is done");
            clearInterval(timeLeftInterval);
            if ( isMoreQuestions) {
                getQuestion(currentQuestion + 1);
            } else {
                onGameOver();
            }
        }
    },1000);
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
    $("#question").html("Game Over!<br>Who answered the most?");
    $("#answer-two").html("");
    $("#answer-three").html("");
    $("#answer-four").html("");
    $("#timer").html("");
    $("#help-text-div").html("");

    $.ajax({
        type: "GET",
        url: "prosperquiz/scores",
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
                var name = scores[score].name
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
                scoresHtml += k +": " + scoresAsKey[k].join(', ') + "<br>";
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