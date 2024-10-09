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

async function removeFeature(featureName) {
  const featurePath = path.join('src', 'features', featureName);

  // Check if the feature exists
  if (!fs.existsSync(featurePath)) {
    console.log(`Feature ${featureName} не существует.`);
    return;
  }

  // Ask for confirmation
  const confirmDelete = await askQuestion(
    `Вы уверены, что хотите удалить feature ${featureName}? Это действие нельзя отменить. (y/n): `
  );
  if (confirmDelete.toLowerCase() !== 'y') {
    console.log('Удаление отменено.');
    return;
  }

  // Remove the feature directory
  removeDirectory(featurePath);

  console.log(`Feature ${featureName} успешно удалена.`);

  // Check if features directory is empty
  const featuresPath = path.join('src', 'features');
  if (fs.readdirSync(featuresPath).length === 0) {
    console.log('Папка features теперь пуста. Хотите ее удалить? (y/n): ');
    const removeFeatures = await askQuestion(
      'Папка features теперь пуста. Хотите ее удалить? (y/n): '
    );
    if (removeFeatures.toLowerCase() === 'y') {
      fs.rmdirSync(featuresPath);
      console.log('Папка features удалена.');
    }
  }
}

async function promptUser() {
  const featureName = await askQuestion('Введите название feature для удаления: ');
  await removeFeature(featureName);

  const removeAnother = await askQuestion('Хотите удалить еще одну feature? (y/n): ');
  if (removeAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('FSD Feature Removal Script');
promptUser();
