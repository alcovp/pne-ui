import {PNE_DATE_FORMAT, resolvePnePickerLocale, type PnePickerLocale} from '../../date/pickerLocale'

/** The calendar language of the SearchUI date pickers is the one of every date picker of the library. */
export type SearchUIPickerLocale = PnePickerLocale

export const resolveSearchUIPickerLocale = resolvePnePickerLocale

/** Day first in every language, as in Wicket's `dd.MM.yyyy` and the React order page. */
export const SEARCH_UI_DATE_FORMAT = PNE_DATE_FORMAT
export const SEARCH_UI_DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm:ss'
