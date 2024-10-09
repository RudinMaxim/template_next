import 'i18next';
import enCommon from '../assets/data/en/common.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
    };
  }
}