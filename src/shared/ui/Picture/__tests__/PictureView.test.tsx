import React from 'react';

import { render, screen } from '@testing-library/react';

import { PictureView } from '../PictureView';

describe('PictureView', () => {
  it('renders correctly', () => {
    render(<PictureView src={''} />);
    expect(screen.getByText('Picture')).toBeInTheDocument();
  });

  // Добавьте дополнительные тесты для отображения
});
