const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const componentTypes = ['ui', 'widget'];

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function updateRootIndexFile(type, componentName) {
  const rootIndexPath = path.join('src', type === 'ui' ? 'shared/ui' : 'widgets', 'index.ts');
  let content = '';

  if (fs.existsSync(rootIndexPath)) {
    content = fs.readFileSync(rootIndexPath, 'utf8');
  }

  const exportStatement = `export * from './${componentName}';\n`;
  if (!content.includes(exportStatement)) {
    content += exportStatement;
    fs.writeFileSync(rootIndexPath, content);
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function generateUIComponent(type, name) {
  const baseDir = path.join('src', type === 'ui' ? 'shared/ui' : 'widgets', name);

  // Проверка на существование компонента
  if (fs.existsSync(baseDir)) {
    console.log(`Компонент ${name} уже существует. Пожалуйста, выберите другое имя.`);
    return;
  }

  createDirectory(baseDir);

  // Создаем основной файл компонента
  const componentContent = `import React from 'react';
import styles from './${name}.module.scss';

interface ${name}Props {
  // Определите пропсы здесь
}

export function ${name}({}: ${name}Props) {
  return (
    <div className={styles.${name.toLowerCase()}}>
      <h1>${name}</h1>
    </div>
  );
}
`;
  createFile(path.join(baseDir, `${name}.tsx`), componentContent);

  // Спрашиваем о создании тестового файла
  const createTest = await askQuestion('Создать тестовый файл? (y/n): ');
  if (createTest.toLowerCase() === 'y') {
    const testContent = `import React from 'react';
import { render } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    const { getByText } = render(<${name} />);
    expect(getByText('${name}')).toBeInTheDocument();
  });
});
`;
    createFile(path.join(baseDir, `${name}.test.tsx`), testContent);
  }

  // Спрашиваем о создании файла стилей
  const createStyles = await askQuestion('Создать файл стилей? (y/n): ');
  if (createStyles.toLowerCase() === 'y') {
    const styleContent = `.${name.toLowerCase()} {
  // Добавьте стили здесь
}
`;
    createFile(path.join(baseDir, `${name}.module.scss`), styleContent);
  }

  // Спрашиваем о создании хука
  const createHook = await askQuestion('Создать хук для компонента? (y/n): ');
  let hookName = '';
  if (createHook.toLowerCase() === 'y') {
    hookName = `use${name}`;
    const hookContent = `import { useState } from 'react';

interface I${name}State {
  // Определите состояние здесь
}

interface I${name}Hook {
  state: ${name}State;
  // Добавьте другие возвращаемые значения здесь
}

export function ${hookName}(): ${name}Hook {
  const [state, setState] = useState<${name}State | null>(null);

  // Добавьте логику хука здесь

  return { state };
}
`;
    createFile(path.join(baseDir, `${hookName}.ts`), hookContent);

    // Обновляем основной файл компонента, чтобы использовать хук
    const updatedComponentContent = `import React from 'react';
import styles from './${name}.module.scss';
import { ${hookName} } from './${hookName}';

interface ${name}Props {
  // Определите пропсы здесь
}

export function ${name}({}: ${name}Props) {
  const { state } = ${hookName}();

  return (
    <div className={styles.${name.toLowerCase()}}>
      <h1>${name}</h1>
      {/* Используйте state из хука здесь */}
    </div>
  );
}
`;
    createFile(path.join(baseDir, `${name}.tsx`), updatedComponentContent);
  }

  // Создаем индексный файл
  const indexContent = `export * from './${name}';
${createHook.toLowerCase() === 'y' ? `export * from './${hookName}';` : ''}
`;
  createFile(path.join(baseDir, 'index.ts'), indexContent);

  // Обновляем корневой индексный файл
  updateRootIndexFile(type, name);

  console.log(`Компонент ${name} успешно создан в ${baseDir}`);
}

async function promptUser() {
  const type = await askQuestion(`Выберите тип компонента (${componentTypes.join('/')}): `);
  if (!componentTypes.includes(type)) {
    console.log('Неверный тип компонента. Пожалуйста, выберите из предложенных вариантов.');
    return promptUser();
  }

  const name = await askQuestion('Введите имя компонента: ');
  await generateUIComponent(type, name);

  const createAnother = await askQuestion('Хотите создать еще один компонент? (y/n): ');
  if (createAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('Скрипт для генерации UI компонентов и виджетов');
promptUser();
