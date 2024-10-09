const readline = require('readline');

function askQuestion(question, choices = null) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let isDone = false; // Флаг для предотвращения повторного вызова

    if (choices) {
      let currentChoice = 0;

      function displayChoices() {
        if (isDone) return; // Предотвращаем дальнейшее отображение, если выбор уже сделан
        console.clear();
        console.log(question);
        choices.forEach((choice, index) => {
          console.log(`${index === currentChoice ? '>' : ' '} ${choice}`);
        });
      }

      displayChoices();

      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      const onKeypress = (str, key) => {
        if (isDone) return;
        try {
          if (key.name === 'up' && currentChoice > 0) {
            currentChoice--;
          } else if (key.name === 'down' && currentChoice < choices.length - 1) {
            currentChoice++;
          } else if (key.name === 'return') {
            isDone = true;
            resolve(choices[currentChoice]);
            cleanup();
          }
        } catch (error) {
          isDone = true;
          reject(error);
          cleanup();
        } finally {
          displayChoices();
        }
      };

      process.stdin.on('keypress', onKeypress);

      function cleanup() {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', onKeypress);
        rl.close();
      }
    } else {
      rl.question(question, (answer) => {
        resolve(answer);
        rl.close();
      });
    }
  });
}

module.exports = { askQuestion };
