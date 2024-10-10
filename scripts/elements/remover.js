const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { askQuestion } = require('../gitflow/prompts');

const componentTypes = ['entity', 'feature', 'page', 'ui', 'widget', 'api'];

function getComponentList(type) {
  const basePath = {
    entity: path.join('src', 'entities'),
    feature: path.join('src', 'features'),
    ui: path.join('src', 'shared', 'ui'),
    widget: path.join('src', 'widgets'),
    page: path.join('src', 'app', '(page)'),
    api: path.join('src', 'app', 'api'),
  };

  const componentPath = basePath[type];

  if (fs.existsSync(componentPath)) {
    return fs
      .readdirSync(componentPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }
  return [];
}

function deleteComponent(type, name) {
  const basePath = {
    entity: path.join('src', 'entities'),
    feature: path.join('src', 'features'),
    ui: path.join('src', 'shared', 'ui'),
    widget: path.join('src', 'widgets'),
    page: path.join('src', 'app', '(page)'),
    api: path.join('src', 'app', 'api'),
  };

  const componentPath = path.join(basePath[type], name);

  if (fs.existsSync(componentPath)) {
    rimraf.sync(componentPath);
    console.log(`${type} ${name} успешно удален.`);

    // Удаление экспорта из индексного файла
    if (type !== 'page' && type !== 'api') {
      const indexPath = path.join(basePath[type], 'index.ts');
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        const exportStatement = `export * from './${name}';\n`;
        content = content.replace(exportStatement, '');
        fs.writeFileSync(indexPath, content);
      }
    }
  } else {
    console.log(`${type} ${name} не найден.`);
  }
}

async function promptUser() {
  const typeMap = {
    entity: 'сущности',
    feature: 'фичи',
    ui: 'UI компонента',
    widget: 'виджета',
    page: 'страницы',
    api: 'API route',
  };

  const type = await askQuestion('Выберите тип компонента для удаления:', componentTypes);
  
  const components = getComponentList(type);
  if (components.length === 0) {
    console.log(`Нет доступных компонентов типа ${type} для удаления.`);
    return;
  }

  console.log(`Доступные ${typeMap[type]} для удаления:`);
  components.forEach((component, index) => {
    console.log(`${index + 1}. ${component}`);
  });

  const componentIndex = await askQuestion(`Выберите номер ${typeMap[type]} для удаления (или введите имя вручную): `);
  
  let name;
  if (!isNaN(componentIndex) && componentIndex > 0 && componentIndex <= components.length) {
    name = components[componentIndex - 1];
  } else {
    name = componentIndex;
  }

  deleteComponent(type, name);

  const deleteAnother = await askQuestion('Хотите удалить еще один компонент?', ['Да', 'Нет']);
  if (deleteAnother === 'Да') {
    await promptUser();
  } else {
    console.log('Спасибо за использование инструмента удаления FSD компонентов!');
  }
}

console.log('Добро пожаловать в инструмент удаления FSD компонентов!');
promptUser();

