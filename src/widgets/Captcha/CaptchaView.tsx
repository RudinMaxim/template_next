'use client';
import React, { memo } from 'react';

import { SmartCaptcha, InvisibleSmartCaptcha } from '@yandex/smart-captcha';

import { CaptchaConfig } from '@/shared/config';

import styles from './Captcha.module.scss';

export interface CaptchaViewProps {
  variant?: 'visible' | 'invisible';
  language?: 'ru' | 'en' | 'be' | 'kk' | 'tt' | 'uk' | 'uz' | 'tr';
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onChallengeVisible?: () => void;
  onChallengeHidden?: () => void;
  visible?: boolean;
  resetKey?: number;
  className?: string;
  sitekey?: string;
}

export const CaptchaView = memo(
  ({
    variant = 'visible',
    language = CaptchaConfig.defaultLanguage,
    onSuccess,
    onError,
    onChallengeVisible,
    onChallengeHidden,
    visible,
    resetKey = 0,
    className,
    sitekey = CaptchaConfig.sitekey,
  }: CaptchaViewProps) => {
    const commonProps = {
      sitekey,
      language,
      onSuccess,
      onNetworkError: () => onError?.('Network error occurred'),
      onJavascriptError: (error: { message: string }) =>
        onError?.(`JavaScript error: ${error.message}`),
      onChallengeVisible,
      onChallengeHidden,
      className: `${styles.captcha} ${className || ''}`,
      key: resetKey,
    };

    if (variant === 'invisible') {
      return <InvisibleSmartCaptcha {...commonProps} visible={visible} />;
    }

    return <SmartCaptcha {...commonProps} />;
  }
);

CaptchaView.displayName = 'CaptchaView';
