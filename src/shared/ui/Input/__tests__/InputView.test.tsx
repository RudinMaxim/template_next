import React from 'react';
import { render, screen } from '@testing-library/react';
import { InputView } from '../InputView';

describe('InputView', () => {
  it('renders correctly', () => {
    render(<InputView />);
    expect(screen.getByText('Input')).toBeInTheDocument();
  });

  // Добавьте дополнительные тесты для отображения
});
