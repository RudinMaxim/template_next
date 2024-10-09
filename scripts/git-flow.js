const { execSync } = require('child_process');
const readline = require('readline');

const config = {
  baseBranch: 'main',
  featureBranchPrefix: 'feature/',
};

const branchTypes = ['feature', 'bugfix', 'hotfix', 'release'];
const commitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];
const choiceTypes = ['create-branch', 'commit', 'push', 'pr', 'merge', 'undo', 'exit'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Ошибка выполнения команды: ${command}`);
    console.error(error.message);
    return null;
  }
}

function askQuestion(question, choices = null) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let isDone = false; // Флаг для предотвращения повторного вызова

    if (choices) {
      let currentChoice = 0;

      // Функция для отображения списка с выбором
      function displayChoices() {
        if (isDone) return; // Предотвращаем дальнейшее отображение, если выбор уже сделан
        console.clear();
        console.log(question);
        choices.forEach((choice, index) => {
          console.log(`${index === currentChoice ? '>' : ' '} ${choice}`);
        });
      }

      // Начальное отображение вариантов
      displayChoices();

      // Включаем режим обработки событий клавиш
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      const onKeypress = (str, key) => {
        if (isDone) return; // Прерываем выполнение, если ввод завершён
        try {
          if (key.name === 'up' && currentChoice > 0) {
            currentChoice--;
          } else if (key.name === 'down' && currentChoice < choices.length - 1) {
            currentChoice++;
          } else if (key.name === 'return') {
            isDone = true;
            resolve(choices[currentChoice]);
            cleanup(); // Закрытие и очистка после выбора
          }
        } catch (error) {
          isDone = true;
          reject(error);
          cleanup(); // Закрытие и очистка в случае ошибки
        } finally {
          displayChoices();
        }
      };

      process.stdin.on('keypress', onKeypress);

      // Очистка интерфейса и отключение события
      function cleanup() {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', onKeypress);
        rl.close();
      }
    } else {
      // Если выборов нет, задаём обычный вопрос
      rl.question(question, (answer) => {
        resolve(answer);
        rl.close();
      });
    }
  });
}

async function checkRepoStatus() {
  const status = executeCommand('git status --porcelain');
  if (status) {
    console.log('Обнаружены незафиксированные изменения:');
    console.log(status);
    const proceed = await askQuestion('Хотите продолжить? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      process.exit(0);
    }
  } else {
    console.log('Repository is clean.');
  }
}

async function createBranch() {
  const branchType = await askQuestion('Выберите тип филиала:', branchTypes);
  const branchName = await askQuestion('Название филиала: ');
  const fullBranchName = `${branchType}/${branchName}`;

  executeCommand(`git checkout -b ${fullBranchName}`);
  console.log(`Создано и переключено на ветку: ${fullBranchName}`);
}
async function commitChanges() {
  const commitType = await askQuestion('Выберите тип фиксации:', commitTypes);
  const commitMessage = await askQuestion('Сообщение о фиксации: ');
  const fullCommitMessage = `${commitType}: ${commitMessage}`;

  executeCommand('git add .');
  executeCommand(`git commit -m "${fullCommitMessage}"`);
  console.log(`Изменения внесены: ${fullCommitMessage}`);
}

async function pushChanges() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const shouldPush = await askQuestion(`Внести изменения в origin/${currentBranch}? (y/n): `);

  if (shouldPush.toLowerCase() === 'y') {
    executeCommand(`git push -u origin ${currentBranch}`);
    console.log(`Изменения перенесены на origin/${currentBranch}`);
  }
}

async function createPullRequest() {
  const ghInstalled = executeCommand('gh --version');
  if (!ghInstalled) {
    console.error('GitHub CLI (gh) не установлен и не настроен.');
    return;
  }

  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const shouldCreatePR = await askQuestion(
    `Создать запрос на извлечение для ${currentBranch}? (y/n): `
  );

  if (shouldCreatePR.toLowerCase() === 'y') {
    const prTitle = await askQuestion('Название запроса на извлечение: ');
    const prDescription = await askQuestion('Описание запроса на извлечение: ');

    const result = executeCommand(
      `gh pr create --title "${prTitle}" --body "${prDescription}" --base ${config.baseBranch}`
    );
    if (result) {
      console.log('Запрос на извлечение создан');
    } else {
      console.log('Не удалось создать запрос на вытягивание. Проверьте наличие конфликтов.');
      const shouldMergeBase = await askQuestion(
        `Слияние ${config.baseBranch} в ${currentBranch}? (y/n): `
      );
      if (shouldMergeBase.toLowerCase() === 'y') {
        executeCommand(`git merge ${config.baseBranch}`);
        console.log(`Слитый ${config.baseBranch} в ${currentBranch}`);
      }
    }
  }
}

async function mergeBranch() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const targetBranch = await askQuestion('Целевая ветвь для слияния: ');

  executeCommand(`git checkout ${targetBranch}`);
  const mergeResult = executeCommand(`git merge ${currentBranch}`);

  if (mergeResult) {
    console.log(`Успешно объединено ${currentBranch} в ${targetBranch}`);
  } else {
    console.log(`При слиянии обнаружен конфликт ${currentBranch} в ${targetBranch}`);
    console.log('Пожалуйста, разрешите конфликты вручную и зафиксируйте изменения.');
  }
}

async function updateBranch() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  console.log(`Обновление ${currentBranch} с удаленного...`);
  executeCommand(`git pull origin ${currentBranch}`);
  console.log('Филиал обновлен');
}

async function undoLastAction() {
  console.log('Отмена последнего действия...');
  executeCommand('git reset HEAD~1');
  console.log('Последнее действие отменено');
}

async function main() {
  console.log('Only Git Flow Automation');

  while (true) {
    await checkRepoStatus();
    await updateBranch();

    const action = await askQuestion('Выберите действие:', choiceTypes);

    switch (action) {
      case 'create-branch':
        await createBranch();
        break;
      case 'commit':
        await commitChanges();
        break;
      case 'push':
        await pushChanges();
        break;
      case 'pr':
        await createPullRequest();
        break;
      case 'merge':
        await mergeBranch();
        break;
      case 'undo':
        await undoLastAction();
        break;
      case 'exit':
        console.log('Exiting Git Flow Automation');
        rl.close();
        return;
      default:
        console.error('Недопустимое действие');
        break;
    }
  }
}

main();
