import * as React from 'react'
import {TimePicker, type TimePickerProps} from '@mui/x-date-pickers/TimePicker'
import {PneClockIcon} from './pickerIcons'
import {PNE_TIME_FORMAT} from './pickerLocale'
import PnePickerLocalization from './PnePickerLocalization'
import {usePnePicker, type PnePickerFieldProps} from './usePnePicker'

export type PneTimePickerProps = Omit<TimePickerProps, keyof PnePickerFieldProps> & PnePickerFieldProps

const DEFAULTS = {
    format: PNE_TIME_FORMAT,
    openPickerIcon: PneClockIcon,
    time: {views: ['hours', 'minutes']},
}

/**
 * A time field with a clock: the MUI X `TimePicker` in the UI Kit look. The field is the box of
 * PneTextField (`size`, `error`, `helperText`, a label over the box), the calendar is the library's.
 * Dates are dayjs dates; every other prop of the MUI X picker passes through.
 */
const PneTimePicker = React.forwardRef<HTMLDivElement, PneTimePickerProps>((props, ref) => {
    const picker = usePnePicker<TimePickerProps>(props, DEFAULTS)

    return <PnePickerLocalization>
        <TimePicker {...picker} ref={ref}/>
    </PnePickerLocalization>
})

PneTimePicker.displayName = 'PneTimePicker'

export default PneTimePicker
