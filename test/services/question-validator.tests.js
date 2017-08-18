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

    it("should reject a missing answer 1", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerTwo": "Happy pride week",
            "answerThree": "It's good to see you",
            "answerFour": "Have a great day",
            "correctAnswer": 3,
            "timeAllowedSeconds": 32
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
           assert.equal(err.message, "Answer one is not valid");
           done();
        });
    });

    it("should reject a missing answer 2", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerOne": "Welcome to Prosper",
            "answerThree": "It's good to see you",
            "answerFour": "Have a great day",
            "correctAnswer": 3,
            "timeAllowedSeconds": 32
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
           assert.equal(err.message, "Answer two is not valid");
           done();
        });
    });

    it("should reject a missing answer 3", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerOne": "Welcome to Prosper",
            "answerTwo": "It's good to see you",
            "answerFour": "Have a great day",
            "correctAnswer": 3,
            "timeAllowedSeconds": 32
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
           assert.equal(err.message, "Cannot have answer four when there is no answer three");
           done();
        });
    });

    it("should reject a question with a missing answer", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerOne": "Welcome to Prosper",
            "answerTwo": "Happy pride week",
            "answerThree": "It's good to see you",
            "answerFour": "Have a great day",
            "timeAllowedSeconds": 32
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
           assert.equal(err.message, "There is no valid correct answer");
           done();
        });

    });

    it("should reject a question with an invalid timeAllowed", function(done){
        var questionJson = {
            "question": "What does it say on the wall when coming out of our 3rd floor elevator?",
            "answerOne": "Welcome to Prosper",
            "answerTwo": "Happy pride week",
            "answerThree": "It's good to see you",
            "answerFour": "Have a great day",
            "correctAnswer": 3
        };

        validator.validateQuestion(questionJson)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
           assert.equal(err.message, "The time allowed in seconds is not valid");
           done();
        });

    });

});