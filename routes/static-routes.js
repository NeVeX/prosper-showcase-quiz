
module.exports = function(app){
    app.get('/prosperquiz', function(request, response) {
        response.setHeader('Content-Type', 'text/html');
        return response.status(200).end(landingPageHtml);
    });

    app.get('/prosperquiz/start', function(request, response) {
        response.setHeader('Content-Type', 'text/html');
        return response.status(200).end(questionsHtml);
    });
}