# prosper-showcase-quiz

During the showcase every week, it might be cool to have an interactive quiz.
To play, this node app is shown on screen and simultaneously will accept slack commends from the "/quiz" input for answers to questions.

##### Release Notes

#### `1.1.0`

* This version as used for the quiz in the Showcase on June 30th 2017
* Added new sexy landing page
  * You need to enter the quiz-master key at the very bottom of the page and hit enter, to control the game and show the start button
* Changed format of the quiz
  * Question shows for a few seconds without the answers shown
  * After a few seconds the answers show with the timer started
  * Wrong answers will disappear at intervals until there is only 2 answers left
  * Depending on when an answer is submitted, gets you more or fewer points
    * Answering with 4 questions shown, gets you 5 points
    * Answering with 3 questions shown, gets you 3 points
    * Answering with 2 or fewer questions shown, gets you 1 point    
* Created new `quiz-master` control flow in node server 
    
* New design was helped from templates at [HTML5 UP](https://html5up.net/)

#### `1.0.0`

* The first quiz that was performed on June 23rd 2017
