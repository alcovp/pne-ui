import * as React from 'react'
import dayjs, {type Dayjs} from 'dayjs'

import {
    PneDatePicker,
    type PneDatePickerProps,
    PneDateRangePicker,
    PneDateTimePicker,
    PnePickerTextField,
    PneTimePicker,
} from 'pne-ui'

const day: Dayjs | null = dayjs('2026-11-18')
const rootRef = React.createRef<HTMLDivElement>()

// The props of the MUI X picker pass through; the field props of the library come on top.
const dateProps: PneDatePickerProps = {
    disableFuture: true,
    error: false,
    fullWidth: true,
    helperText: 'Day, month, year',
    label: 'Bank date',
    maxDate: day,
    onChange: value => {
        const next: Dayjs | null = value
        void next
    },
    required: true,
    size: 'large',
    value: day,
}

const date = <PneDatePicker {...dateProps} ref={rootRef}/>
const dateTime = <PneDateTimePicker format='DD.MM.YYYY HH:mm:ss' size='small' value={day}/>
const time = <PneTimePicker value={day}/>
const range = <PneDateRangePicker value={[day, null]}/>
const ownField = <PneDatePicker slots={{textField: PnePickerTextField}} slotProps={{textField: {sx: {width: 200}}}}/>

// @ts-expect-error A field has three sizes: small, medium and large.
const wrongSize = <PneDatePicker size='huge'/>

// @ts-expect-error A date is a dayjs date or null, not a string.
const wrongValue = <PneDatePicker value='2026-11-18'/>

void date
void dateTime
void time
void range
void ownField
void wrongSize
void wrongValue
