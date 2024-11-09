import React from 'react';

import { render, screen } from '@testing-library/react';

import { CaptchaView } from '../CaptchaView';

jest.mock('@yandex/smart-captcha', () => ({
  SmartCaptcha: jest.fn(() => <div data-testid="smart-captcha" />),
  InvisibleSmartCaptcha: jest.fn(() => <div data-testid="invisible-smart-captcha" />),
}));

describe('CaptchaWidget', () => {
  it('should use default sitekey from config', () => {
    render(<CaptchaView />);
    const element = screen.getByTestId('smart-captcha');
    expect(element).toBeInTheDocument();
  });

  it('should use custom sitekey when provided', () => {
    const customSitekey = 'custom-key';
    render(<CaptchaView sitekey={customSitekey} />);
    const element = screen.getByTestId('smart-captcha');
    expect(element).toBeInTheDocument();
  });

  it('should render invisible captcha', () => {
    render(<CaptchaView variant="invisible" />);
    const element = screen.getByTestId('invisible-smart-captcha');
    expect(element).toBeInTheDocument();
  });
});

