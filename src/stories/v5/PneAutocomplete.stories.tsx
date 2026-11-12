import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneAutocomplete, PneField} from '../../index'

type PlaygroundArgs = {
    label: string
    placeholder: string
    size: 'small' | 'medium' | 'large'
    variant: 'outlined' | 'filled'
    multiple: boolean
    disabled: boolean
    error: boolean
}

// No `component`: the Playground args are not PneAutocomplete's own props (its option type is generic).
export default {
    title: 'pne-ui 5/PneAutocomplete',
    args: {
        label: 'Label',
        placeholder: 'Начните вводить',
        size: 'medium',
        variant: 'outlined',
        multiple: false,
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

type Currency = {id: string, displayName: string}

const CURRENCIES: readonly Currency[] = [
    {id: 'USD', displayName: 'Доллар США'},
    {id: 'EUR', displayName: 'Евро'},
    {id: 'GBP', displayName: 'Британский фунт'},
    {id: 'KZT', displayName: 'Казахстанский тенге'},
    {id: 'CHF', displayName: 'Швейцарский франк'},
]

const MERCHANTS: readonly Currency[] = [
    {id: 'fabrikam', displayName: 'Fabrikam'},
    {id: 'tailspin', displayName: 'Tailspin'},
    {id: 'north', displayName: 'Northwind'},
    {id: 'contoso', displayName: 'Contoso'},
]

// The code on the right of a row, as the meta of the UI Kit Dropdown list.
const renderCurrency = (
    {key, ...optionProps}: React.HTMLAttributes<HTMLLIElement> & {key: React.Key},
    option: Currency,
) => (
    <li key={key} {...optionProps} data-pne-state={option.id === 'KZT' ? 'hover' : undefined}>
        <Box component='span' sx={{display: 'flex', flex: 1, gap: 2, justifyContent: 'space-between'}}>
            <span>{option.displayName}</span>
            <Box component='span' sx={{color: 'text.secondary', fontSize: 12}}>{option.id}</Box>
        </Box>
    </li>
)

// The Figma matrix (StoryBook › pne-ui primitives › PneAutocomplete): rows size × variant, columns the
// states of the closed field. The label above the box is PneField; MUI has no large field.
type MatrixColumn = {
    label: string
    value?: Currency
    field?: {error?: boolean, disabled?: boolean}
    pinned?: 'hover' | 'focus'
}

const MATRIX_COLUMNS: MatrixColumn[] = [
    {label: 'Enable'},
    {label: 'Hover', pinned: 'hover'},
    {label: 'Filled', value: CURRENCIES[1]},
    {label: 'Focus', value: CURRENCIES[1], pinned: 'focus'},
    {label: 'Error', field: {error: true}},
    {label: 'Disable', field: {disabled: true}},
]

type MatrixRow = {title: string, size: 'small' | 'medium' | 'large', variant: 'outlined' | 'filled'}

const MATRIX_ROWS: MatrixRow[] = [
    {title: 'small · fill', size: 'small', variant: 'filled'},
    {title: 'medium · fill', size: 'medium', variant: 'filled'},
    {title: 'large · fill', size: 'large', variant: 'filled'},
    {title: 'small · outlined', size: 'small', variant: 'outlined'},
    {title: 'medium · outlined', size: 'medium', variant: 'outlined'},
    {title: 'large · outlined', size: 'large', variant: 'outlined'},
]

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 900}}>
                Rows are size × variant, columns the states of the closed field as in the Figma matrix. The label
                above the box is PneField. Hover and Focus are pinned with <code>data-pne-state</code>; product code
                never sets it. MUI shows the clear cross on hover and focus. The open lists are in Modes.
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
                                    <PneField
                                        disabled={column.field?.disabled}
                                        error={column.field?.error}
                                        label='Label'
                                        sx={{width: 168}}
                                    >
                                        <PneAutocomplete<Currency>
                                            data-pne-state={column.pinned}
                                            options={CURRENCIES}
                                            placeholder='Placeholder'
                                            size={row.size}
                                            value={column.value ?? null}
                                            variant={row.variant}
                                        />
                                    </PneField>
                                </Box>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    ),
}

