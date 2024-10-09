const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const componentTypes = ['ui', 'widget'];

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


function updateRootIndexFile(type, componentName) {
  const rootIndexPath = path.join('src', type === 'ui' ? 'shared/ui' : 'widgets', 'index.ts');
  if (fs.existsSync(rootIndexPath)) {
    let content = fs.readFileSync(rootIndexPath, 'utf8');
    const exportStatement = `export * from './${componentName}';\n`;
    content = content.replace(exportStatement, '');
    fs.writeFileSync(rootIndexPath, content);
  }
}

async function deleteUIComponent(type, name) {
  const baseDir = path.join('src', type === 'ui' ? 'shared/ui' : 'widgets', name);
  
  if (!fs.existsSync(baseDir)) {
    console.log(`Компонент ${name} не существует.`);
    return;
  }

  const confirm = await askQuestion(`Вы уверены, что хотите удалить компонент ${name}? (y/n): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('Удаление отменено.');
    return;
  }

  removeDirectory(baseDir);
  updateRootIndexFile(type, name);

  console.log(`Компонент ${name} успешно удален.`);
}

async function promptUser() {
  const type = await askQuestion(`Выберите тип компонента для удаления (${componentTypes.join('/')}): `);
  if (!componentTypes.includes(type)) {
    console.log('Неверный тип компонента. Пожалуйста, выберите из предложенных вариантов.');
    return promptUser();
  }

  const name = await askQuestion('Введите имя компонента для удаления: ');
  await deleteUIComponent(type, name);

  const deleteAnother = await askQuestion('Хотите удалить еще один компонент? (y/n): ');
  if (deleteAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('Скрипт для удаления UI компонентов и виджетов');
promptUser();