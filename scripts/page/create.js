const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function createFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function askForNesting() {
    const nestPage = await askQuestion('Хотите ли вы вложить эту страницу в другую страницу? (y/n): ');
    if (nestPage.toLowerCase() === 'y') {
        const parentRoute = await askQuestion('Введите родительский маршрут (e.g., blog): ');
        return parentRoute;
    }
    return null;
}

async function generatePage(route) {
    const segments = route.split('/').filter(Boolean);
    let currentPath = path.join('src', 'app', '(page)');
    const parentRoute = await askForNesting();
    if (parentRoute) {
        currentPath = path.join(currentPath, parentRoute);
    }

    for (const segment of segments) {
        currentPath = path.join(currentPath, segment);
        createDirectory(currentPath);
    }

    const pagePath = path.join(currentPath, 'page.tsx');
    const layoutPath = path.join(currentPath, 'layout.tsx');

    // Check if the page already exists
    if (fs.existsSync(pagePath)) {
        console.log(`Страница ${route} уже существует.`);
        return;
    }

    // Create the page file
    const pageContent = `import React from 'react';

export default function ${route}Page() {
  return (
    <main>
      <h1>${segments[segments.length - 1]} Page</h1>
    </main>
  );
}
`;
    createFile(pagePath, pageContent);

    // Ask about creating a layout
    const createLayout = await askQuestion('Создать макет для этой страницы? (y/n): ');
    if (createLayout.toLowerCase() === 'y') {
        const layoutContent = `import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Your layout content can go here */}
      {children}
    </div>
  );
}
`;
        createFile(layoutPath, layoutContent);
    }

    console.log(`Page ${route} успешно создано.`);
}

async function promptUser() {
    const route = await askQuestion('Введите маршрут для новой страницы (например, about или blog/post): ');
    await generatePage(route);

    const createAnother = await askQuestion('Хотите создать еще одну страницу? (y/n): ');
    if (createAnother.toLowerCase() === 'y') {
        await promptUser();
    } else {
        rl.close();
    }
}

console.log('Next.js Page Generation Script');
promptUser();
