import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton, PneCheckbox, PneLabeledCheckbox, type PneCheckboxSize} from '../../index'

export default {
    title: 'pne-ui 5/PneCheckbox',
    component: PneCheckbox,
    args: {
        'aria-label': 'Example checkbox',
        size: 'medium',
        disabled: false,
        readOnly: false,
        indeterminate: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
    },
} as Meta<typeof PneCheckbox>

type Story = StoryObj<typeof PneCheckbox>

const LABEL_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// The Figma matrix (StoryBook › pne-ui primitives › PneCheckbox): rows size × value, columns the
// states; small is the UI Kit sm 16, medium md 20, large lg 24.
type MatrixColumn = {
    label: string
    props: Partial<React.ComponentProps<typeof PneCheckbox>>
}

const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable', props: {}},
    {label: 'Hover', props: {'data-pne-state': 'hover'}},
    {label: 'Pressed', props: {'data-pne-state': 'pressed'}},
    {label: 'Focus', props: {'data-pne-state': 'focus'}},
    {label: 'Error', props: {'aria-invalid': true}},
    {label: 'Disable', props: {disabled: true}},
    {label: 'Read-only', props: {readOnly: true}},
]

type MatrixValue = 'checked' | 'unchecked' | 'indeterminate'

const MATRIX_ROWS: Array<{size: PneCheckboxSize, value: MatrixValue}> = (['medium', 'small', 'large'] as const)
    .flatMap(size => (['checked', 'unchecked', 'indeterminate'] as const).map(value => ({size, value})))

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2}}>
                Rows are size × value, columns the states as in the Figma matrix. Hover, Pressed and Focus are
                pinned with <code>data-pne-state</code>; product code never sets it.
            </Typography>
            <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 4px', ml: -2}}>
                <thead>
                    <tr>
                        <th/>
                        {MATRIX_COLUMNS.map(column => (
                            <Box component='th' key={column.label} sx={{...LABEL_SX, fontWeight: 400, textAlign: 'center'}}>
                                {column.label}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MATRIX_ROWS.map(row => (
                        <tr key={`${row.size}-${row.value}`}>
                            <Box component='th' sx={{...LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                                {row.size} · {row.value}
                            </Box>
                            {MATRIX_COLUMNS.map(column => (
                                <Box component='td' key={column.label} sx={{textAlign: 'center'}}>
                                    <PneCheckbox
                                        aria-label={`${row.size} ${column.label} ${row.value}`}
                                        checked={row.value === 'checked'}
                                        indeterminate={row.value === 'indeterminate'}
                                        onChange={() => undefined}
                                        size={row.size}
                                        {...column.props}
                                    />
                                </Box>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    ),
}

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const

type LogEntry = {at: string, text: string}

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}])
    const [picked, setPicked] = React.useState<string[]>([])
    const [confirmed, setConfirmed] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    const all = picked.length === CURRENCIES.length
    const some = picked.length > 0 && !all
    const confirmationMissing = submitted && !confirmed

    const toggleAll = () => {
        // A mixed parent turns on, as in the UI Kit; a full one clears the group.
        const next = all ? [] : [...CURRENCIES]
        setPicked(next)
        log(`Все валюты: ${next.length === 0 ? 'сняты' : 'выбраны'}`)
    }
    const toggle = (currency: string, checked: boolean) => {
        const next = checked ? [...picked, currency] : picked.filter(item => item !== currency)
        setPicked(next)
        log(`${currency}: ${checked ? 'выбрана' : 'снята'}, выбрано ${next.length} из ${CURRENCIES.length}`)
    }
    const submit = () => {
        setSubmitted(true)
        log(confirmed ? 'Отправлено' : 'Отправка: обязательный флажок не отмечен')
    }

    return (
        <Stack spacing={3} sx={{p: 3, maxWidth: 560}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Группа: родитель показывает «частично», когда выбрана часть детей; клик по родителю выбирает или
                снимает всех. Обязательный флажок подсвечивается ошибкой при отправке и очищается, как только его
                отметили.
            </Typography>
            <Box>
                <PneLabeledCheckbox
                    checked={all}
                    indeterminate={some}
                    label='Все валюты'
                    onChange={toggleAll}
                    size='medium'
                />
                <Stack sx={{pl: 3.5}}>
                    {CURRENCIES.map(currency => (
                        <PneLabeledCheckbox
                            checked={picked.includes(currency)}
                            key={currency}
                            label={currency}
                            onChange={(_event, checked) => toggle(currency, checked)}
                            size='medium'
                        />
                    ))}
                </Stack>
            </Box>
            <Stack spacing={1} sx={{alignItems: 'flex-start'}}>
                <PneLabeledCheckbox
                    checked={confirmed}
                    error={confirmationMissing}
                    formControlLabelProps={{required: true}}
                    helperText='Отметьте, чтобы продолжить'
                    label='Подтверждаю реквизиты'
                    onChange={(_event, checked) => {
                        setConfirmed(checked)
                        log(`Подтверждение: ${checked ? 'отмечено' : 'снято'}`)
                    }}
                    required
                    size='medium'
                />
                <PneButton onClick={submit} pneStyle='contained' size='medium'>Отправить</PneButton>
            </Stack>
            <Box>
                <Typography sx={{...LABEL_SX, mb: 0.5}}>Лог</Typography>
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
        <Box sx={{p: 3}}>
            <PneCheckbox {...args}/>
        </Box>
    ),
}
