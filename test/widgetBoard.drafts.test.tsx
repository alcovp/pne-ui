import React, { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WidgetBoard } from '../src/component/widget-board/WidgetBoard'
import {
    WidgetBoardScopeProvider,
    useWidgetBoardScopeStore,
} from '../src/component/widget-board/WidgetBoardScope'
import type {
    BreakpointLayoutConfig,
    WidgetBoardBreakpoint,
    WidgetBoardLayoutOption,
} from '../src/component/widget-board/types'

jest.mock('react-i18next', () => {
    const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key
    return { useTranslation: () => ({ t }) }
})

const breakpoints: readonly WidgetBoardBreakpoint[] = [
    { id: 'compact', minWidth: 0 },
    { id: 'wide', minWidth: 800 },
]

const layouts: Record<string, BreakpointLayoutConfig> = {
    compact: {
        columns: 1,
        widgetOrder: ['a'],
        widgets: { a: { defaultSize: { columnSpan: 1, rowSpan: 2 } } },
    },
    wide: {
        columns: 2,
        widgetOrder: ['a'],
        widgets: { a: { defaultSize: { columnSpan: 2, rowSpan: 2 } } },
    },
}

const widgets = [{
    id: 'a',
    title: 'Widget A',
    render: () => <span>Widget A content</span>,
}]

const DraftControls = () => {
    const store = useWidgetBoardScopeStore()
    const actionsState = store(state => state.actionsState)
    const canChangeVisibility = store(state => Boolean(state.onSetWidgetVisibility))
    const canAdd = store(state => Boolean(state.onAdd))
    const canDiscard = store(state => Boolean(state.onDiscardLayoutChanges))
    const canFlush = store(state => Boolean(state.onFlushLayoutSave))
    const [actionResult, setActionResult] = useState('')

    return (
        <>
            <button
                disabled={!canChangeVisibility}
                onClick={() => store.getState().onSetWidgetVisibility?.('a', false)}
                type='button'
            >
                Hide A
            </button>
            <button
                disabled={!canChangeVisibility}
                onClick={() => store.getState().onSetWidgetVisibility?.('a', true)}
                type='button'
            >
                Show A
            </button>
            <button
                disabled={!canDiscard}
                onClick={() => {
                    void store.getState().onDiscardLayoutChanges?.().then(
                        () => setActionResult('discarded'),
                        error => setActionResult(`discard-error:${String(error)}`),
                    )
                }}
                type='button'
            >
                Discard
            </button>
            <button
                disabled={!canAdd}
                onClick={() => {
                    void store.getState().onAdd?.('Saved draft').then(
                        id => setActionResult(`added:${id}`),
                        error => setActionResult(`add-error:${error instanceof Error ? error.message : String(error)}`),
                    )
                }}
                type='button'
            >
                Save As
            </button>
            <button
                disabled={!canFlush}
                onClick={() => {
                    void store.getState().onFlushLayoutSave?.().then(
                        () => setActionResult('flushed'),
                        error => setActionResult(`flush-error:${error instanceof Error ? error.message : String(error)}`),
                    )
                }}
                type='button'
            >
                Flush
            </button>
            <button
                onClick={() => {
                    void store.getState().onSelect?.('default').then(
                        () => setActionResult('selected-default'),
                        error => setActionResult(`select-error:${error instanceof Error ? error.message : String(error)}`),
                    )
                }}
                type='button'
            >
                Select Default
            </button>
            <button
                disabled={!canAdd}
                onClick={() => {
                    const addLayout = store.getState().onAdd
                    if (!addLayout) return
                    void (async () => {
                        try {
                            await addLayout('Guarded draft')
                            await store.getState().onSelect?.('target')
                            setActionResult('added-then-target')
                        } catch (error) {
                            setActionResult(`guard-error:${error instanceof Error ? error.message : String(error)}`)
                        }
                    })()
                }}
                type='button'
            >
                Save As then target
            </button>
            <output data-testid='selected-layout'>{actionsState?.selectedLayoutId}</output>
            <output data-testid='locked'>{String(actionsState?.isSelectedLayoutLocked)}</output>
            <output data-testid='dirty'>{String(actionsState?.hasDraftChanges)}</output>
            <output data-testid='dirty-breakpoints'>{actionsState?.dirtyBreakpointIds.join(',')}</output>
            <output data-testid='persistence-status'>{actionsState?.persistenceStatus}</output>
            <output data-testid='persistence-error'>{actionsState?.persistenceError}</output>
            <output data-testid='action-result'>{actionResult}</output>
        </>
    )
}

