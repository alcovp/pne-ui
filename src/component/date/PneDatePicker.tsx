import * as React from 'react'
import {DatePicker, type DatePickerProps} from '@mui/x-date-pickers/DatePicker'
import {PneCalendarIcon} from './pickerIcons'
import {PNE_DATE_FORMAT} from './pickerLocale'
import PnePickerLocalization from './PnePickerLocalization'
import {usePnePicker, type PnePickerFieldProps} from './usePnePicker'

export type PneDatePickerProps = Omit<DatePickerProps, keyof PnePickerFieldProps> & PnePickerFieldProps

const DEFAULTS = {
    format: PNE_DATE_FORMAT,
    openPickerIcon: PneCalendarIcon,
}

/**
 * A date field with a calendar: the MUI X `DatePicker` in the UI Kit look. The field is the box of
 * PneTextField (`size`, `error`, `helperText`, a label over the box), the calendar is the library's.
 * Dates are dayjs dates; every other prop of the MUI X picker passes through.
 */
const PneDatePicker = ({ref, ...props}: React.PropsWithoutRef<PneDatePickerProps> & {ref?: React.Ref<HTMLDivElement>}) => {
    const picker = usePnePicker<DatePickerProps>(props, DEFAULTS)

    return <PnePickerLocalization>
        <DatePicker {...picker} ref={ref}/>
    </PnePickerLocalization>
}

PneDatePicker.displayName = 'PneDatePicker'

export default PneDatePicker
