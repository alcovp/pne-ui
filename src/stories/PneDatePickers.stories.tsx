import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import dayjs, {type Dayjs} from 'dayjs'
import {expect, userEvent, waitFor, within} from 'storybook/test'
import {
    PneAutocomplete,
    PneDatePicker,
    PneDateRangePicker,
    PneDateTimePicker,
    PneField,
    PneTextField,
    PneTimePicker,
} from '../index'

export default {
    title: 'pne-ui/Date pickers',
    component: PneDatePicker,
    args: {
        label: 'Date',
        helperText: '',
        size: 'medium',
        disabled: false,
        fullWidth: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
    },
} as Meta<typeof PneDatePicker>

type Story = StoryObj<typeof PneDatePicker>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// A day that never moves, so the pictures of the stories stay the same.
const DAY = dayjs('2026-11-18T08:50:00')
const RANGE: [Dayjs, Dayjs] = [dayjs('2026-11-02T00:00:00'), dayjs('2026-11-18T23:59:00')]

type MatrixColumn = {
    label: string
    filled?: boolean
    error?: boolean
    disabled?: boolean
    state?: 'hover' | 'focus'
}

// The states of the UI Kit field: Active is a field that holds a date and is out of focus.
const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable'},
    {label: 'Hover', state: 'hover'},
    {label: 'Active', filled: true},
    {label: 'Focus', filled: true, state: 'focus'},
    {label: 'Error', filled: true, error: true},
    {label: 'Disable', filled: true, disabled: true},
]

type Size = 'small' | 'medium' | 'large'

type MatrixRow = {
    title: string
    width: number
    render: (column: MatrixColumn) => React.ReactNode
}

const common = (column: MatrixColumn, width: number) => ({
    'data-pne-state': column.state,
    disabled: column.disabled,
    error: column.error ? true : undefined,
    label: 'Label',
    sx: {width},
})

const dateRow = (size: Size): MatrixRow => ({
    title: `date · ${size}`,
    width: 168,
    render: column => <PneDatePicker {...common(column, 168)} size={size} value={column.filled ? DAY : null} />,
})

const MATRIX_ROWS: MatrixRow[] = [
    dateRow('small'),
    dateRow('medium'),
    dateRow('large'),
    {
        title: 'date and time',
        width: 200,
        render: column => <PneDateTimePicker {...common(column, 200)} value={column.filled ? DAY : null} />,
    },
    {
        title: 'time',
        width: 168,
        render: column => <PneTimePicker {...common(column, 168)} value={column.filled ? DAY : null} />,
    },
    {
        title: 'date · helper',
        width: 168,
        render: column => (
            <PneDatePicker
                {...common(column, 168)}
                helperText={column.error ? 'Такой даты нет' : 'День, месяц, год'}
                value={column.filled ? DAY : null}
            />
        ),
    },
    {
        title: 'date · in PneField',
        width: 168,
        render: column => (
            <PneField
                disabled={column.disabled}
                error={column.error}
                helperText={column.error ? 'Такой даты нет' : undefined}
                label='Label'
                required
                sx={{width: 168}}
            >
                <PneDatePicker data-pne-state={column.state} fullWidth value={column.filled ? DAY : null} />
            </PneField>
        ),
    },
]

const RANGE_ROWS: MatrixRow[] = [
    {
        title: 'date range',
        width: 232,
        render: column => <PneDateRangePicker {...common(column, 232)} value={column.filled ? RANGE : [null, null]} />,
    },
]

const MatrixTable = ({rows, columns}: {rows: MatrixRow[]; columns: MatrixColumn[]}) => (
    <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 12px', ml: -2}}>
        <thead>
            <tr>
                <th />
                {columns.map(column => (
                    <Box component='th' key={column.label} sx={{...CAPTION_SX, fontWeight: 400, textAlign: 'left'}}>
                        {column.label}
                    </Box>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map(row => (
                <tr key={row.title}>
                    <Box component='td' sx={{...CAPTION_SX, verticalAlign: 'top', pt: '24px'}}>
                        {row.title}
                    </Box>
                    {columns.map(column => (
                        <Box component='td' key={column.label} sx={{verticalAlign: 'top'}}>
                            {row.render(column)}
                        </Box>
                    ))}
                </tr>
            ))}
        </tbody>
    </Box>
)

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 900}}>
                The field of a date picker is the box of PneTextField: 24, 32 or 40px, a label over the box, the ring by
                the state. An empty field shows its format. Hover and Focus are pinned with <code>data-pne-state</code>;
                product code never sets it.
            </Typography>
            <MatrixTable columns={MATRIX_COLUMNS} rows={MATRIX_ROWS} />
            <MatrixTable columns={MATRIX_COLUMNS.filter(column => column.label !== 'Hover')} rows={RANGE_ROWS} />
        </Box>
    ),
}

const OPTIONS = ['Approved', 'Declined', 'Filtered']

const FormColumn = ({size}: {size: Size}) => (
    <Stack spacing={1.5} sx={{width: 240}}>
        <Typography sx={CAPTION_SX}>{size}</Typography>
        <PneTextField defaultValue='PNTEST-1000055950' fullWidth label='External ID' size={size} />
        <PneDateTimePicker fullWidth label='Transaction date' size={size} value={DAY} />
        <PneAutocomplete fullWidth label='Result status' options={OPTIONS} size={size} value='Approved' />
        <PneDatePicker fullWidth label='Bank date' size={size} value={null} />
        <PneTimePicker fullWidth label='Close day time' size={size} value={DAY} />
    </Stack>
)

/** A date field among the other fields of a form: the same box, text and label at every size. */
export const AmongFields: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack direction='row' spacing={4} sx={{p: 3}}>
            <FormColumn size='small' />
            <FormColumn size='medium' />
            <FormColumn size='large' />
        </Stack>
    ),
}

/** The calendar of the date and time field, opened by its button. */
export const OpenCalendar: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3, minHeight: 440}}>
            <PneDateTimePicker label='Transaction date' sx={{width: 220}} value={DAY} />
        </Box>
    ),
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement)
        await userEvent.click(canvas.getByRole('button', {name: /choose date/i}))
        const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog')
        await waitFor(() => expect(within(dialog).getByRole('gridcell', {name: '18'})).toBeVisible())
    },
}

/** A year far from today is a date like any other; a date that does not exist is an error. */
export const TypedDates: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack direction='row' spacing={3} sx={{p: 3}}>
            <PneDatePicker label='Year 2300' sx={{width: 168}} value={dayjs('2300-01-01')} />
            <PneDatePicker label='Year 1800' sx={{width: 168}} value={dayjs('1800-06-15')} />
            <PneDatePicker
                helperText='Не позже 10.11.2026'
                label='After the limit'
                maxDate={dayjs('2026-11-10')}
                sx={{width: 168}}
                value={DAY}
            />
        </Stack>
    ),
}

const PlaygroundPicker = (props: React.ComponentProps<typeof PneDatePicker>) => {
    const [value, setValue] = React.useState<Dayjs | null>(DAY)
    return (
        <Box sx={{p: 3}}>
            <PneDatePicker {...props} onChange={setValue} value={value} />
        </Box>
    )
}

export const Playground: Story = {
    render: args => <PlaygroundPicker {...args} />,
}
