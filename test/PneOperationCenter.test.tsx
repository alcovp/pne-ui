import * as React from 'react'
import {fireEvent, render, screen, within} from '@testing-library/react'

import {
    PneOperationCenter,
    type PneOperationCenterItem,
    type PneOperationCenterStatus,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, options?: Record<string, unknown> & {defaultValue?: string}) =>
            Object.entries(options ?? {}).reduce(
                (value, [key, replacement]) => value.replace(
                    `{{${key}}}`,
                    key === 'defaultValue' ? `{{${key}}}` : String(replacement),
                ),
                options?.defaultValue ?? _key,
            ),
    }),
}))

const operation = (
    id: string,
    status: PneOperationCenterStatus,
    overrides: Partial<PneOperationCenterItem> = {},
): PneOperationCenterItem => ({
    id,
    status,
    title: `Operation ${id}`,
    ...overrides,
})

describe('PneOperationCenter', () => {
    it('does not render an empty operation collection', () => {
        const {container} = render(<PneOperationCenter operations={[]}/>)

        expect(container.firstChild).toBeNull()
    })

    it('renders a collapsed summary and expands into an accessible operation list', () => {
        const operations = [
            operation('report', 'running', {
                context: 'Order #8861110',
                detail: 'Preparing transaction rows',
                progress: {kind: 'determinate', value: 127},
            }),
            operation('callback', 'queued', {
                progress: {kind: 'indeterminate', label: 'Waiting for processor'},
            }),
            operation('monitor', 'monitoring-error'),
            operation('done', 'succeeded'),
        ]

        render(<PneOperationCenter operations={operations}/>)

        const trigger = screen.getByRole('button', {name: 'Show background operations'})
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(screen.getByText('2 active')).toBeTruthy()
        expect(screen.getByText('1 needs attention')).toBeTruthy()
        expect(screen.getByText('1 finished')).toBeTruthy()
        expect(screen.queryByRole('region', {name: 'Background operations'})).toBeNull()

        fireEvent.click(trigger)

        const region = screen.getByRole('region', {name: 'Background operations'})
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        expect(within(region).getByRole('list', {name: 'Background operations'})).toBeTruthy()
        expect(within(region).getByText('Order #8861110')).toBeTruthy()
        expect(within(region).getByText('Preparing transaction rows')).toBeTruthy()
        expect(within(region).getByText('Waiting for processor')).toBeTruthy()

        const progress = within(region).getAllByRole('progressbar', {name: /Operation progress:/})
        expect(progress).toHaveLength(2)
        expect(progress[0].getAttribute('aria-valuenow')).toBe('100')
        expect(progress[0].getAttribute('aria-valuetext')).toBe('100%')
        expect(progress[1].getAttribute('aria-valuenow')).toBeNull()
    })

    it('covers every lifecycle status and lets item status labels override the defaults', () => {
        const statuses: PneOperationCenterStatus[] = [
            'starting',
            'queued',
            'running',
            'finalizing',
            'monitoring-error',
            'succeeded',
            'failed',
            'cancelled',
            'unknown',
        ]

        const {container} = render(
            <PneOperationCenter
                defaultExpanded
                operations={statuses.map(status => operation(status, status, status === 'running'
                    ? {statusLabel: 'Processing in Paynet'}
                    : {}))}
            />,
        )

        statuses.forEach(status => {
            expect(container.querySelector(`[data-pne-operation-status="${status}"]`)).not.toBeNull()
        })
        expect(screen.getByText('Processing in Paynet')).toBeTruthy()
        expect(screen.queryByText('Running')).toBeNull()
    })

    it('routes action ids and exposes dismiss controls only for terminal operations', () => {
        const onAction = jest.fn()
        const onDismiss = jest.fn()
        const onClearTerminal = jest.fn()

        render(
            <PneOperationCenter
                defaultExpanded
                onAction={onAction}
                onClearTerminal={onClearTerminal}
                onDismiss={onDismiss}
                operations={[
                    operation('running', 'running', {
                        actions: [{id: 'cancel', label: 'Cancel request'}],
                    }),
                    operation('monitoring', 'monitoring-error'),
                    operation('success', 'succeeded', {
                        actions: [{id: 'download', label: 'Download'}],
                    }),
                    operation('unknown', 'unknown'),
                    operation('protected', 'failed', {dismissible: false}),
                ]}
            />,
        )

        fireEvent.click(screen.getByRole('button', {name: /Cancel request: Operation running/}))
        fireEvent.click(screen.getByRole('button', {name: /Download: Operation success/}))
        expect(onAction).toHaveBeenNthCalledWith(1, 'running', 'cancel')
        expect(onAction).toHaveBeenNthCalledWith(2, 'success', 'download')

        expect(screen.queryByRole('button', {name: 'Dismiss: Operation running'})).toBeNull()
        expect(screen.queryByRole('button', {name: 'Dismiss: Operation monitoring'})).toBeNull()
        expect(screen.queryByRole('button', {name: 'Dismiss: Operation protected'})).toBeNull()
        fireEvent.click(screen.getByRole('button', {name: /Dismiss: Operation success/}))
        fireEvent.click(screen.getByRole('button', {name: /Dismiss: Operation unknown/}))
        expect(onDismiss).toHaveBeenNthCalledWith(1, 'success')
        expect(onDismiss).toHaveBeenNthCalledWith(2, 'unknown')

        fireEvent.click(screen.getByRole('button', {name: 'Clear finished'}))
        expect(onClearTerminal).toHaveBeenCalledWith(['success', 'unknown'])
    })

    it('gives repeated operation commands distinct contextual accessible names', () => {
        render(
            <PneOperationCenter
                defaultExpanded
                onAction={jest.fn()}
                operations={[
                    operation('first', 'failed', {
                        actions: [{id: 'retry', label: 'Retry'}],
                        context: 'Order #1',
                        title: 'Generate report',
                    }),
                    operation('second', 'failed', {
                        actions: [{id: 'retry', label: 'Retry'}],
                        context: 'Order #2',
                        title: 'Generate report',
                    }),
                ]}
            />,
        )

        expect(screen.getByRole('button', {
            name: 'Retry: Generate report, Order #1, 1 of 2',
        })).toBeTruthy()
        expect(screen.getByRole('button', {
            name: 'Retry: Generate report, Order #2, 2 of 2',
        })).toBeTruthy()
    })

    it('uses an explicit accessible label for ReactNode action content', () => {
        render(
            <PneOperationCenter
                defaultExpanded
                onAction={jest.fn()}
                operations={[
                    operation('first', 'failed', {
                        actions: [{
                            accessibleLabel: 'Retry',
                            id: 'retry',
                            label: <span aria-hidden='true'>Retry icon and text</span>,
                        }],
                        context: 'Order #1',
                        title: 'Generate report',
                    }),
                    operation('second', 'failed', {
                        actions: [{
                            accessibleLabel: 'Retry',
                            id: 'retry',
                            label: <span aria-hidden='true'>Retry icon and text</span>,
                        }],
                        context: 'Order #2',
                        title: 'Generate report',
                    }),
                ]}
            />,
        )

        expect(screen.getByRole('button', {
            name: 'Retry: Generate report, Order #1, 1 of 2',
        })).toBeTruthy()
        expect(screen.getByRole('button', {
            name: 'Retry: Generate report, Order #2, 2 of 2',
        })).toBeTruthy()
    })

    it('supports controlled expansion and returns focus to the trigger on Escape', () => {
        const onExpandedChange = jest.fn()
        const operations = [operation('report', 'running')]
        const view = render(
            <PneOperationCenter
                expanded={false}
                onExpandedChange={onExpandedChange}
                operations={operations}
            />,
        )

        const trigger = screen.getByRole('button', {name: 'Show background operations'})
        fireEvent.click(trigger)
        expect(onExpandedChange).toHaveBeenLastCalledWith(true)
        expect(screen.queryByRole('region')).toBeNull()

        view.rerender(
            <PneOperationCenter
                expanded
                onExpandedChange={onExpandedChange}
                operations={operations}
            />,
        )

        const region = screen.getByRole('region', {name: 'Background operations'})
        fireEvent.keyDown(region, {key: 'Escape'})
        expect(onExpandedChange).toHaveBeenLastCalledWith(false)
        expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Hide background operations'}))
    })

    it.each([
        ['clear', 'Clear finished'],
        ['dismiss', 'Dismiss: Operation done'],
    ])('restores external focus when %s removes the final operation', async (_command, buttonName) => {
        const ControlledCenter = () => {
            const [operations, setOperations] = React.useState([operation('done', 'succeeded')])

            return (
                <>
                    <button type='button'>Before operation center</button>
                    <PneOperationCenter
                        defaultExpanded
                        onClearTerminal={() => setOperations([])}
                        onDismiss={() => setOperations([])}
                        operations={operations}
                    />
                </>
            )
        }

        render(<ControlledCenter/>)

        const fallback = screen.getByRole('button', {name: 'Before operation center'})
        const command = screen.getByRole('button', {name: buttonName})
        fallback.focus()
        command.focus()
        fireEvent.click(command)
        await Promise.resolve()

        expect(screen.queryByRole('button', {name: buttonName})).toBeNull()
        expect(document.activeElement).toBe(fallback)
    })

    it('announces status transitions without announcing progress-only updates', () => {
        const initial = operation('report', 'running', {
            progress: {kind: 'determinate', value: 20},
        })
        const view = render(<PneOperationCenter operations={[initial]}/>)
        const liveRegion = screen.getByRole('status')

        expect(liveRegion.textContent).toBe('')

        view.rerender(
            <PneOperationCenter
                operations={[{
                    ...initial,
                    status: 'finalizing',
                    progress: {kind: 'determinate', value: 90},
                }]}
            />,
        )
        expect(liveRegion.textContent).toBe('Operation report: Finalizing')

        view.rerender(
            <PneOperationCenter
                operations={[{
                    ...initial,
                    status: 'finalizing',
                    progress: {kind: 'determinate', value: 95},
                }]}
            />,
        )
        expect(liveRegion.textContent).toBe('Operation report: Finalizing')
    })

    it('announces operations added after the initially empty state', () => {
        const view = render(<PneOperationCenter operations={[]}/>)

        view.rerender(<PneOperationCenter operations={[operation('report', 'starting')]}/>)

        expect(screen.getByRole('status').textContent).toBe('Operation report: Starting')
    })

    it('announces simultaneous same-title transitions with their operation context', () => {
        const first = operation('first', 'running', {
            context: 'Order #1',
            title: 'Generate report',
        })
        const second = operation('second', 'running', {
            context: 'Order #2',
            title: 'Generate report',
        })
        const view = render(<PneOperationCenter operations={[first, second]}/>)

        view.rerender(<PneOperationCenter
            operations={[
                {...first, status: 'failed'},
                {...second, status: 'failed'},
            ]}
        />)

        expect(screen.getByRole('status').textContent).toBe(
            'Generate report, Order #1, 1 of 2: Failed. Generate report, Order #2, 2 of 2: Failed',
        )
    })
})
