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

function removePage(route) {
  const segments = route.split('/').filter(Boolean);
  let currentPath = path.join('src', 'app', '(page)');

  for (const segment of segments) {
    currentPath = path.join(currentPath, segment);
  }

  const pagePath = path.join(currentPath, 'page.tsx');
  const layoutPath = path.join(currentPath, 'layout.tsx');

  // Check if the page exists
  if (!fs.existsSync(pagePath)) {
    console.log(`Страница ${route} не существует.`);
    return;
  }

  // Remove the page file
  fs.unlinkSync(pagePath);

  // Remove the layout file if it exists
  if (fs.existsSync(layoutPath)) {
    fs.unlinkSync(layoutPath);
  }

  // Remove empty directories
  let dirToRemove = currentPath;
  while (dirToRemove !== path.join('src', 'app', '(page)')) {
    if (fs.readdirSync(dirToRemove).length === 0) {
      fs.rmdirSync(dirToRemove);
      dirToRemove = path.dirname(dirToRemove);
    } else {
      break;
    }
  }

  console.log(`Страница ${route} успешно удалена.`);
}

async function promptUser() {
  const route = await askQuestion(
    'Введите маршрут страницы для удаления (например, about или blog/post): '
  );

  const confirmDelete = await askQuestion(
    `Вы уверены, что хотите удалить страницу ${route}? (y/n): `
  );
  if (confirmDelete.toLowerCase() === 'y') {
    removePage(route);
  } else {
    console.log('Удаление отменено.');
  }

  const deleteAnother = await askQuestion('Хотите удалить еще одну страницу? (y/n): ');
  if (deleteAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('Next.js Page Removal Script');
promptUser();
