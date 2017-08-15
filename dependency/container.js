module.exports = function(){
    var container = {};

    container.config = require("../config");

    var questionValidatorDef = require("../services/question-validator");
    container.questionValidator = new questionValidatorDef();

    var questionsServiceDef = require("../questions-service");
    container.questionsService = new questionsServiceDef(container.questionValidator);

    var questionsApiDef = require('./questions-api');
    container.questionsApi = new questionsApiDef(container.questionsService);

    var slackApiDef = require('./slack-api');
    container.slackApi = new slackApiDef(container.config, container.questionsService);

    var testApiDef = require('./test-api');
    container.testApi = new testApiDef(container.questionsService);

    var quizMasterDef = require('./quiz-master');
    container.quizMaster = new quizMasterDef(config, container.questionsApi, container.slackApi);

    return container;
};