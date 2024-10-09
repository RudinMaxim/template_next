import { useState } from 'react';

type IUseInput = ReturnType<typeof useInput>;

export function useInput() {
  const [state, setState] = useState(null);

  // Добавьте логику хука здесь

  return { state };
}
