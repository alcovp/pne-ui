import * as React from 'react'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {useTranslation} from 'react-i18next'
import {resolvePnePickerLocale} from './pickerLocale'

/**
 * The dates of the library's pickers are dayjs dates, and their calendars speak the UI language
 * (month and day names, the first day of the week, the words on the buttons).
 */
const PnePickerLocalization = ({children}: {children: React.ReactNode}) => {
    const {i18n} = useTranslation()
    const locale = resolvePnePickerLocale(i18n?.language)

    return <LocalizationProvider
        adapterLocale={locale.adapterLocale}
        dateAdapter={AdapterDayjs}
        localeText={locale.localeText}
    >
        {children}
    </LocalizationProvider>
}

export default PnePickerLocalization
