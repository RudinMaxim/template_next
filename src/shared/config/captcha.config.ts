export interface CaptchaConfig {
  sitekey: string;
  defaultLanguage: 'ru' | 'en' | 'be' | 'kk' | 'tt' | 'uk' | 'uz' | 'tr';
}

if (!process.env.NEXT_PUBLIC_YANDEX_CAPTCHA_SITE_KEY) {
  throw new Error('NEXT_PUBLIC_YANDEX_CAPTCHA_SITE_KEY is not defined in environment variables');
}

export const CaptchaConfig: CaptchaConfig = {
  sitekey: process.env.NEXT_PUBLIC_YANDEX_CAPTCHA_SITE_KEY,
  defaultLanguage: 'ru',
} as const;
