
var questionsService = require('./questions-service');

exports.generateTestData = function (request, response) {
    console.log("New POST request received to /prosperquiz/test/data");
    if ( request.nevex.isQuizMaster ) {
        var didGenerateData = questionsService.generateTestData();
        return response.status(200).json({"didGenerateData": didGenerateData});
    } else {
        return response.status(403).json({"error": "You are not authorized to generate test data"});
    }
};
