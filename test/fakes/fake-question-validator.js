function FakeQuestionValidator(){
};

FakeQuestionValidator.prototype.validateQuestion = function(question){
    if(question.isBad){
        return Promise.reject({message: "this is a bad question"})
    }

    return Promise.resolve();
};

module.exports = FakeQuestionValidator;