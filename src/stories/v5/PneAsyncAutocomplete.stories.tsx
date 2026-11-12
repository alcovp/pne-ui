import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneAsyncAutocomplete, PneField, PneLoadOptions} from '../../index'

type PlaygroundArgs = {
    controlled: boolean
    delay: number
    fail: boolean
    minQueryLength: number
}

// No `component`: the Playground args drive a demo loader, they are not PneAsyncAutocomplete's props.
export default {
    title: 'pne-ui 5/PneAsyncAutocomplete',
    args: {
        controlled: false,
        delay: 400,
        fail: false,
        minQueryLength: 0,
    },
} as Meta<PlaygroundArgs>

type Story = StoryObj<PlaygroundArgs>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

type Account = {id: number, displayName: string}

const ACCOUNTS: readonly Account[] = [
    {id: 1, displayName: 'Acme Europe'},
    {id: 2, displayName: 'Acme Asia Pacific'},
    {id: 3, displayName: 'Globex North America'},
    {id: 4, displayName: 'Umbrella Services'},
]

const abortableDelay = (milliseconds: number, signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timeout)
            reject(new DOMException('Request aborted', 'AbortError'))
        }
        const timeout = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, milliseconds)

        if (signal.aborted) {
            onAbort()
            return
        }

        signal.addEventListener('abort', onAbort, {once: true})
    })

const search = (query: string): readonly Account[] => {
    const normalized = query.trim().toLowerCase()
    return normalized === ''
        ? ACCOUNTS
        : ACCOUNTS.filter(account => account.displayName.toLowerCase().includes(normalized))
}

const createLoader = ({delay, fail}: {delay: number, fail: boolean}): PneLoadOptions<Account> =>
    async (query, {signal}) => {
        await abortableDelay(delay, signal)
        if (fail) {
            throw new Error('Example request failed')
        }
        return search(query)
    }

// Each state of the open list side by side: the service rows of the UI Kit Dropdown list.
type StateColumn = {
    title: string
    loadOptions: PneLoadOptions<Account>
    minQueryLength?: number
}

const STATE_COLUMNS: StateColumn[] = [
    {title: 'Options', loadOptions: createLoader({delay: 0, fail: false})},
    {title: 'Loading', loadOptions: () => new Promise<readonly Account[]>(() => undefined)},
    {title: 'Error', loadOptions: createLoader({delay: 0, fail: true})},
    {title: 'Min query', loadOptions: createLoader({delay: 0, fail: false}), minQueryLength: 3},
    {title: 'Empty', loadOptions: async () => []},
]

export const States: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3, minHeight: 420}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 3, maxWidth: 900}}>
                The open list in each state of a remote search: options, loading (the spinner stands in the list),
                a failed load (an error row), a query shorter than <code>minQueryLength</code> and nothing found.
            </Typography>
            <Stack direction='row' spacing={3} sx={{alignItems: 'flex-start'}}>
                {STATE_COLUMNS.map(column => (
                    <Box key={column.title} sx={{width: 220}}>
                        <Typography sx={{...CAPTION_SX, mb: 1}}>{column.title}</Typography>
                        <PneField label='Account'>
                            <PneAsyncAutocomplete<Account>
                                data-pne-state='focus'
                                defaultOpen
                                loadErrorText='Не удалось загрузить список'
                                loadOptions={column.loadOptions}
                                loadingText='Загрузка…'
                                minQueryLength={column.minQueryLength}
                                minQueryLengthText={minimum => `Введите ещё символы для поиска (от ${minimum})`}
                                noOptionsText='Ничего не найдено'
                                onLoadError={() => undefined}
                                placeholder='Начните вводить'
                            />
                        </PneField>
                    </Box>
                ))}
            </Stack>
        </Box>
    ),
}

type LogEntry = {at: string, text: string}

const timestamp = () => new Date().toLocaleTimeString('ru-RU', {hour12: false})

const DynamicsDemo = () => {
    const [entries, setEntries] = React.useState<LogEntry[]>([])
    const log = React.useCallback(
        (text: string) => setEntries(current => [...current.slice(-11), {at: timestamp(), text}]),
        [],
    )
    const [value, setValue] = React.useState<Account | null>(null)
    const loadOptions = React.useMemo<PneLoadOptions<Account>>(() => async (query, {reason, signal}) => {
        log(`Запрос «${query}» (${reason})`)
        await abortableDelay(600, signal)
        const found = search(query)
        log(found.length === 0 ? 'Ответ: ничего не найдено' : `Ответ: ${found.length}`)
        return found
    }, [log])

    return (
        <Stack spacing={3} sx={{p: 3, maxWidth: 560, minHeight: 480}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Открытие загружает список, ввод — новый запрос (прежний отменяется), пока идёт загрузка, в списке
                крутится спиннер. Выбор закрывает список.
            </Typography>
            <PneField helperText='Поиск по названию счёта' label='Счёт' sx={{width: 320}}>
                <PneAsyncAutocomplete<Account>
                    loadOptions={loadOptions}
                    loadingText='Загрузка…'
                    noOptionsText='Ничего не найдено'
                    onChange={(_event, next) => {
                        setValue(next)
                        log(next === null ? 'Очищено' : `Выбрано «${next.displayName}»`)
                    }}
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

const PlaygroundDemo = ({controlled, delay, fail, minQueryLength}: PlaygroundArgs) => {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const [value, setValue] = React.useState<Account | null>(null)
    const loadOptions = React.useMemo(() => createLoader({delay, fail}), [delay, fail])

    return (
        <Box sx={{p: 3, width: 360}}>
            <PneAsyncAutocomplete<Account>
                helperText={controlled
                    ? 'The story controls both popup and query state.'
                    : 'Type to load matching remote accounts.'}
                inputValue={controlled ? inputValue : undefined}
                label='Account'
                loadErrorText='Accounts could not be loaded'
                loadOptions={loadOptions}
                minQueryLength={minQueryLength}
                onChange={(_event, next) => setValue(next)}
                onClose={controlled ? () => setOpen(false) : undefined}
                onInputChange={controlled ? (_event, next) => setInputValue(next) : undefined}
                onLoadError={() => undefined}
                onOpen={controlled ? () => setOpen(true) : undefined}
                open={controlled ? open : undefined}
                reloadKey={`${delay}:${fail}`}
                value={value}
            />
        </Box>
    )
}

/** Remote search with cancellation and explicit reloads; the component does not debounce calls. */
export const Playground: Story = {
    render: args => <PlaygroundDemo {...args}/>,
}
