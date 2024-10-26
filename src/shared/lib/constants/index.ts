const apiBaseUrl = process.env.API_URL;

/** @description - Адрес /api для запросов на бэк
 *  @example:
 *  header: (locale: LocaleType) => `${apiBaseUrl}/${locale}/path/to/endpoint`
 *  */

export const apiUrls = {
    notFound: () => `${apiBaseUrl}/path/to/endpoint`,
};
