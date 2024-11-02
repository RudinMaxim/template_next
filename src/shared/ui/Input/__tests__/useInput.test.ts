import { renderHook } from '@testing-library/react';

import { useInput } from '../useInput';

describe('useInput', () => {
  it('returns the expected result', () => {
    const { result } = renderHook(() => useInput());
    // Добавьте проверки для возвращаемых значений хука
    expect(result.current).toBeDefined();
  });

  // Добавьте дополнительные тесты для логики хука
});
