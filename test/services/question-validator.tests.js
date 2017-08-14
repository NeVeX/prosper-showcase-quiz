var validatorDef = require("../../services/question-validator");
var validator = new validatorDef();
var assert = require("assert");

describe("question validator service", function(){

    it("should validate a question that's valid", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerOne": "Welcome to Prosper",
            "answerTwo": "Happy pride week",
            "answerThree": "It's good to see you",
            "answerFour": "Have a great day",
            "correctAnswer": 3,
            "timeAllowedSeconds": 32
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            done();
        })
        .catch(function(err){
           console.log(err);
           assert.fail();
           done();
        });
    });

});