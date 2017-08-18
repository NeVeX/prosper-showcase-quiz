function QuestionValidator(){
};

QuestionValidator.prototype.validateQuestion = function(question){
    
    if ( !question.question ) { return Promise.reject({ message: "There is no valid question"}); }
    if ( !question.answerOne ) { return Promise.reject({ message: "Answer one is not valid"}); }
    if ( !question.answerTwo ) { return Promise.reject({ message: "Answer two is not valid"}); }
    if ( !question.correctAnswer || question.correctAnswer < 1 || question.correctAnswer > 4 ) {
        return Promise.reject({ message: "There is no valid correct answer"});
    }
    if ( !question.timeAllowedSeconds || question.timeAllowedSeconds < 1) {
        return Promise.reject({ message: "The time allowed in seconds is not valid"});
    }

    // Check the optional questions
    if ( !question.answerThree && question.answerFour) { 
        return Promise.reject({ message: "Cannot have answer four when there is no answer three"}); 
    }

    if ( !question.answerThree && !question.answerFour && question.correctAnswer > 2) {
        return Promise.reject({ message: "Cannot have correct answer greater than answers given"});
    }
    if ( question.answerThree && !question.answerFour && question.correctAnswer > 3) {
        return Promise.reject({ message: "Cannot have correct answer greater than answers given"});
    }

    // TODO: Remove the below rules when we can allow less than 4 answers
    if ( !question.answerThree ) { return Promise.reject({ message: "Answer three is not valid (cannot allow less than 4 answers currently)"}); }
    if ( !question.answerFour ) { return Promise.reject({ message: "Answer four is not valid (cannot allow less than 4 answers currently)"}); }

    return Promise.resolve();
}

module.exports = QuestionValidator;