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

function getQuestion(number) {
    $.ajax({
		type: "GET",  
		url: "prosperquiz/questions?number="+number,
		success: function(data) {
            console.log("Got data back from quiz api");
            console.log(data);
            $("#question").html(data.question);
            $("#answer-one").html("1: "+data.answerOne);
            $("#answer-two").html("2: "+data.answerTwo);
            $("#answer-three").html("3: "+data.answerThree);
            $("#answer-four").html("4: "+data.answerFour);
            startTimer(data.timeAllowed);
		},
		error: function(error) {
            console.log("Error occured: "+error);
            alert("An error occured! Lol!");
        }
	})	

}

function startTimer(timeAllowed) {
    var timeLeft = timeAllowed;
    var timeLeftInterval = setInterval(function() {
        $("#timer").html(timeLeft--);
        if(timeLeft < 0) {
            console.log("Timer is done");
            clearInterval(timeLeftInterval);
        }
    },1000);

}

// function getParameterByName(name) {
//     name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
//     var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//         results = regex.exec(location.search);
//     return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
// }

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