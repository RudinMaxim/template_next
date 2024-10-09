import React from 'react';
import { render } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Input />);
    expect(getByText('Input')).toBeInTheDocument();
  });
});
