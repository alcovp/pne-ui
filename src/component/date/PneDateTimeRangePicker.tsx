import * as React from 'react'
import {DateTimeRangePicker, type DateTimeRangePickerProps} from '@mui/x-date-pickers-pro/DateTimeRangePicker'
import {PneCalendarIcon} from './pickerIcons'
import {PNE_DATE_TIME_FORMAT} from './pickerLocale'
import PnePickerLocalization from './PnePickerLocalization'
import {usePnePicker, type PnePickerFieldProps} from './usePnePicker'

export type PneDateTimeRangePickerProps = Omit<DateTimeRangePickerProps, keyof PnePickerFieldProps> &
    PnePickerFieldProps

const DEFAULTS = {
    format: PNE_DATE_TIME_FORMAT,
    openPickerIcon: PneCalendarIcon,
    time: {views: ['day', 'hours', 'minutes']},
}

/**
 * A field of two dates with times, with a calendar of the range and a clock: the MUI X `DateTimeRangePicker` in the UI Kit look. The field is the box of
 * PneTextField (`size`, `error`, `helperText`, a label over the box), the calendar is the library's.
 * Dates are dayjs dates; every other prop of the MUI X picker passes through.
 */
const PneDateTimeRangePicker = ({
    ref,
    ...props
}: React.PropsWithoutRef<PneDateTimeRangePickerProps> & {ref?: React.Ref<HTMLDivElement>}) => {
    const picker = usePnePicker<DateTimeRangePickerProps>(props, DEFAULTS)

    return (
        <PnePickerLocalization>
            <DateTimeRangePicker {...picker} ref={ref} />
        </PnePickerLocalization>
    )
}

PneDateTimeRangePicker.displayName = 'PneDateTimeRangePicker'

export default PneDateTimeRangePicker
