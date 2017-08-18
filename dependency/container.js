module.exports = function(){
    var container = {};

    var questionValidatorDef = require("../services/question-validator");
    container.questionValidator = new questionValidatorDef();

    return container;
};