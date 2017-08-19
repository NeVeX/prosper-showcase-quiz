
var fakeValidatorDef = require("../fakes/fake-question-validator");
var fakeValidator = new fakeValidatorDef();

var serviceDef = require("../../services/questions-service");
var service = new serviceDef(fakeValidator);
var assert = require("assert");

describe("questions service", function(){

    it("should not load empty json into questions", function(done){
        service.loadQuestionsFromJson(null)
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
            assert.equal(err.message, "Questions JSON is null/empty");
            done();
        })
    });

    it("should not load non-json input into questions", function(done){
        service.loadQuestionsFromJson("I am not Json!!!!")
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
            assert.equal(err.message, "Could not load questions - Unexpected token I in JSON at position 0");
            done();
        })
    });

    it("should not load empty input into questions", function(done){
        service.loadQuestionsFromJson("[]")
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
            assert.equal(err.message, "Could not load questions - no data found");
            done();
        })
    });

    it("should report errors in questions", function(done){
        service.loadQuestionsFromJson('[{ "isBad": true }, { "isBad" : false }]')
        .then(function(result){
            assert.fail();
            done();
        })
        .catch(function(err){
            assert.equal(err.isError, true);
            assert.equal(err.errors.length, 1);
            done();
        })
    });


    it("should load valid questions", function(done){
        service.loadQuestionsFromJson('[{ "isBad": false }, { "isBad" : false }]')
        .then(function(result){
            done();
        })
        .catch(function(err){
            assert.fail();
            done();
        })
    });

    it("should start a quiz", function(done){
        assert.equal(service.startQuiz(), true);
        done();
    });

    it("should pause a quiz", function(done){
        assert.equal(service.pauseQuiz(), true);
        done();
    });

    it("should not unpause a blank quiz", function(done){
        assert.equal(service.unPauseQuiz(), false);
        done();
    });

    it("should stop quiz", function(done){
        assert.equal(service.stopQuiz(), true);
        done();
    });

});