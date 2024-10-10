const fs = require('fs');
const path = require('path');

const componentTypes = ['entity', 'feature', 'page', 'ui', 'widget', 'api'];

function listComponents(type) {
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
    const components = fs.readdirSync(componentPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`Список ${type}:`);
    components.forEach(component => console.log(`- ${component}`));
  } else {
    console.log(`Директория для ${type} не найдена.`);
  }
}

componentTypes.forEach(type => {
  console.log('\n');
  listComponents(type);
});
