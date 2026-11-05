import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton, PneField, PneTextField} from '../../index'

export default {
    title: 'pne-ui 5/PneTextField',
    component: PneTextField,
    args: {
        label: 'Label',
        placeholder: 'Placeholder',
        helperText: '',
        size: 'small',
        variant: 'outlined',
        disabled: false,
        error: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium']},
        variant: {control: 'inline-radio', options: ['outlined', 'filled']},
    },
} as Meta<typeof PneTextField>

type Story = StoryObj<typeof PneTextField>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// The Figma matrix (StoryBook › pne-ui primitives › PneTextField): rows size × variant plus
// required and helper, columns the states. The label above the box is PneField; MUI has no
// large text field, so the large rows of the matrix are not here.
type MatrixColumn = {
    label: string
    value?: string
    field?: {error?: boolean, disabled?: boolean}
    control?: Partial<React.ComponentProps<typeof PneTextField>>
}

const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable'},
    {label: 'Hover', control: {'data-pne-state': 'hover'}},
    {label: 'Filled', value: 'Value'},
    {label: 'Focus', value: 'Value', control: {'data-pne-state': 'focus'}},
    {label: 'Error', field: {error: true}},
    {label: 'Disable', field: {disabled: true}},
]

type MatrixRow = {
    title: string
    size: 'small' | 'medium'
    variant: 'outlined' | 'filled'
    required?: boolean
    helper?: boolean
}

const MATRIX_ROWS: MatrixRow[] = [
    {title: 'small · fill', size: 'small', variant: 'filled'},
    {title: 'medium · fill', size: 'medium', variant: 'filled'},
    {title: 'small · required', size: 'small', variant: 'filled', required: true},
    {title: 'small · helper', size: 'small', variant: 'filled', helper: true},
    {title: 'small · outlined', size: 'small', variant: 'outlined'},
    {title: 'medium · outlined', size: 'medium', variant: 'outlined'},
]

const MatrixCell = ({row, column}: {row: MatrixRow, column: MatrixColumn}) => {
    const error = column.field?.error === true
    return (
        <PneField
            disabled={column.field?.disabled}
            error={error}
            helperText={row.helper ? (error ? 'Опишите, как исправить ошибку' : 'Подсказка о формате значения') : undefined}
            label='Label'
            required={row.required}
            sx={{width: 168}}
        >
            <PneTextField
                defaultValue={column.value}
                placeholder='Placeholder'
                size={row.size}
                variant={row.variant}
                {...column.control}
            />
        </PneField>
    )
}

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 900}}>
                Rows are size × variant plus required and helper, columns the states as in the Figma matrix. The
                label above the box is PneField. Hover and Focus are pinned with <code>data-pne-state</code>;
                product code never sets it.
            </Typography>
            <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 12px', ml: -2}}>
                <thead>
                    <tr>
                        <th/>
                        {MATRIX_COLUMNS.map(column => (
                            <Box component='th' key={column.label} sx={{...CAPTION_SX, fontWeight: 400, textAlign: 'left'}}>
                                {column.label}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MATRIX_ROWS.map(row => (
                        <tr key={row.title}>
                            <Box component='th' sx={{...CAPTION_SX, fontWeight: 400, textAlign: 'left', verticalAlign: 'top', pt: 3}}>
                                {row.title}
                            </Box>
                            {MATRIX_COLUMNS.map(column => (
                                <Box component='td' key={column.label} sx={{verticalAlign: 'top'}}>
                                    <MatrixCell column={column} row={row}/>
                                </Box>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    ),
}

type LogEntry = {at: string, text: string}

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}])
    const [value, setValue] = React.useState('')
    const [error, setError] = React.useState<string | null>(null)

    const validate = (next: string): string | null => {
        if (next.trim() === '') return 'Обязательное поле'
        return EMAIL.test(next) ? null : 'Введите адрес вида name@example.com'
    }
    const change = (next: string) => {
        setValue(next)
        // The error clears while the user types a fixed value.
        if (error !== null && validate(next) === null) {
            setError(null)
            log('Ошибка снята при вводе')
        }
    }
    const blur = () => {
        if (value.trim() === '') return
        const next = validate(value)
        setError(next)
        log(next === null ? 'Blur: значение принято' : `Blur: ${next}`)
    }
    const submit = () => {
        const next = validate(value)
        setError(next)
        log(next === null ? 'Сохранено' : `Сохранение: ${next}`)
    }

    return (
        <Stack spacing={3} sx={{p: 3, maxWidth: 560}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Валидация на blur: ошибка появляется после выхода из поля и снимается при вводе. Отправка формы с
                пустым обязательным полем показывает «Обязательное поле».
            </Typography>
            <Stack spacing={2} sx={{alignItems: 'flex-start'}}>
                <PneField
                    error={error !== null}
                    helperText={error ?? 'Рабочая почта мерчанта'}
                    label='Email'
                    required
                    sx={{width: 320}}
                >
                    <PneTextField
                        onBlur={blur}
                        onChange={event => change(event.target.value)}
                        placeholder='name@example.com'
                        value={value}
                    />
                </PneField>
                <PneButton onClick={submit} pneStyle='contained' size='medium'>Сохранить</PneButton>
            </Stack>
            <Box>
                <Typography sx={{...CAPTION_SX, mb: 0.5}}>Лог</Typography>
                <Box component='ul' sx={{m: 0, pl: 2, fontSize: 12, lineHeight: '18px', color: 'text.secondary'}}>
                    {entries.map((entry, index) => <li key={index}>{entry.at} — {entry.text}</li>)}
                </Box>
            </Box>
        </Stack>
    )
}

export const Dynamics: Story = {
    parameters: {controls: {disable: true}},
    render: () => <DynamicsDemo/>,
}

export const Playground: Story = {
    render: args => (
        <Box sx={{p: 3, width: 320}}>
            <PneTextField fullWidth {...args}/>
        </Box>
    ),
}