const ModesDemo = () => {
    const [single, setSingle] = React.useState<Currency | null>(CURRENCIES[1])
    const [merchants, setMerchants] = React.useState<Currency[]>([MERCHANTS[0], MERCHANTS[1]])
    const [currencies, setCurrencies] = React.useState<Currency[]>([CURRENCIES[0], CURRENCIES[2]])

    return (
        <Box sx={{p: 3, minHeight: 520}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 3, maxWidth: 900}}>
                Single: the picked row is tinted and checked, a hovered row is grey (pinned on «Казахстанский тенге»).
                Multi: the values are UI Kit badges in the field, the list draws a checkbox in each row. Rows a
                consumer renders with <code>renderOption</code> keep their own content; in a multiple list their
                picked rows are tinted, as they may carry a checkbox of their own.
            </Typography>
            <Stack direction='row' spacing={4} sx={{alignItems: 'flex-start'}}>
                <PneField helperText='Подсказка о формате значения' label='Валюта' sx={{width: 260}}>
                    <PneAutocomplete<Currency>
                        onChange={(_event, value) => setSingle(value)}
                        options={CURRENCIES}
                        value={single}
                    />
                </PneField>
                <PneField helperText='Подсказка о формате значения' label='Валюта, открыт список' sx={{width: 260}}>
                    <PneAutocomplete<Currency>
                        data-pne-state='focus'
                        onChange={(_event, value) => setSingle(value)}
                        open
                        options={CURRENCIES}
                        renderOption={renderCurrency}
                        value={single}
                    />
                </PneField>
                <PneField helperText='Подсказка о формате значения' label='Торговцы' sx={{width: 300}}>
                    <PneAutocomplete<Currency, true>
                        multiple
                        onChange={(_event, value) => setMerchants(value)}
                        options={MERCHANTS}
                        value={merchants}
                    />
                </PneField>
                <PneField helperText='Подсказка о формате значения' label='Валюты, открыт список' sx={{width: 300}}>
                    <PneAutocomplete<Currency, true>
                        data-pne-state='focus'
                        disableCloseOnSelect
                        multiple
                        onChange={(_event, value) => setCurrencies(value)}
                        open
                        options={CURRENCIES}
                        value={currencies}
                    />
                </PneField>
            </Stack>
        </Box>
    )
}

export const Modes: Story = {
    parameters: {controls: {disable: true}},
    render: () => <ModesDemo/>,
}

const POPULAR = new Set(['USD', 'EUR'])
const SIZES = ['small', 'medium', 'large'] as const
// The specimens stand one under another, so a list never flips over its field.
const NO_FLIP = {popper: {modifiers: [{name: 'flip', enabled: false}]}}

// Figma «Список — Dropdown list»: a row of the list is as high as its field (24, 32, 40px), groups
// carry a caption and are split by a hairline, a multiple list draws a checkbox in each row.
const SizesDemo = () => {
    const [single, setSingle] = React.useState<Currency | null>(CURRENCIES[1])
    const [many, setMany] = React.useState<Currency[]>([CURRENCIES[0], CURRENCIES[2]])

    return (
        <Stack spacing={2} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', maxWidth: 900}}>
                The list follows the size of its field: rows of 24, 32 and 40px, the text and the checkbox of that
                size. The values of a multiple field are badges 8px lower than the box.
            </Typography>
            {SIZES.map(size => (
                <Stack direction='row' key={size} spacing={4} sx={{alignItems: 'flex-start', minHeight: size === 'large' ? 420 : size === 'medium' ? 360 : 300}}>
                    <Typography sx={{...CAPTION_SX, width: 56, pt: 3}}>{size}</Typography>
                    <PneField label='Валюта' sx={{width: 240}}>
                        <PneAutocomplete<Currency>
                            data-pne-state='focus'
                            groupBy={option => POPULAR.has(option.id) ? 'Популярные' : 'Все валюты'}
                            onChange={(_event, value) => setSingle(value)}
                            open
                            options={CURRENCIES}
                            renderOption={renderCurrency}
                            size={size}
                            slotProps={NO_FLIP}
                            value={single}
                        />
                    </PneField>
                    <PneField label='Валюты' sx={{width: 300}}>
                        <PneAutocomplete<Currency, true>
                            data-pne-state='focus'
                            disableCloseOnSelect
                            groupBy={option => POPULAR.has(option.id) ? 'Популярные' : 'Все валюты'}
                            multiple
                            onChange={(_event, value) => setMany(value)}
                            open
                            options={CURRENCIES}
                            size={size}
                            slotProps={NO_FLIP}
                            value={many}
                        />
                    </PneField>
                    <PneField label='Ничего не найдено' sx={{width: 240}}>
                        <PneAutocomplete<Currency>
                            data-pne-state='focus'
                            noOptionsText='Ничего не найдено'
                            open
                            options={[]}
                            size={size}
                            slotProps={NO_FLIP}
                            value={null}
                        />
                    </PneField>
                </Stack>
            ))}
        </Stack>
    )
}

