import React, {useState} from 'react'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {expect, userEvent, waitFor, within} from 'storybook/test'
import {
    PneHeaderTableCell,
    PneSwitch,
    PneTableCell,
    PneTableRow,
    PneTableSwitchCell,
} from '../index'

type StatusRow = {
    id: number
    name: string
    status: boolean
    state: 'interactive' | 'disabled' | 'readOnly'
}

const initialRows: StatusRow[] = [
    {id: 1, name: 'Primary endpoint', status: true, state: 'interactive'},
    {id: 2, name: 'Fallback endpoint', status: false, state: 'disabled'},
    {id: 3, name: 'System endpoint', status: true, state: 'readOnly'},
]

type AsyncMutationOutcome = 'resolve' | 'reject' | 'pending'
type AsyncMutationPhase = 'idle' | 'pending' | 'resolved' | 'rejected'

type AsyncMutationRow = {
    checked: boolean
    name: string
    outcome: AsyncMutationOutcome
    phase: AsyncMutationPhase
    requestCount: number
}

const asyncMutationDelayMs = 800

const initialAsyncMutationRows: AsyncMutationRow[] = [
    {
        checked: false,
        name: 'Server resolves',
        outcome: 'resolve',
        phase: 'idle',
        requestCount: 0,
    },
    {
        checked: false,
        name: 'Server rejects',
        outcome: 'reject',
        phase: 'idle',
        requestCount: 0,
    },
    {
        checked: false,
        name: 'Request stays pending',
        outcome: 'pending',
        phase: 'idle',
        requestCount: 0,
    },
]

const asyncMutationPhaseLabel: Record<AsyncMutationPhase, string> = {
    idle: 'Idle',
    pending: 'Saving...',
    resolved: 'Confirmed',
    rejected: 'Rejected — rolled back',
}

const wait = (delayMs: number) => new Promise<void>(resolve => {
    window.setTimeout(resolve, delayMs)
})

const CompactStatusTable = () => {
    const [rows, setRows] = useState(initialRows)

    return <table aria-label='Endpoint statuses' style={{borderCollapse: 'collapse', width: 520}}>
        <thead>
            <PneTableRow>
                <PneHeaderTableCell>ID</PneHeaderTableCell>
                <PneHeaderTableCell>Name</PneHeaderTableCell>
                <PneHeaderTableCell sx={{padding: 0, textAlign: 'center', width: '40px'}}>
                    Status
                </PneHeaderTableCell>
            </PneTableRow>
        </thead>
        <tbody>
            {rows.map(row => <PneTableRow data-story-row key={row.id}>
                <PneTableCell>{row.id}</PneTableCell>
                <PneTableCell>{row.name}</PneTableCell>
                {row.state === 'readOnly'
                    ? <PneTableSwitchCell
                        aria-label={`${row.name} status`}
                        checked={row.status}
                        readOnly
                    />
                    : <PneTableSwitchCell
                        aria-label={`Enable ${row.name}`}
                        checked={row.status}
                        disabled={row.state === 'disabled'}
                        onChange={checked => setRows(current => current.map(item => (
                            item.id === row.id ? {...item, status: checked} : item
                        )))}
                    />}
            </PneTableRow>)}
        </tbody>
    </table>
}

const AsyncMutationTable = () => {
    const [rows, setRows] = useState(initialAsyncMutationRows)

    const updateRow = (
        outcome: AsyncMutationOutcome,
        update: (row: AsyncMutationRow) => AsyncMutationRow,
    ) => {
        setRows(current => current.map(row => row.outcome === outcome ? update(row) : row))
    }

    const handleChange = (
        outcome: AsyncMutationOutcome,
        nextChecked: boolean,
    ): PromiseLike<unknown> => {
        updateRow(outcome, row => ({
            ...row,
            phase: 'pending',
            requestCount: row.requestCount + 1,
        }))

        if (outcome === 'pending') {
            return new Promise<never>(() => undefined)
        }

        return wait(asyncMutationDelayMs).then(() => {
            if (outcome === 'reject') {
                updateRow(outcome, row => ({...row, phase: 'rejected'}))
                throw new Error('Storybook simulated a rejected status mutation')
            }

            updateRow(outcome, row => ({
                ...row,
                checked: nextChecked,
                phase: 'resolved',
            }))
        })
    }

    return <div data-story-verification='pending'>
        <table
            aria-label='Asynchronous status mutations'
            data-story-async-switch-table
            style={{borderCollapse: 'collapse', width: 680}}
        >
            <thead>
                <PneTableRow>
                    <PneHeaderTableCell>Backend result</PneHeaderTableCell>
                    <PneHeaderTableCell>Phase and requests</PneHeaderTableCell>
                    <PneHeaderTableCell sx={{padding: 0, textAlign: 'center', width: '58px'}}>
                        Status
                    </PneHeaderTableCell>
                </PneTableRow>
            </thead>
            <tbody>
                {rows.map(row => <PneTableRow
                    data-story-outcome={row.outcome}
                    key={row.outcome}
                >
                    <PneTableCell>{row.name}</PneTableCell>
                    <PneTableCell>
                        <output
                            data-story-phase={row.phase}
                            data-story-request-count={row.requestCount}
                        >
                            {asyncMutationPhaseLabel[row.phase]} · requests: {row.requestCount}
                        </output>
                    </PneTableCell>
                    <PneTableCell sx={{padding: 0, textAlign: 'center', width: '58px'}}>
                        <PneSwitch
                            aria-label={`${row.name} status`}
                            checked={row.checked}
                            onChange={(_event, checked) => handleChange(row.outcome, checked)}
                            size='medium'
                        />
                    </PneTableCell>
                </PneTableRow>)}
            </tbody>
        </table>
    </div>
}

