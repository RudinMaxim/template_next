const { execSync } = require('child_process');
const { askQuestion } = require('../prompts');

function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Ошибка выполнения команды: ${command}`);
    console.error(error.message);
    return null;
  }
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

async function updateBranch() {
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD').trim();
  console.log(`Обновление ${currentBranch} с удаленного...`);
  executeCommand(`git pull origin ${currentBranch}`);
  console.log('Филиал обновлен');
}

module.exports = {
  executeCommand,
  checkRepoStatus,
  updateBranch,
};