export const Sizes: Story = {
    parameters: {controls: {disable: true}},
    render: () => <SizesDemo/>,
}

type LogEntry = {at: string, text: string}

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}])
    const [value, setValue] = React.useState<Currency | null>(null)
    const hasMatches = (query: string) => CURRENCIES.some(option => option.displayName.toLowerCase().includes(query.trim().toLowerCase()))

    return (
        <Stack spacing={3} sx={{p: 3, maxWidth: 560, minHeight: 480}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Ввод фильтрует список, выбор закрывает его и ставит значение; крестик очищает поле. Запрос без совпадений
                показывает «Ничего не найдено».
            </Typography>
            <PneField helperText='Начните вводить название валюты' label='Валюта' sx={{width: 320}}>
                <PneAutocomplete<Currency>
                    noOptionsText='Ничего не найдено'
                    onChange={(_event, next, reason) => {
                        setValue(next)
                        log(next === null ? `Очищено (${reason})` : `Выбрано «${next.displayName}» → список закрыт`)
                    }}
                    onClose={() => log('Список закрыт')}
                    onInputChange={(_event, next, reason) => {
                        if (reason === 'input') {
                            log(next === '' ? 'Запрос стёрт' : `«${next}» → ${hasMatches(next) ? 'список отфильтрован' : 'Ничего не найдено'}`)
                        }
                    }}
                    onOpen={() => log('Открыт список')}
                    options={CURRENCIES}
                    placeholder='Начните вводить'
                    value={value}
                />
            </PneField>
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

const PlaygroundDemo = (args: PlaygroundArgs) => {
    const [single, setSingle] = React.useState<Currency | null>(null)
    const [many, setMany] = React.useState<Currency[]>([])
    const common = {
        disabled: args.disabled,
        error: args.error,
        label: args.label,
        options: CURRENCIES,
        placeholder: args.placeholder,
        size: args.size,
        variant: args.variant,
    }

    return (
        <Box sx={{p: 3, width: 360}}>
            {args.multiple
                ? <PneAutocomplete<Currency, true>
                    {...common}
                    multiple
                    onChange={(_event, value) => setMany(value)}
                    value={many}
                />
                : <PneAutocomplete<Currency>
                    {...common}
                    onChange={(_event, value) => setSingle(value)}
                    value={single}
                />}
        </Box>
    )
}

export const Playground: Story = {
    render: args => <PlaygroundDemo {...args}/>,
}

type Region = {code: string, title: string}

const REGIONS: readonly Region[] = [
    {code: 'eu', title: 'Shared display label'},
    {code: 'apac', title: 'Shared display label'},
]

const CustomObjectDemo = () => {
    const [value, setValue] = React.useState<Region | null>({...REGIONS[1]})

    return (
        <Box sx={{p: 3, width: 320}}>
            <PneAutocomplete<Region>
                getOptionKey={option => option.code}
                getOptionLabel={option => option.title}
                helperText='Duplicate labels remain distinct because keys are explicit.'
                label='Region'
                onChange={(_event, next) => setValue(next)}
                options={REGIONS}
                value={value}
            />
        </Box>
    )
}

/** Explicit keys keep duplicate labels distinct; a value restored from the API is matched by key. */
export const CustomObjectWithDuplicateLabels: Story = {
    parameters: {controls: {disable: true}},
    render: () => <CustomObjectDemo/>,
}

const MultipleFreeSoloDemo = () => {
    const [value, setValue] = React.useState<readonly string[]>(['Known option'])

    return (
        <Box sx={{p: 3, width: 360}}>
            <PneAutocomplete<string, true, false, true>
                freeSolo
                label='Tags'
                multiple
                onChange={(_event, next) => setValue(next)}
                options={['Known option', 'Another option']}
                value={[...value]}
            />
        </Box>
    )
}

export const MultipleFreeSolo: Story = {
    parameters: {controls: {disable: true}},
    render: () => <MultipleFreeSoloDemo/>,
}
