module.exports = function(app, testApi){
    app.post('/prosperquiz/test/data', testApi.generateTestData);
}