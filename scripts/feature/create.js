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

async function generateFeature(featureName) {
  const featurePath = path.join('src', 'features', featureName);

  // Check if the feature already exists
  if (fs.existsSync(featurePath)) {
    console.log(`Feature ${featureName} уже существует.`);
    return;
  }

  createDirectory(featurePath);

  // Create index.ts
  const indexContent = `export * from './${featureName}';`;
  createFile(path.join(featurePath, 'index.ts'), indexContent);

  // Create main feature file
  const featureContent = `import React from 'react';

export const ${featureName} = () => {
  return (
    <div>
      <h2>${featureName} Feature</h2>
      {/* Add your feature content here */}
    </div>
  );
};
`;
  createFile(path.join(featurePath, `${featureName}.tsx`), featureContent);

  // Create test file
  const testContent = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${featureName} } from './${featureName}';

describe('${featureName}', () => {
  it('renders correctly', () => {
    render(<${featureName} />);
    expect(screen.getByText('${featureName} Feature')).toBeInTheDocument();
  });
});
`;
  createFile(path.join(featurePath, `${featureName}.test.tsx`), testContent);

  // Ask about creating additional folders
  const createModel = await askQuestion('Создать папку model для этой feature? (y/n): ');
  if (createModel.toLowerCase() === 'y') {
    const modelPath = path.join(featurePath, 'model');
    createDirectory(modelPath);
    createFile(path.join(modelPath, 'index.ts'), '// Export your models here');
  }

  const createLib = await askQuestion('Создать папку lib для этой feature? (y/n): ');
  if (createLib.toLowerCase() === 'y') {
    const libPath = path.join(featurePath, 'lib');
    createDirectory(libPath);
    createFile(path.join(libPath, 'index.ts'), '// Export your utility functions here');
  }

  console.log(`Feature ${featureName} успешно создана.`);
}

async function promptUser() {
  const featureName = await askQuestion('Введите название новой feature: ');
  await generateFeature(featureName);

  const createAnother = await askQuestion('Хотите создать еще одну feature? (y/n): ');
  if (createAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('FSD Feature Generation Script');
promptUser();