const renderBoard = ({
    loadLayouts,
    saveLayouts,
}: {
    loadLayouts: () => Promise<{ options: WidgetBoardLayoutOption[]; selectedId?: string } | null>
    saveLayouts: (options: WidgetBoardLayoutOption[], selectedId?: string) => Promise<void>
}) => render(
    <WidgetBoardScopeProvider>
        <DraftControls />
        <WidgetBoard
            autoHeightEnabled={false}
            breakpoints={breakpoints}
            engine='cloudscape'
            layoutByBreakpoint={layouts}
            loadLayouts={loadLayouts}
            saveLayouts={saveLayouts}
            widgets={widgets}
        />
    </WidgetBoardScopeProvider>,
)

describe('WidgetBoard layout drafts and persistence', () => {
    const originalWidth = window.innerWidth

    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500, writable: true })
    })

    afterAll(() => {
        window.innerWidth = originalWidth
    })

    it('keeps dirty default drafts per breakpoint across a band roundtrip and discards them together', async () => {
        renderBoard({
            loadLayouts: async () => ({ options: [], selectedId: 'default' }),
            saveLayouts: async () => undefined,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('locked').textContent).toBe('true'))
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => {
            expect(screen.queryByText('Widget A content')).toBeNull()
            expect(screen.getByTestId('dirty').textContent).toBe('true')
            expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('compact')
        })

        act(() => {
            window.innerWidth = 900
            window.dispatchEvent(new Event('resize'))
        })
        expect(await screen.findByText('Widget A content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('compact,wide'))

        act(() => {
            window.innerWidth = 500
            window.dispatchEvent(new Event('resize'))
        })
        await waitFor(() => expect(screen.queryByText('Widget A content')).toBeNull())

        fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => {
            expect(screen.getByTestId('action-result').textContent).toBe('discarded')
            expect(screen.getByTestId('dirty').textContent).toBe('false')
            expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('')
        })
    })

    it('saves every dirty default band, selects only after success, and returns to a clean Default', async () => {
        let resolveSave: (() => void) | undefined
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockImplementationOnce(() => new Promise<void>(resolve => {
                resolveSave = resolve
            }))
            .mockResolvedValue(undefined)
        renderBoard({
            loadLayouts: async () => ({ options: [], selectedId: 'default' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('compact'))

        act(() => {
            window.innerWidth = 900
            window.dispatchEvent(new Event('resize'))
        })
        expect(await screen.findByText('Widget A content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('compact,wide'))
        fireEvent.click(screen.getByRole('button', { name: 'Save As' }))

        await waitFor(() => expect(saveLayouts).toHaveBeenCalledTimes(1))
        expect(screen.getByTestId('selected-layout').textContent).toBe('default')
        expect(screen.getByTestId('persistence-status').textContent).toBe('saving')

        resolveSave?.()
        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toMatch(/^added:/))
        expect(screen.getByTestId('selected-layout').textContent).not.toBe('default')
        const savedOptions = saveLayouts.mock.calls[0][0]
        const savedDraft = savedOptions[savedOptions.length - 1]
        expect(savedDraft.layoutByBreakpoint.compact.widgets.a.initialState?.isHidden).toBe(true)
        expect(savedDraft.layoutByBreakpoint.wide.widgets.a.initialState?.isHidden).toBe(true)

        fireEvent.click(screen.getByRole('button', { name: 'Select Default' }))
        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('selected-default'))
        expect(screen.getByTestId('dirty').textContent).toBe('false')
        expect(await screen.findByText('Widget A content')).toBeTruthy()

        act(() => {
            window.innerWidth = 500
            window.dispatchEvent(new Event('resize'))
        })
        expect(await screen.findByText('Widget A content')).toBeTruthy()
    })

    it('keeps the dirty default selected and exposes an error when Save As fails', async () => {
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockRejectedValue(new Error('backend unavailable'))
        renderBoard({
            loadLayouts: async () => ({ options: [], selectedId: 'default' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('true'))
        fireEvent.click(screen.getByRole('button', { name: 'Save As' }))

        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('add-error:backend unavailable'))
        expect(screen.getByTestId('selected-layout').textContent).toBe('default')
        expect(screen.getByTestId('dirty').textContent).toBe('true')
        expect(screen.getByTestId('persistence-status').textContent).toBe('error')
        expect(screen.getByTestId('persistence-error').textContent).toBe('backend unavailable')
    })

    it('keeps the created layout when a deferred target switch runs immediately after Save As', async () => {
        const target: WidgetBoardLayoutOption = {
            id: 'target',
            name: 'Target',
            layoutByBreakpoint: layouts,
        }
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockResolvedValue(undefined)
        renderBoard({
            loadLayouts: async () => ({ options: [target], selectedId: 'default' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('true'))
        fireEvent.click(screen.getByRole('button', { name: 'Save As then target' }))

        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('added-then-target'))
        expect(screen.getByTestId('selected-layout').textContent).toBe('target')
        expect(saveLayouts).toHaveBeenCalledTimes(2)
        expect(saveLayouts.mock.calls[1][1]).toBe('target')
        expect(saveLayouts.mock.calls[1][0].some(option => option.name === 'Guarded draft')).toBe(true)
    })

    it('flushes a pending custom autosave and waits for the backend', async () => {
        const custom: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockResolvedValue(undefined)
        renderBoard({
            loadLayouts: async () => ({ options: [custom], selectedId: 'custom' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('selected-layout').textContent).toBe('custom'))
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('persistence-status').textContent).toBe('pending'))
        fireEvent.click(screen.getByRole('button', { name: 'Flush' }))

        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('flushed'))
        expect(saveLayouts).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('persistence-status').textContent).toBe('idle')
        const savedCustom = saveLayouts.mock.calls[0][0].find(option => option.id === 'custom')
        expect(savedCustom?.layoutByBreakpoint.compact.widgets.a.initialState?.isHidden).toBe(true)

        fireEvent.click(screen.getByRole('button', { name: 'Flush' }))
        await act(async () => undefined)
        expect(saveLayouts).toHaveBeenCalledTimes(1)
    })

    it('clears custom dirty state without writing when a pending edit is reverted', async () => {
        const custom: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockResolvedValue(undefined)
        renderBoard({
            loadLayouts: async () => ({ options: [custom], selectedId: 'custom' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('selected-layout').textContent).toBe('custom'))
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('persistence-status').textContent).toBe('pending'))
        fireEvent.click(screen.getByRole('button', { name: 'Show A' }))

        await waitFor(() => {
            expect(screen.getByTestId('persistence-status').textContent).toBe('idle')
            expect(screen.getByTestId('dirty').textContent).toBe('false')
        })
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 400))
        })
        expect(saveLayouts).not.toHaveBeenCalled()
    })

    it('rejects an explicit custom flush and keeps its retryable dirty state', async () => {
        const custom: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockRejectedValue(new Error('write failed'))
        renderBoard({
            loadLayouts: async () => ({ options: [custom], selectedId: 'custom' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('selected-layout').textContent).toBe('custom'))
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('persistence-status').textContent).toBe('pending'))
        fireEvent.click(screen.getByRole('button', { name: 'Flush' }))

        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('flush-error:write failed'))
        expect(screen.getByTestId('persistence-status').textContent).toBe('error')
        expect(screen.getByTestId('persistence-error').textContent).toBe('write failed')
        expect(screen.getByTestId('dirty').textContent).toBe('true')
        expect(screen.getByTestId('dirty-breakpoints').textContent).toBe('compact')
    })

    it('keeps flush pending until an edit made during its in-flight save is corrected', async () => {
        const custom: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        let resolveFirstSave: (() => void) | undefined
        let resolveSecondSave: (() => void) | undefined
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockImplementationOnce(() => new Promise<void>(resolve => {
                resolveFirstSave = resolve
            }))
            .mockImplementationOnce(() => new Promise<void>(resolve => {
                resolveSecondSave = resolve
            }))
        renderBoard({
            loadLayouts: async () => ({ options: [custom], selectedId: 'custom' }),
            saveLayouts,
        })

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('selected-layout').textContent).toBe('custom'))
        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.getByTestId('persistence-status').textContent).toBe('pending'))
        fireEvent.click(screen.getByRole('button', { name: 'Flush' }))
        await waitFor(() => expect(saveLayouts).toHaveBeenCalledTimes(1))

        fireEvent.click(screen.getByRole('button', { name: 'Show A' }))
        expect(await screen.findByText('Widget A content')).toBeTruthy()
        resolveFirstSave?.()

        await waitFor(() => expect(saveLayouts).toHaveBeenCalledTimes(2))
        expect(screen.getByTestId('action-result').textContent).not.toBe('flushed')
        const correctedCustom = saveLayouts.mock.calls[1][0].find(option => option.id === 'custom')
        expect(correctedCustom?.layoutByBreakpoint.compact.widgets.a.initialState?.isHidden).toBe(false)

        resolveSecondSave?.()
        await waitFor(() => expect(screen.getByTestId('action-result').textContent).toBe('flushed'))
        expect(screen.getByTestId('persistence-status').textContent).toBe('idle')
        expect(screen.getByTestId('dirty').textContent).toBe('false')
    })
})
