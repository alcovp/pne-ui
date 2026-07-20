import React, {useState} from 'react'
import {Meta, StoryObj} from '@storybook/react-webpack5'

import {PneAsyncAutocomplete, PneLoadOptions} from '../index'

type Account = {
    id: number
    displayName: string
}

type AsyncAutocompleteExampleProps = {
    controlled?: boolean
    delay?: number
    fail?: boolean
    minQueryLength?: number
}

const accounts: readonly Account[] = [
    {id: 1, displayName: 'Acme Europe'},
    {id: 2, displayName: 'Acme Asia Pacific'},
    {id: 3, displayName: 'Globex North America'},
    {id: 4, displayName: 'Umbrella Services'},
]

const AsyncAutocompleteExample = ({
    controlled = false,
    delay = 250,
    fail = false,
    minQueryLength = 0,
}: AsyncAutocompleteExampleProps) => {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [value, setValue] = useState<Account | null>(null)

    const loadOptions: PneLoadOptions<Account> = async (query, {signal}) => {
        await abortableDelay(delay, signal)

        if (fail) {
            throw new Error('Example request failed')
        }

        const normalizedQuery = query.trim().toLowerCase()
        return normalizedQuery === ''
            ? accounts
            : accounts.filter(account => account.displayName.toLowerCase().includes(normalizedQuery))
    }

    return <PneAsyncAutocomplete<Account>
        disablePortal
        helperText={controlled
            ? 'The story controls both popup and query state.'
            : 'Type to load matching remote accounts.'}
        inputValue={controlled ? inputValue : undefined}
        label="Account"
        loadErrorText="Accounts could not be loaded"
        loadOptions={loadOptions}
        minQueryLength={minQueryLength}
        onChange={(_event, nextValue) => setValue(nextValue)}
        onClose={controlled ? () => setOpen(false) : undefined}
        onInputChange={controlled
            ? (_event, nextInputValue) => setInputValue(nextInputValue)
            : undefined}
        onLoadError={() => undefined}
        onOpen={controlled ? () => setOpen(true) : undefined}
        open={controlled ? open : undefined}
        value={value}
    />
}

const meta = {
    title: 'pne-ui/PneAsyncAutocomplete',
    component: AsyncAutocompleteExample,
    args: {
        controlled: false,
        delay: 250,
        fail: false,
        minQueryLength: 0,
    },
    parameters: {
        docs: {
            description: {
                component: 'Remote autocomplete with cancellation, explicit reloads, and no component-level debounce.',
            },
        },
    },
} satisfies Meta<typeof AsyncAutocompleteExample>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Controlled: Story = {
    args: {
        controlled: true,
    },
}

export const Loading: Story = {
    args: {
        delay: 10_000,
    },
    parameters: {
        docs: {
            description: {
                story: 'Open the popup to inspect the loading adornment and announced loading state.',
            },
        },
    },
}

export const MinimumQueryLength: Story = {
    args: {
        minQueryLength: 3,
    },
}

export const LoadError: Story = {
    args: {
        fail: true,
    },
}

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
