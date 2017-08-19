module.exports = function(app, slackApi){
    app.post('/prosperquiz/slack', slackApi.slackInteractive);
    app.post('/prosperquiz/slack/interactive', slackApi.slackInteractiveAnswer);
}