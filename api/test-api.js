
function TestApi(questionsService){
    this.questionsService = questionsService;
}

TestApi.prototype.generateTestData = function (request, response) {
    console.log("New POST request received to /prosperquiz/test/data");
    if ( request.nevex.isQuizMaster ) {
        var didGenerateData = this.questionsService.generateTestData();
        return response.status(200).json({"didGenerateData": didGenerateData});
    }

    return response.status(403).json({"error": "You are not authorized to generate test data"});
};

module.exports = TestApi;
