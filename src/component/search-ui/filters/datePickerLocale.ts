import {enUS, frFR, ruRU, zhCN} from '@mui/x-date-pickers/locales'
import frLocale from 'dayjs/locale/fr'
import ruLocale from 'dayjs/locale/ru'
import zhCnLocale from 'dayjs/locale/zh-cn'

/**
 * Calendar language of the SearchUI date pickers.
 *
 * Without an adapter locale MUI X spoke English in every UI language: English month and day
 * names, Sunday-first weeks. The pickers now follow the UI language. The typed format does not:
 * every language shows Wicket's day-first dates, see `SEARCH_UI_DATE_FORMAT`.
 *
 * The dayjs locales are referenced, not only imported for their side effect, so a bundler that
 * trusts the package's `sideEffects: false` keeps them registered.
 */

type PickerLocaleText = typeof enUS.components.MuiLocalizationProvider.defaultProps.localeText

export type SearchUIPickerLocale = {
    adapterLocale: string
    localeText: PickerLocaleText
}

const localeTextOf = (locale: typeof enUS): PickerLocaleText =>
    locale.components.MuiLocalizationProvider.defaultProps.localeText

const PICKER_LOCALES: Readonly<Record<string, SearchUIPickerLocale>> = {
    en: {adapterLocale: 'en', localeText: localeTextOf(enUS)},
    fr: {adapterLocale: frLocale.name, localeText: localeTextOf(frFR)},
    ru: {adapterLocale: ruLocale.name, localeText: localeTextOf(ruRU)},
    zh: {adapterLocale: zhCnLocale.name, localeText: localeTextOf(zhCN)},
}

/** Paynet languages come as `en`, `ru`, `fr` and `zh_CN`; anything else falls back to English. */
export const resolveSearchUIPickerLocale = (language: string | undefined): SearchUIPickerLocale => {
    const base = (language || 'en').toLowerCase().split(/[-_]/)[0]
    return PICKER_LOCALES[base] ?? PICKER_LOCALES.en
}

/** Day first in every language, as in Wicket's `dd.MM.yyyy` and the React order page. */
export const SEARCH_UI_DATE_FORMAT = 'DD.MM.YYYY'
export const SEARCH_UI_DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm:ss'
