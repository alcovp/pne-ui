import * as React from 'react'
import {DateRangePicker, type DateRangePickerProps} from '@mui/x-date-pickers-pro/DateRangePicker'
import {PneCalendarIcon} from './pickerIcons'
import {PNE_DATE_FORMAT} from './pickerLocale'
import PnePickerLocalization from './PnePickerLocalization'
import {usePnePicker, type PnePickerFieldProps} from './usePnePicker'

export type PneDateRangePickerProps = Omit<DateRangePickerProps, keyof PnePickerFieldProps> & PnePickerFieldProps

const DEFAULTS = {
    format: PNE_DATE_FORMAT,
    openPickerIcon: PneCalendarIcon,
}

/**
 * A field of two dates with a calendar of the range: the MUI X `DateRangePicker` in the UI Kit look. The field is the box of
 * PneTextField (`size`, `error`, `helperText`, a label over the box), the calendar is the library's.
 * Dates are dayjs dates; every other prop of the MUI X picker passes through.
 */
const PneDateRangePicker = React.forwardRef<HTMLDivElement, PneDateRangePickerProps>((props, ref) => {
    const picker = usePnePicker<DateRangePickerProps>(props, DEFAULTS)

    return <PnePickerLocalization>
        <DateRangePicker {...picker} ref={ref}/>
    </PnePickerLocalization>
})

PneDateRangePicker.displayName = 'PneDateRangePicker'

export default PneDateRangePicker
