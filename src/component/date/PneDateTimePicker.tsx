import * as React from 'react'
import {DateTimePicker, type DateTimePickerProps} from '@mui/x-date-pickers/DateTimePicker'
import {PneCalendarIcon} from './pickerIcons'
import {PNE_DATE_TIME_FORMAT} from './pickerLocale'
import PnePickerLocalization from './PnePickerLocalization'
import {usePnePicker, type PnePickerFieldProps} from './usePnePicker'

export type PneDateTimePickerProps = Omit<DateTimePickerProps, keyof PnePickerFieldProps> & PnePickerFieldProps

const DEFAULTS = {
    format: PNE_DATE_TIME_FORMAT,
    openPickerIcon: PneCalendarIcon,
    time: {views: ['year', 'month', 'day', 'hours', 'minutes']},
}

/**
 * A date and time field with a calendar and a clock: the MUI X `DateTimePicker` in the UI Kit look. The field is the box of
 * PneTextField (`size`, `error`, `helperText`, a label over the box), the calendar is the library's.
 * Dates are dayjs dates; every other prop of the MUI X picker passes through.
 */
const PneDateTimePicker = ({
    ref,
    ...props
}: React.PropsWithoutRef<PneDateTimePickerProps> & {ref?: React.Ref<HTMLDivElement>}) => {
    const picker = usePnePicker<DateTimePickerProps>(props, DEFAULTS)

    return (
        <PnePickerLocalization>
            <DateTimePicker {...picker} ref={ref} />
        </PnePickerLocalization>
    )
}

PneDateTimePicker.displayName = 'PneDateTimePicker'

export default PneDateTimePicker
