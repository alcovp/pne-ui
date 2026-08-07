import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
    WidgetBoard,
    WidgetBoardScopeProvider,
    useWidgetBoardScopeStore,
} from '../src/component/widget-board'
import type {
    BreakpointLayoutConfig,
    WidgetBoardBreakpoint,
    WidgetBoardLayoutOption,
} from '../src/component/widget-board/types'

jest.mock('react-i18next', () => {
    const t = (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
    return {
        useTranslation: () => ({ t }),
    }
})

const breakpoints: readonly WidgetBoardBreakpoint[] = [
    { id: 'compact', minWidth: 0 },
    { id: 'wide', minWidth: 800 },
]

const layouts: Record<string, BreakpointLayoutConfig> = {
    compact: {
        columns: 1,
        widgetOrder: ['a'],
        widgets: {
            a: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
        },
    },
    wide: {
        columns: 2,
        widgetOrder: ['a'],
        widgets: {
            a: { defaultSize: { columnSpan: 2, rowSpan: 2 } },
        },
    },
}
const widgets = [
    {
        id: 'a',
        title: 'Widget A',
        render: () => <span>Widget A content</span>,
    },
]

const VisibilityControl = () => {
    const store = useWidgetBoardScopeStore()
    const canHide = store(state => Boolean(state.onSetWidgetVisibility))

    return (
        <button
            disabled={!canHide}
            onClick={() => store.getState().onSetWidgetVisibility?.('a', false)}
            type='button'
        >
            Hide A
        </button>
    )
}

const LayoutControl = () => {
    const store = useWidgetBoardScopeStore()
    const addLayout = store(state => state.onAdd)
    const deleteLayout = store(state => state.onDelete)
    const selectedId = store(state => state.selectedId)

    return (
        <>
            <button disabled={!addLayout} onClick={() => addLayout?.('New layout')} type='button'>
                Add layout
            </button>
            <button
                disabled={!deleteLayout || !selectedId}
                onClick={() => selectedId && deleteLayout?.(selectedId)}
                type='button'
            >
                Delete selected
            </button>
            <span data-testid='selected-layout'>{selectedId}</span>
        </>
    )
}

describe('WidgetBoard custom layout source', () => {
    it('keeps an autosaved active-band edit when switching away and back without changing the inactive band', async () => {
        const originalWidth = window.innerWidth
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500, writable: true })
        const customOption: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        const loadLayouts = jest.fn(async () => ({
            options: [customOption],
            selectedId: 'custom',
        }))
        const saveLayouts = jest.fn(async () => undefined)

        try {
            render(
                <WidgetBoardScopeProvider>
                    <VisibilityControl />
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

            expect(await screen.findByText('Widget A content')).toBeTruthy()
            await waitFor(() =>
                expect(
                    (screen.getByRole('button', { name: 'Hide A' }) as HTMLButtonElement).disabled,
                ).toBe(false),
            )

            fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
            await waitFor(() => expect(screen.queryByText('Widget A content')).toBeNull())

            act(() => {
                window.innerWidth = 900
                window.dispatchEvent(new Event('resize'))
            })
            expect(await screen.findByText('Widget A content')).toBeTruthy()

            act(() => {
                window.innerWidth = 500
                window.dispatchEvent(new Event('resize'))
            })
            await waitFor(() => expect(screen.queryByText('Widget A content')).toBeNull())
            expect(loadLayouts).toHaveBeenCalledTimes(1)
        } finally {
            window.innerWidth = originalWidth
        }
    })

    it('cancels a pending autosave before an explicit layout action and serializes saves', async () => {
        const customOption: WidgetBoardLayoutOption = {
            id: 'custom',
            name: 'Custom',
            layoutByBreakpoint: layouts,
        }
        let resolveFirstSave: (() => void) | undefined
        const saveLayouts = jest
            .fn<Promise<void>, [WidgetBoardLayoutOption[], string | undefined]>()
            .mockImplementationOnce(
                () =>
                    new Promise<void>(resolve => {
                        resolveFirstSave = resolve
                    }),
            )
            .mockResolvedValue(undefined)

        render(
            <WidgetBoardScopeProvider>
                <VisibilityControl />
                <LayoutControl />
                <WidgetBoard
                    autoHeightEnabled={false}
                    breakpoints={breakpoints}
                    engine='cloudscape'
                    layoutByBreakpoint={layouts}
                    loadLayouts={async () => ({
                        options: [customOption],
                        selectedId: 'custom',
                    })}
                    saveLayouts={saveLayouts}
                    widgets={widgets}
                />
            </WidgetBoardScopeProvider>,
        )

        expect(await screen.findByText('Widget A content')).toBeTruthy()
        await waitFor(() =>
            expect(
                (screen.getByRole('button', { name: 'Hide A' }) as HTMLButtonElement).disabled,
            ).toBe(false),
        )

        fireEvent.click(screen.getByRole('button', { name: 'Hide A' }))
        await waitFor(() => expect(screen.queryByText('Widget A content')).toBeNull())
        fireEvent.click(screen.getByRole('button', { name: 'Add layout' }))

        await waitFor(() => expect(saveLayouts).toHaveBeenCalledTimes(1))
        expect(screen.getByTestId('selected-layout').textContent).toBe('custom')

        resolveFirstSave?.()
        await waitFor(() => expect(screen.getByTestId('selected-layout').textContent).not.toBe('custom'))
        fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))

        await waitFor(() => expect(saveLayouts).toHaveBeenCalledTimes(2))
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 400))
        })

        expect(saveLayouts).toHaveBeenCalledTimes(2)
        expect(saveLayouts.mock.calls[0][0]).toHaveLength(3)
        expect(saveLayouts.mock.calls[1][0]).toHaveLength(2)
    })
})
