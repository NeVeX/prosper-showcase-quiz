var config = {
    QUIZ_SLACK_TOKEN : process.env.PROSPER_QUIZ_SLACK_KEY || "fake_slack_key",
    APPLICATION_SLACK_OAUTH_TOKEN : process.env.PROSPER_QUIZ_APPLICATION_OAUTH_TOKEN || "fake_oauth_token"
};


module.exports = config;