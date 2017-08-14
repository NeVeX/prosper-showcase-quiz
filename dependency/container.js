module.exports = function(){
    var container = {};

    container.config = require("../config");

    var questionValidatorDef = require("../services/question-validator");
    container.questionValidator = new questionValidatorDef();

    var questionsServiceDef = require("../questions-service");
    container.questionsService = new questionsServiceDef(container.questionValidator);

    var slackApiDef = require('./slack-api');
    container.slackApi = new slackApiDef(container.config, container.questionsService);

    return container;
};