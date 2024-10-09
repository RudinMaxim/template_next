# Руководство по проекту

## 0. Запуск проекта

Для запуска проекта выполните следующие команды:

```bash
npm install
npm run dev
```

Проект будет доступен по адресу [http://localhost:3000](http://localhost:3000)

## 1. Архитектура

Проект следует принципам Feature-Sliced Design (FSD). Основные слои:

- `features`: бизнес-функции приложения
- `entities`: бизнес-сущности
- `shared`: переиспользуемые компоненты и утилиты

### Добавление новых элементов

- Новая страница: добавьте в `src/app/(pages)`
- Новый компонент: используйте соответствующий слой (feature, entity, shared)
- Новая утилита: добавьте в `src/shared/lib`

### Команды для создания компонентов

```bash
# Создание feature
npm run create:feature

# Удаление feature
npm run remove:feature

# Создание entity
npm run create:entity

# Удаление entity
npm run remove:entity
```

## 2. Стили и BEM

Используем SCSS и методологию BEM для стилизации.

### Правила BEM

- Блок: `.block`
- Элемент: `.block__element`
- Модификатор: `.block--modifier` или `.block__element--modifier`

### Пример SCSS

```scss
.button {
  &__icon {
    // Стили для иконки
  }

  &--primary {
    // Стили для основной кнопки
  }
}
```

### Медиа-запросы

Используйте миксины для медиа-запросов:

```scss
@mixin mobile {
  @media (max-width: 767px) {
    @content;
  }
}

.element {
  width: 50%;

  @include mobile {
    width: 100%;
  }
}
```

## 3. Именование

- Компоненты: PascalCase (например, `UserProfile.tsx`)
- Файлы утилит: camelCase (например, `formatDate.ts`)
- Константы: UPPER_SNAKE_CASE (например, `MAX_ITEMS`)
- CSS классы: kebab-case для BEM (например, `user-profile__avatar`)

## 4. Тестирование

Используем Jest и React Testing Library.

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

## 5. Git Flow

1. Создайте ветку для задачи: `feature/add-user-profile`
2. Делайте коммиты с осмысленными сообщениями
3. Создайте Pull Request (PR) в `main`
4. Пройдите code review
5. После апрува, выполните merge в `main`

### Правила коммитов

Используйте префиксы для коммитов:

- `feat:` для новых функций
- `fix:` для исправления багов
- `refactor:` для рефакторинга
- `docs:` для обновления документации

Пример: `feat: add user profile page`

Помните о регулярных пушах в удаленный репозиторий для бэкапа и синхронизации с командой.
