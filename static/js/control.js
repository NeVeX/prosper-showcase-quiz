$( document ).ready(function() {
    init();
});

function init() {
    console.log( "control.js activated" );
    var startQuestion = 1;
    var queryStartOverride = getParameterByName("start");
    if ( queryStartOverride ) {
        startQuestion = queryStartOverride;
    }
    console.log("Starting question from "+startQuestion);
    getQuestion(startQuestion);
}

function getQuestion(questionNumber) {
    console.log("Getting question "+questionNumber);
    $.ajax({
		type: "GET",  
		url: "prosperquiz/questions?number="+questionNumber,
		success: function(data) {
            onQuizDataReturned(questionNumber, data);
		},
		error: function(error) {
            console.log("Error occured: "+error);
            alert("An error occured! Lol!");
        }
	})	
}

function onQuizDataReturned(questionNumber, data) {
    console.log("Got data back from quiz api");
    console.log(data);
    $("#question").html(data.question);
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
                console.log("GAME OVER");
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
};