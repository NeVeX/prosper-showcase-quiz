# prosper-showcase-quiz

During the showcase every week, it might be cool to have an interactive quiz.
To play, this node app is shown on screen and simultaneously will accept slack commends from the "/quiz" input for answers to questions.

##### Release Notes

#### `1.7.0`

* Added landing page help text for joining the quiz
* Added new questions for the 15th of September quiz
* Added `answerRemovals` array option to questions, so that questions can be removed in a better order (not randomly)

#### `1.6.0`

* Added questions for the 18th of August 2017 quiz
* Added logging to find out which people can never get their profile from slack (it's quite annoying)
* Updated slack responses to make it clear to go to the `slackbot` channel
* Updated slightly how long until wrong answers start to fade 

#### `1.5.0`

* Added new feature where the first player to answer correct gets bonus points
  * The player's name is displayed on screen while the question shows also; bragging rights of sorts
  * The `/stats` API will return the player who is the first (using slack to get the full name if possible)
* Updated the UI
  * Added the first player to answer correct
  * Fixed some layout issues
  * Added coloring to the correct answer 

#### `1.4.0`

* Added API to dynamically change the questions for the quiz at any time
  * Due to time constraints and zero testing, all questions are now locked to 4 answers since less than may cause issues
* All questions (static or dynamic) are checked for errors now  
* Changed the question property from `timeAllowed` to `timeAllowedSeconds`

#### `1.3.0`

* Added more oauth grants to application - can now try to get profile information and personal channel id's when users `/quiz play`
* All interactive slack messages are sent to the personal user channel - fixing the public channel issue 
* Scores are updated with full names now (where users use the `/quiz play` command)
* Changed some UI flows - all text disappears and then the chart shows after each question
* Updated UI elements 
* Added post question statistics (shows who is answering what)
* Removed the chart because it's not great 
* Added more slack API integrations (getting profile information and personal channel id's)
* Updated sending `postMessage` to use the `@username` to post in the `slackbot` channel
* Updated stats API
* Added `unpause`, `start`, `sendquestions` API's

#### `1.2.0`

* This version was used for the quiz in the Showcase on July 7th 2017
* Rewrote the server node.js scripts to have simpler routes and modularity 
* Added interactive integration to slack - new api's and services created to support it
* Added charts that show how people answered after each question
* Various bug fixes

#### `1.1.0`

* This version was used for the quiz in the Showcase on June 30th 2017
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
