import React from 'react';
import { render, screen } from '@testing-library/react';
import { Payment } from './Payment';

describe('Payment', () => {
  it('renders correctly', () => {
    render(<Payment />);
    expect(screen.getByText('Payment Feature')).toBeInTheDocument();
  });
});
