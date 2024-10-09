
const { askQuestion } = require('./prompts');
const { executeCommand, checkRepoStatus, updateBranch } = require('./gitCommands');
const config = require('./config');

async function createBranch() {
  const branchType = await askQuestion('Выберите тип филиала:', config.branchTypes);
  const branchName = await askQuestion('Название филиала: ');
  const fullBranchName = `${branchType}/${branchName}`;

  executeCommand(`git checkout -b ${fullBranchName}`);
  console.log(`Создано и переключено на ветку: ${fullBranchName}`);
}

async function commitChanges() {
  const commitType = await askQuestion('Выберите тип фиксации:', config.commitTypes);
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

// TODO: Implement functionality here
// async function createPullRequest() {
//   const ghInstalled = executeCommand('gh --version');
//   if (!ghInstalled) {
//     console.error('GitHub CLI (gh) не установлен и не настроен.');
//     return;
//   }

//   const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
//   const shouldCreatePR = await askQuestion(`Создать запрос на извлечение для ${currentBranch}? (y/n): `);

//   if (shouldCreatePR.toLowerCase() === 'y') {
//     const prTitle = await askQuestion('Название запроса на извлечение: ');
//     const prDescription = await askQuestion('Описание запроса на извлечение: ');

//     const result = executeCommand(
//       `gh pr create --title "${prTitle}" --body "${prDescription}" --base ${config.baseBranch}`
//     );
//     if (result) {
//       console.log('Запрос на извлечение создан');
//     } else {
//       console.log('Не удалось создать запрос на вытягивание. Проверьте наличие конфликтов.');
//       const shouldMergeBase = await askQuestion(`Слияние ${config.baseBranch} в ${currentBranch}? (y/n): `);
//       if (shouldMergeBase.toLowerCase() === 'y') {
//         executeCommand(`git merge ${config.baseBranch}`);
//         console.log(`Слитый ${config.baseBranch} в ${currentBranch}`);
//       }
//     }
//   }
// }

async function mergeBranch() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  const targetBranch = await askQuestion('Целевая ветвь для слияния:', config.margeBranch);

  if (targetBranch && !config.margeBranch.includes(targetBranch)) {
    console.log(`Ошибка: ${targetBranch} не является допустимой целевой ветвью для слияния.`);
    return;
  }

  const sourceBranch = targetBranch ? currentBranch : await askQuestion('Исходная ветвь для слияния:');
  const finalTargetBranch = targetBranch || currentBranch;

  if (targetBranch) {
    executeCommand(`git checkout ${targetBranch}`);
  }

  const mergeResult = executeCommand(`git merge ${sourceBranch}`);

  if (mergeResult) {
    console.log(`Успешно объединено ${sourceBranch} в ${finalTargetBranch}`);
  } else {
    console.log(`При слиянии обнаружен конфликт ${sourceBranch} в ${finalTargetBranch}`);
    console.log('Пожалуйста, разрешите конфликты вручную и зафиксируйте изменения.');
  }

  if (targetBranch) {
    executeCommand(`git checkout ${currentBranch}`);
  }
}
async function undoLastAction() {
  console.log('Отмена последнего действия...');
  executeCommand('git reset HEAD~1');
  console.log('Последнее действие отменено');
}

async function main() {
  console.log('Only Git Flow Automation');

  let running = true;
  while (running) {
    await checkRepoStatus();
    await updateBranch();

    const action = await askQuestion('Выберите действие:', config.choiceTypes);

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
      // case 'pr':
      //   await createPullRequest();
      //   break;
      case 'merge':
        await mergeBranch();
        break;
      case 'undo':
        await undoLastAction();
        break;
      case 'exit':
        console.log('Exiting Git Flow Automation');
        running = false;
        break;
      default:
        console.error('Недопустимое действие');
        break;
    }
  }
}

main();
