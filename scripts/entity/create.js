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

async function generateEntity(entityName) {
  const entityPath = path.join('src', 'entities', entityName);

  // Check if the entity already exists
  if (fs.existsSync(entityPath)) {
    console.log(`Entity ${entityName} уже существует.`);
    return;
  }

  createDirectory(entityPath);

  // Create index.ts
  const indexContent = `export * from './model';
export * from './ui';`;
  createFile(path.join(entityPath, 'index.ts'), indexContent);

  // Create model.ts
  const modelContent = `export interface ${entityName}Model {
    id: string;
    // Add other properties here
}

export const initial${entityName}State: ${entityName}Model = {
    id: '',
    // Initialize other properties here
};`;
  createFile(path.join(entityPath, 'model.ts'), modelContent);

  // Create ui folder and index.ts
  const uiPath = path.join(entityPath, 'ui');
  createDirectory(uiPath);
  const uiIndexContent = `export * from './${entityName}';`;
  createFile(path.join(uiPath, 'index.ts'), uiIndexContent);

  // Create main UI component
  const componentContent = `import React from 'react';
import { ${entityName}Model } from '../model';

interface ${entityName}Props {
    data: ${entityName}Model;
}

export const ${entityName}: React.FC<${entityName}Props> = ({ data }) => {
    return (
        <div>
            <h2>${entityName}</h2>
            <p>ID: {data.id}</p>
            {/* Add more fields here */}
        </div>
    );
};`;
  createFile(path.join(uiPath, `${entityName}.tsx`), componentContent);

  // Create test file
  const testContent = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${entityName} } from './${entityName}';
import { ${entityName}Model } from '../model';

describe('${entityName}', () => {
    const mockData: ${entityName}Model = {
        id: '1',
        // Add other mock properties here
    };

    it('renders correctly', () => {
        render(<${entityName} data={mockData} />);
        expect(screen.getByText('${entityName}')).toBeInTheDocument();
        expect(screen.getByText('ID: 1')).toBeInTheDocument();
        // Add more assertions here
    });
});`;
  createFile(path.join(uiPath, `${entityName}.test.tsx`), testContent);

  console.log(`Entity ${entityName} успешно создана.`);
}

async function promptUser() {
  const entityName = await askQuestion('Введите название новой entity: ');
  await generateEntity(entityName);

  const createAnother = await askQuestion('Хотите создать еще одну entity? (y/n): ');
  if (createAnother.toLowerCase() === 'y') {
    await promptUser();
  } else {
    rl.close();
  }
}

console.log('FSD Entity Generation Script');
promptUser();
