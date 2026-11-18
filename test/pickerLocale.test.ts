import dayjs from 'dayjs'
import {enUS, ruRU, zhCN} from '@mui/x-date-pickers/locales'

import {
    PNE_DATE_FORMAT,
    PNE_DATE_TIME_FORMAT,
    PNE_TIME_FORMAT,
    resolvePnePickerLocale,
} from '../src/component/date/pickerLocale'
import {resolveSearchUIPickerLocale} from '../src/component/search-ui/filters/datePickerLocale'

const textOf = (locale: typeof enUS) => locale.components.MuiLocalizationProvider.defaultProps.localeText

describe('the language table of the date pickers', () => {
    it.each([
        ['en', 'en', enUS],
        ['ru', 'ru', ruRU],
        ['ru-RU', 'ru', ruRU],
        ['RU', 'ru', ruRU],
        ['zh_CN', 'zh-cn', zhCN],
    ])('reads the Paynet language %s as the calendar language %s', (language, adapterLocale, texts) => {
        const locale = resolvePnePickerLocale(language)

        expect(locale.adapterLocale).toBe(adapterLocale)
        expect(locale.localeText).toBe(textOf(texts))
    })

    it.each([undefined, '', 'de', 'xx_YY'])('falls back to English for the language %p', language => {
        expect(resolvePnePickerLocale(language)).toBe(resolvePnePickerLocale('en'))
    })

    it('names only languages that dayjs knows: month names and the first day of the week follow them', () => {
        const day = dayjs('2026-11-18')

        expect(day.locale(resolvePnePickerLocale('ru').adapterLocale).format('MMMM')).toBe('ноябрь')
        expect(day.locale(resolvePnePickerLocale('ru').adapterLocale).startOf('week').format('DD.MM')).toBe('16.11')
        expect(day.locale(resolvePnePickerLocale('en').adapterLocale).format('MMMM')).toBe('November')
        expect(day.locale(resolvePnePickerLocale('en').adapterLocale).startOf('week').format('DD.MM')).toBe('15.11')
    })

    it('is the one table for SearchUI and the date pickers', () => {
        expect(resolveSearchUIPickerLocale).toBe(resolvePnePickerLocale)
    })

    it('keeps the day first in every format', () => {
        const day = dayjs('2026-11-18T08:05:00')

        expect(day.format(PNE_DATE_FORMAT)).toBe('18.11.2026')
        expect(day.format(PNE_DATE_TIME_FORMAT)).toBe('18.11.2026 08:05')
        expect(day.format(PNE_TIME_FORMAT)).toBe('08:05')
    })
})
