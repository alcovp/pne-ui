import * as React from 'react'
import {Box, FormControlLabel, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneSwitch, type PneSwitchSize} from '../../index'

export default {
    title: 'pne-ui 5/PneSwitch',
    component: PneSwitch,
    args: {
        'aria-label': 'Example switch',
        size: 'medium',
        disabled: false,
        readOnly: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium']},
    },
} as Meta<typeof PneSwitch>

type Story = StoryObj<typeof PneSwitch>

const LABEL_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// The Figma matrix (StoryBook › pne-ui primitives · v2 › PneSwitch): rows size × value, columns
// the states in the Figma order; medium is the UI Kit md, small is xs.
type MatrixColumn = {
    label: string
    props: Partial<React.ComponentProps<typeof PneSwitch>>
}

const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable', props: {}},
    {label: 'Hover', props: {'data-pne-state': 'hover'}},
    {label: 'Disable', props: {disabled: true}},
    {label: 'Focus', props: {'data-pne-state': 'focus'}},
    {label: 'Pressed', props: {'data-pne-state': 'pressed'}},
    {label: 'Read-only', props: {readOnly: true}},
    {label: 'Loading', props: {'data-pne-state': 'loading'}},
]

// Figma «С подписью»: the label is 14/20 and 8px from the switch, grey when the switch is disabled.
const LABELLED_COLUMNS = MATRIX_COLUMNS.filter(column => column.label !== 'Pressed')
const SWITCH_LABEL_SX = {
    ml: 0,
    mr: 0,
    '& .MuiFormControlLabel-label': {fontSize: 14, lineHeight: '20px', ml: '-3px', whiteSpace: 'nowrap'},
} as const

const MATRIX_ROWS: Array<{size: PneSwitchSize, checked: boolean}> = [
    {size: 'medium', checked: true},
    {size: 'medium', checked: false},
    {size: 'small', checked: true},
    {size: 'small', checked: false},
]

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2}}>
                Rows are size × value, columns the states as in the Figma matrix. Hover, Pressed, Focus and
                Loading are pinned with <code>data-pne-state</code>; product code never sets it.
            </Typography>
            <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '24px 16px', ml: -3}}>
                <thead>
                    <tr>
                        <th/>
                        {MATRIX_COLUMNS.map(column => (
                            <Box component='th' key={column.label} sx={{...LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                                {column.label}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MATRIX_ROWS.map(row => (
                        <tr key={`${row.size}-${row.checked}`}>
                            <Box component='th' sx={{...LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                                {row.size} · {row.checked ? 'checked' : 'unchecked'}
                            </Box>
                            {MATRIX_COLUMNS.map(column => (
                                <td key={column.label}>
                                    <PneSwitch
                                        aria-label={`${row.size} ${column.label} ${row.checked ? 'on' : 'off'}`}
                                        checked={row.checked}
                                        onChange={() => undefined}
                                        size={row.size}
                                        {...column.props}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    ),
}

type Outcome = 'resolve' | 'reject' | 'never'

type LogEntry = {at: string, text: string}

const OUTCOMES: Array<{outcome: Outcome, title: string}> = [
    {outcome: 'resolve', title: 'Сервер подтверждает'},
    {outcome: 'reject', title: 'Сервер отклоняет'},
    {outcome: 'never', title: 'Запрос не завершается'},
]

const RESPONSE_DELAY_MS = 1200

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const DynamicsRow = ({outcome, title, log}: {outcome: Outcome, title: string, log: (text: string) => void}) => {
    const [checked, setChecked] = React.useState(false)
    const [status, setStatus] = React.useState('Готово · клик')
    const requests = React.useRef(0)

    const change = (_event: React.ChangeEvent<HTMLInputElement>, next: boolean) => {
        requests.current += 1
        const request = requests.current
        setStatus(`Сохранение… · запрос ${request}`)
        log(`${title}: запрос ${request}, значение ${next ? 'on' : 'off'}`)
        return new Promise<void>((resolve, reject) => {
            if (outcome === 'never') return
            window.setTimeout(() => {
                if (outcome === 'resolve') {
                    setChecked(next)
                    setStatus('Готово · значение применено')
                    log(`${title}: запрос ${request} подтверждён`)
                    resolve()
                } else {
                    setStatus('Откат + сообщение об ошибке')
                    log(`${title}: запрос ${request} отклонён, откат`)
                    reject(new Error('rejected'))
                }
            }, RESPONSE_DELAY_MS)
        })
    }

    return (
        <Stack direction='row' spacing={2} sx={{alignItems: 'center'}}>
            <Typography sx={{...LABEL_SX, width: 170}}>{title}</Typography>
            <PneSwitch aria-label={title} checked={checked} onChange={change} size='medium'/>
            <Typography sx={{fontSize: 13, color: status.startsWith('Откат') ? 'error.main' : 'text.secondary'}}>
                {status}{outcome === 'never' && status.startsWith('Сохранение') ? ' (повторный клик заблокирован)' : ''}
            </Typography>
        </Stack>
    )
}

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}])
    return (
        <Stack spacing={3} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Асинхронное изменение: значение переключается сразу, в ручке крутится спиннер, повторный клик
                заблокирован. При отказе сервера значение откатывается и появляется сообщение.
            </Typography>
            <Stack spacing={2}>
                {OUTCOMES.map(row => <DynamicsRow key={row.outcome} {...row} log={log}/>)}
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
            <PneSwitch {...args}/>
        </Box>
    ),
}

export const DisabledHints: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={2} sx={{p: 3}}>
            <FormControlLabel control={<PneSwitch checked disabled/>} label='Default hint'/>
            <FormControlLabel
                control={<PneSwitch checked disabled disabledHint='The filter is mandatory and cannot be disabled'/>}
                label='Specific reason'
            />
            <FormControlLabel control={<PneSwitch disabled disabledHint={false}/>} label='No hint'/>
        </Stack>
    ),
}

export const WithLabel: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={3} sx={{p: 3}}>
            <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '24px 12px', ml: -3}}>
                <thead>
                    <tr>
                        <th/>
                        {LABELLED_COLUMNS.map(column => (
                            <Box component='th' key={column.label} sx={{...LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                                {column.label}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[true, false].map(checked => (
                        <tr key={String(checked)}>
                            <Box component='th' sx={{...LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                                {checked ? 'checked' : 'unchecked'}
                            </Box>
                            {LABELLED_COLUMNS.map(column => (
                                <td key={column.label}>
                                    <FormControlLabel
                                        control={<PneSwitch checked={checked} onChange={() => undefined} {...column.props}/>}
                                        label='Уведомления о выплатах'
                                        sx={SWITCH_LABEL_SX}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
            <Stack spacing={1}>
                <FormControlLabel control={<PneSwitch defaultChecked size='medium'/>} label='Medium switch' sx={SWITCH_LABEL_SX}/>
                <FormControlLabel control={<PneSwitch defaultChecked size='small'/>} label='Small switch' sx={SWITCH_LABEL_SX}/>
            </Stack>
        </Stack>
    ),
}
