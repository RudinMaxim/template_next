const readline = require('readline');

function askQuestion(question, choices = null) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function displayChoices(currentChoice) {
      console.clear();
      console.log(question);
      choices.forEach((choice, index) => {
        console.log(`${index === currentChoice ? '>' : ' '} ${choice}`);
      });
    }

    function cleanup(onKeypress) {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('keypress', onKeypress);
      rl.close();
    }

    if (choices) {
      let currentChoice = 0;

      displayChoices(currentChoice);

      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      const onKeypress = (_str, key) => {
        if (key.name === 'up' && currentChoice > 0) {
          currentChoice--;
        } else if (key.name === 'down' && currentChoice < choices.length - 1) {
          currentChoice++;
        } else if (key.name === 'return') {
          resolve(choices[currentChoice]);
          cleanup(onKeypress);
        }
        displayChoices(currentChoice);
      };

      process.stdin.on('keypress', onKeypress);
    } else {
      rl.question(question, (answer) => {
        resolve(answer.trim());
        rl.close();
      });
    }
  });
}

module.exports = { askQuestion };
