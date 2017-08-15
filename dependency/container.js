module.exports = function(){
    var container = {};

    container.config = require("../config");

    var questionValidatorDef = require("../services/question-validator");
    container.questionValidator = new questionValidatorDef();

    var questionsServiceDef = require("../services/questions-service");
    container.questionsService = new questionsServiceDef(container.questionValidator);

    var questionsApiDef = require('../api/questions-api');
    container.questionsApi = new questionsApiDef(container.questionsService);

    var slackApiDef = require('../api/slack-api');
    container.slackApi = new slackApiDef(container.config, container.questionsService);

    var testApiDef = require('../api/test-api');
    container.testApi = new testApiDef(container.questionsService);

    var quizMasterDef = require('../api/quiz-master');
    container.quizMaster = new quizMasterDef(config, container.questionsApi, container.slackApi);

    return container;
};