const meta = {
    title: 'pne-ui/PneTable/Switch Cell',
    component: PneTableSwitchCell,
    parameters: {
        docs: {
            description: {
                component: 'Compact 40px table status cell. It fixes PneSwitch to the small size, '
                    + 'keeps the native input accessibly named, and prevents switch activation from '
                    + 'triggering an interactive row. Cell props are top-level; switch-only props use '
                    + '`switchProps`. `autoTestId` targets the input while top-level `data-*` props in '
                    + '`switchProps` remain on the same DOM anchor as direct PneSwitch usage.',
            },
        },
    },
} satisfies Meta<typeof PneTableSwitchCell>

export default meta
type Story = StoryObj<typeof meta>

export const CompactStatuses: Story = {
    args: {
        'aria-label': 'Endpoint status',
        checked: false,
        onChange: () => undefined,
    },
    render: () => <CompactStatusTable/>,
    play: ({canvasElement}) => {
        const rows = canvasElement.querySelectorAll<HTMLElement>('[data-story-row]')

        rows.forEach(row => {
            // MUI's 20.02px body line-height rounds the normal 8px-padded row
            // to 37px in Chromium. The switch cell must fit that baseline,
            // rather than restoring the previous ~49px regression.
            if (row.getBoundingClientRect().height > 38) {
                throw new Error('A compact status switch must not expand its normal table row')
            }
        })
    },
}

export const AsyncMutationLifecycle: Story = {
    args: {
        'aria-label': 'Asynchronous status',
        checked: false,
        onChange: () => undefined,
    },
    parameters: {
        docs: {
            description: {
                story: 'Promise-returning status changes move immediately to their optimistic value, '
                    + 'lock repeat activation while pending, keep the value after resolve, and roll it '
                    + 'back after reject. The final row intentionally never settles so the pending '
                    + 'repeating ripple remains available for visual inspection at the medium size.',
            },
        },
    },
    render: () => <AsyncMutationTable/>,
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement)
        const verification = canvasElement.querySelector<HTMLElement>('[data-story-verification]')!
        const resolveSwitch = canvas.getByRole('switch', {
            name: 'Server resolves status',
        }) as HTMLInputElement
        const rejectSwitch = canvas.getByRole('switch', {
            name: 'Server rejects status',
        }) as HTMLInputElement
        const pendingSwitch = canvas.getByRole('switch', {
            name: 'Request stays pending status',
        }) as HTMLInputElement
        const getStatus = (outcome: AsyncMutationOutcome) => canvasElement.querySelector<HTMLOutputElement>(
            `[data-story-outcome="${outcome}"] output`,
        )!

        const expectOptimisticPending = (input: HTMLInputElement, outcome: AsyncMutationOutcome) => {
            expect(input.checked).toBe(true)
            expect(input).toHaveAttribute('aria-busy', 'true')
            expect(input).toHaveAttribute('aria-disabled', 'true')
            expect(getStatus(outcome)).toHaveAttribute('data-story-phase', 'pending')
            expect(getStatus(outcome)).toHaveAttribute('data-story-request-count', '1')
        }

        await userEvent.click(resolveSwitch)
        expectOptimisticPending(resolveSwitch, 'resolve')

        await userEvent.click(resolveSwitch)
        expectOptimisticPending(resolveSwitch, 'resolve')

        await waitFor(() => {
            expect(resolveSwitch.checked).toBe(true)
            expect(resolveSwitch).not.toHaveAttribute('aria-busy')
            expect(resolveSwitch).not.toHaveAttribute('aria-disabled')
            expect(getStatus('resolve')).toHaveAttribute('data-story-phase', 'resolved')
            expect(getStatus('resolve')).toHaveAttribute('data-story-request-count', '1')
        }, {timeout: 3000})

        await userEvent.click(rejectSwitch)
        expectOptimisticPending(rejectSwitch, 'reject')

        await userEvent.click(rejectSwitch)
        expectOptimisticPending(rejectSwitch, 'reject')

        await waitFor(() => {
            expect(rejectSwitch.checked).toBe(false)
            expect(rejectSwitch).not.toHaveAttribute('aria-busy')
            expect(rejectSwitch).not.toHaveAttribute('aria-disabled')
            expect(getStatus('reject')).toHaveAttribute('data-story-phase', 'rejected')
            expect(getStatus('reject')).toHaveAttribute('data-story-request-count', '1')
        }, {timeout: 3000})

        await userEvent.click(pendingSwitch)
        expectOptimisticPending(pendingSwitch, 'pending')

        await userEvent.click(pendingSwitch)
        expectOptimisticPending(pendingSwitch, 'pending')

        verification.dataset.storyVerification = 'passed'
    },
}
