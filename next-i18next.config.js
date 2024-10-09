const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
  },
  localePath: path.resolve('./src/shared/assets/data'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};