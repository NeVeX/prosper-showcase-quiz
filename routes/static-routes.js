
var fs = require('fs');

module.exports = function(app){

    var landingPageHtml = fs.readFileSync('static/landing-page.html');
    var questionsHtml = fs.readFileSync('static/question.html');

    app.get('/prosperquiz', function(request, response) {
        response.setHeader('Content-Type', 'text/html');
        return response.status(200).end(landingPageHtml);
    });

    app.get('/prosperquiz/start', function(request, response) {
        response.setHeader('Content-Type', 'text/html');
        return response.status(200).end(questionsHtml);
    });
}