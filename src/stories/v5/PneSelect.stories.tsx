import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton, PneField, PneSelect} from '../../index'

type PlaygroundArgs = {
    label: string
    placeholder: string
    size: 'small' | 'medium' | 'large'
    variant: 'outlined' | 'filled'
    disabled: boolean
    error: boolean
}

// No `component`: the Playground args are not PneSelect's own props (its option type is generic).
export default {
    title: 'pne-ui 5/PneSelect',
    args: {
        label: 'Label',
        placeholder: 'Placeholder',
        size: 'medium',
        variant: 'outlined',
        disabled: false,
        error: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
        variant: {control: 'inline-radio', options: ['outlined', 'filled']},
    },
} as Meta<PlaygroundArgs>

type Story = StoryObj<PlaygroundArgs>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

type Currency = {code: string, title: string, disabled?: boolean}

const CURRENCIES: readonly Currency[] = [
    {code: 'USD', title: 'Доллар США'},
    {code: 'EUR', title: 'Евро'},
    {code: 'GBP', title: 'Британский фунт'},
    {code: 'KZT', title: 'Казахстанский тенге'},
    {code: 'CHF', title: 'Швейцарский франк', disabled: true},
]

// The code on the right of a row, as the meta of the UI Kit Dropdown list; PneSelect draws what
// renderOption returns.
const CurrencyOption = ({currency}: {currency: Currency}) => (
    <Box component='span' sx={{display: 'flex', flex: 1, gap: 2, justifyContent: 'space-between'}}>
        <span>{currency.title}</span>
        <Box component='span' sx={{color: 'text.secondary', fontSize: 12}}>{currency.code}</Box>
    </Box>
)

// The Figma matrix (StoryBook › pne-ui primitives › PneSelect): rows size × variant plus required,
// columns the states. The label above the box is PneField; MUI has no large select, so the large
// rows of the matrix are not here.
type MatrixColumn = {
    label: string
    value?: string
    field?: {error?: boolean, disabled?: boolean}
    pinned?: 'hover' | 'focus'
}

const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable'},
    {label: 'Hover', pinned: 'hover'},
    {label: 'Filled', value: 'Value'},
    {label: 'Focus', value: 'Value', pinned: 'focus'},
    {label: 'Error', field: {error: true}},
    {label: 'Disable', field: {disabled: true}},
]

type MatrixRow = {
    title: string
    size: 'small' | 'medium' | 'large'
    variant: 'outlined' | 'filled'
    required?: boolean
}

const MATRIX_ROWS: MatrixRow[] = [
    {title: 'small · fill', size: 'small', variant: 'filled'},
    {title: 'medium · fill', size: 'medium', variant: 'filled'},
    {title: 'large · fill', size: 'large', variant: 'filled'},
    {title: 'medium · required', size: 'medium', variant: 'filled', required: true},
    {title: 'small · outlined', size: 'small', variant: 'outlined'},
    {title: 'medium · outlined', size: 'medium', variant: 'outlined'},
    {title: 'large · outlined', size: 'large', variant: 'outlined'},
]

const MATRIX_OPTIONS = ['Value', 'Other value'] as const

const MatrixCell = ({row, column}: {row: MatrixRow, column: MatrixColumn}) => (
    <PneField
        disabled={column.field?.disabled}
        error={column.field?.error}
        label='Label'
        required={row.required}
        sx={{width: 168}}
    >
        <PneSelect
            data-pne-state={column.pinned}
            onChange={() => undefined}
            options={MATRIX_OPTIONS}
            placeholder='Placeholder'
            size={row.size}
            value={column.value === undefined ? null : 'Value'}
            variant={row.variant}
        />
    </PneField>
)

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 900}}>
                Rows are size × variant plus required, columns the states as in the Figma matrix. The label
                above the box is PneField. Hover and Focus are pinned with <code>data-pne-state</code>; product
                code never sets it. The open list is in the next story.
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

