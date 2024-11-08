export const METRIKA_CONFIG = {
  scriptUrl: 'https://mc.yandex.ru/metrika/tag.js',
  counterUrl: 'https://mc.yandex.ru/watch',
  defaultOptions: {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  },
} as const;
