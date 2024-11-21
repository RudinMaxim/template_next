# Тестирование

Используем Jest, React Testing Library и playwright.

### Правила тестирования

- Каждый компонент должен иметь unit-тесты
- Называйте тестовые файлы `ComponentName.test.tsx`
- Группируйте тесты с помощью `describe`
- Используйте говорящие названия для тестов

Пример:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Настройка playwright

```
npx playwright test
Runs the end-to-end tests.

npx playwright test --ui
Starts the interactive UI mode.

npx playwright test --project=chromium
Runs the tests only on Desktop Chrome.

npx playwright test example
Runs the tests in a specific file.

npx playwright test --debug
Runs the tests in debug mode.

npx playwright codegen
Auto generate tests with Codegen.
```