const OpenListDemo = ({size, variant}: Pick<PlaygroundArgs, 'size' | 'variant'>) => {
    const [open, setOpen] = React.useState(true)
    const [value, setValue] = React.useState<Currency | null>(CURRENCIES[1])

    // A list opened on load gives the picked row the keyboard highlight (it looks like hover), so the
    // specimen moves focus to the list itself and the picked row shows its own tint. Arrows still work.
    React.useEffect(() => {
        if (!open) return undefined
        const timer = window.setTimeout(() => document.querySelector<HTMLElement>('[role="listbox"]')?.focus(), 400)
        return () => window.clearTimeout(timer)
    }, [open])

    return (
        <Box sx={{p: 3, minHeight: 360}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 640}}>
                The list as it opens under the field: the picked row is tinted and checked, a hovered row is grey
                (pinned here on «Казахстанский тенге» with <code>data-pne-state</code>), a disabled row is pale. Row
                height and text stay MUI&apos;s.
            </Typography>
            <PneField label='Валюта' sx={{width: 280}}>
                <PneSelect
                    data-pne-state='focus'
                    getOptionDisabled={option => option.disabled === true}
                    getOptionKey={option => option.code}
                    getOptionLabel={option => option.title}
                    getOptionProps={option => option.code === 'KZT' ? {'data-pne-state': 'hover'} : {}}
                    onChange={setValue}
                    onClose={() => setOpen(false)}
                    onOpen={() => setOpen(true)}
                    open={open}
                    options={CURRENCIES}
                    renderOption={option => <CurrencyOption currency={option}/>}
                    renderValue={option => option?.title}
                    size={size}
                    value={value}
                    variant={variant}
                />
            </PneField>
        </Box>
    )
}

export const OpenList: Story = {
    argTypes: {
        label: {table: {disable: true}},
        placeholder: {table: {disable: true}},
        disabled: {table: {disable: true}},
        error: {table: {disable: true}},
    },
    render: args => <OpenListDemo size={args.size} variant={args.variant}/>,
}

type LogEntry = {at: string, text: string}

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}])
    const [value, setValue] = React.useState<Currency | null>(null)
    const [error, setError] = React.useState(false)
    const picked = React.useRef(false)

    const change = (next: Currency) => {
        picked.current = true
        setValue(next)
        setError(false)
        log(`Выбрано «${next.title}» → список закрыт`)
    }
    const close = () => {
        if (!picked.current) log('Закрыт без выбора (Esc или клик мимо)')
        picked.current = false
    }
    const submit = () => {
        setError(value === null)
        log(value === null ? 'Сохранение: Обязательное поле' : `Сохранено: ${value.code}`)
    }

    return (
        <Stack spacing={3} sx={{p: 3, maxWidth: 560}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Закрыто → открыт список → выбрано, список закрыт. Клавиатура: ↑ ↓ — по строкам, Enter — выбор, Esc —
                закрыть. Отправка без значения показывает ошибку обязательного поля; выбор её снимает.
            </Typography>
            <Stack spacing={2} sx={{alignItems: 'flex-start'}}>
                <PneField
                    error={error}
                    helperText={error ? 'Обязательное поле' : 'Валюта расчётов'}
                    label='Валюта'
                    required
                    sx={{width: 320}}
                >
                    <PneSelect
                        getOptionDisabled={option => option.disabled === true}
                        getOptionKey={option => option.code}
                        getOptionLabel={option => option.title}
                        onChange={change}
                        onClose={close}
                        onOpen={() => log('Открыт список')}
                        options={CURRENCIES}
                        placeholder='Выберите валюту'
                        renderOption={option => <CurrencyOption currency={option}/>}
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

const ENCODINGS = ['UTF-8', 'ANSI', 'KOI8-R'] as const

const PlaygroundDemo = (args: PlaygroundArgs) => {
    const [value, setValue] = React.useState<(typeof ENCODINGS)[number] | null>(null)

    return (
        <Box sx={{p: 3, width: 320}}>
            <PneSelect
                disabled={args.disabled}
                error={args.error}
                label={args.label}
                onChange={setValue}
                options={ENCODINGS}
                placeholder={args.placeholder}
                size={args.size}
                value={value}
                variant={args.variant}
            />
        </Box>
    )
}

export const Playground: Story = {
    render: args => <PlaygroundDemo {...args}/>,
}

type Region = {code: string, disabled: boolean, title: string}

const REGIONS: readonly Region[] = [
    {code: 'eu', disabled: false, title: 'Europe'},
    {code: 'apac', disabled: true, title: 'Asia Pacific'},
]

const ObjectOptionsDemo = () => {
    const [value, setValue] = React.useState<Region | null>({...REGIONS[0]})

    return (
        <Box sx={{p: 3, width: 320}}>
            <PneSelect
                getOptionDisabled={option => option.disabled}
                getOptionKey={option => option.code}
                getOptionLabel={option => option.title}
                getOptionProps={option => ({'data-region': option.code})}
                onChange={setValue}
                options={REGIONS}
                value={value}
            />
        </Box>
    )
}

/** Object options: the key, label, disabled flag and row attributes come from the option. */
export const ObjectOptions: Story = {
    parameters: {controls: {disable: true}},
    render: () => <ObjectOptionsDemo/>,
}
