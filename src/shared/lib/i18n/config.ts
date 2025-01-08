import { LocalePrefix, Pathnames } from "next-intl/routing";

export const locales =  ['en', 'ru'] as const;

export type Locales = typeof locales;

export const pathnames: Pathnames<Locales> = {
    "/": "/",
    "/about": "/about",

}

export const localePrefix: LocalePrefix<Locales> = "always"