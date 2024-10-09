const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function removeDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDirectory(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

async function removeEntity(entityName) {
  const entityPath = path.join('src', 'entities', entityName);

  // Check if the entity exists
  if (!fs.existsSync(entityPath)) {
    console.log(`Entity ${entityName} не существует.`);
    return;
  }

  // Ask for confirmation
  const confirmDelete = await askQuestion(
    `Вы уверены, что хотите удалить entity ${entityName}? Это действие нельзя отменить. (y/n): `
  );
  if (confirmDelete.toLowerCase() !== 'y') {
    console.log('Удаление отменено.');
    return;
  }

  // Remove the entity directory
  removeDirectory(entityPath);

  console.log(`Entity ${entityName} успешно удалена.`);

  // Check if entities directory is empty
  const entitiesPath = path.join('src', 'entities');
  if (fs.readdirSync(entitiesPath).length === 0) {
    console.log('Папка entities теперь пуста. Хотите ее удалить? (y/n): ');
    const removeEntities = await askQuestion(
      'Папка entities теперь пуста. Хотите ее удалить? (y/n): '
    );
    if (removeEntities.toLowerCase() === 'y') {
      fs.rmdirSync(entitiesPath);
      console.log('Папка entities удалена.');
    }
  }
}

async function promptUser() {
  const entityName = await askQuestion('Введите название entity для удаления: ');
  await removeEntity(entityName);

  const removeAnother = await askQuestion('Хотите удалить еще одну entity? (y/n): ');
  if (removeAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('FSD Entity Removal Script');
promptUser();
