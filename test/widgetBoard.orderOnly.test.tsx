import React, { useState } from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
    WidgetBoardOrderEditor,
    reorderWidgetBoardItems,
} from '../src/component/widget-board/WidgetBoardOrderEditor'
import { WidgetBoardReactGridLayoutEngine } from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'
import type { WidgetBoardItemData } from '../src/component/widget-board/types'
import type { WidgetBoardVisibilityItem } from '../src/component/widget-board/widgetBoardFabStore'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options: Record<string, unknown> = {}) =>
            String(options.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(options[name] ?? '')),
    }),
}))

type MockDragEnd = (
    result: {
        destination: { index: number } | null
        source: { index: number }
    },
    provided: { announce: (message: string) => void },
) => void

let mockOnDragEnd: MockDragEnd | undefined

jest.mock('@hello-pangea/dnd', () => {
    const ReactModule = jest.requireActual<typeof import('react')>('react')

    return {
        DragDropContext: ({
            children,
            onDragEnd,
        }: React.PropsWithChildren<{ onDragEnd: MockDragEnd }>) => {
            mockOnDragEnd = onDragEnd
            return ReactModule.createElement(ReactModule.Fragment, null, children)
        },
        Droppable: ({
            children,
        }: {
            children: (provided: {
                droppableProps: Record<string, never>
                innerRef: jest.Mock
                placeholder: null
            }) => React.ReactNode
        }) =>
            ReactModule.createElement(
                ReactModule.Fragment,
                null,
                children({
                    droppableProps: {},
                    innerRef: jest.fn(),
                    placeholder: null,
                }),
            ),
        Draggable: ({
            children,
        }: {
            children: (provided: {
                draggableProps: { style: undefined }
                dragHandleProps: Record<string, never>
                innerRef: jest.Mock
            }, snapshot: { isDragging: boolean }) => React.ReactNode
        }) =>
            ReactModule.createElement(
                ReactModule.Fragment,
                null,
                children({
                    draggableProps: { style: undefined },
                    dragHandleProps: {},
                    innerRef: jest.fn(),
                }, {
                    isDragging: false,
                }),
            ),
    }
})

const items: BoardProps.Item<WidgetBoardItemData>[] = [
    {
        id: 'payment',
        columnSpan: 3,
        rowSpan: 7,
        columnOffset: { 6: 1 },
        data: { id: 'payment', title: 'Payment' },
    },
    {
        id: 'status',
        columnSpan: 2,
        rowSpan: 11,
        columnOffset: { 6: 4 },
        data: { id: 'status', title: 'Status' },
    },
    {
        id: 'balance',
        columnSpan: 6,
        rowSpan: 5,
        columnOffset: { 6: 0 },
        data: { id: 'balance', title: 'Balance' },
    },
]

const visibilityItems: WidgetBoardVisibilityItem[] = [
    { id: 'payment', title: 'Payment', visible: true, canHide: true },
    { id: 'status', title: 'Status', visible: false, canHide: true },
    { id: 'balance', title: 'Balance', visible: true, canHide: false },
]

describe('reorderWidgetBoardItems', () => {
    it('returns the same item objects in the requested order without changing geometry', () => {
        const reordered = reorderWidgetBoardItems(items, 0, 2)

        expect(reordered).toEqual([items[1], items[2], items[0]])
        expect(reordered[0]).toBe(items[1])
        expect(reordered[1]).toBe(items[2])
        expect(reordered[2]).toBe(items[0])
        expect(reordered[2]).toMatchObject({
            columnSpan: 3,
            rowSpan: 7,
            columnOffset: { 6: 1 },
        })
    })

    it.each([
        ['the source and destination are equal', 1, 1],
        ['the source is negative', -1, 1],
        ['the source is outside the list', items.length, 1],
        ['the destination is negative', 1, -1],
        ['the destination is outside the list', 1, items.length],
    ])('keeps the original array when %s', (_case, sourceIndex, destinationIndex) => {
        expect(reorderWidgetBoardItems(items, sourceIndex, destinationIndex)).toBe(items)
    })
})

describe('WidgetBoard order-only editor', () => {
    beforeEach(() => {
        mockOnDragEnd = undefined
    })

    it('renders lightweight rows without invoking the widget renderer or mounting widget bodies', () => {
        const renderItem = jest.fn(() => (
            <div data-pne-widget-board-content-body='true'>Expensive widget content</div>
        ))
        const { container } = render(
            <WidgetBoardReactGridLayoutEngine
                boardRootRef={jest.fn()}
                collisionBehavior='push'
                columns={6}
                compaction='none'
                containerPadding={[0, 0]}
                editBehavior='order-only'
                editScale={1}
                interactionMode='edit'
                isLoadingLayouts={false}
                items={[items[0], items[2]]}
                orderEditorItems={items}
                margin={[0, 0]}
                minWidthPxByWidgetId={{}}
                onItemsChange={jest.fn()}
                onOrderChange={jest.fn()}
                onSetWidgetVisibility={jest.fn()}
                renderItem={renderItem}
                rowHeight={16}
                useCSSTransforms
                visibilityItems={visibilityItems}
                empty={null}
            />,
        )

        expect(renderItem).not.toHaveBeenCalled()
        expect(screen.getByRole('list', { name: 'Widget order' })).toBeTruthy()
        expect(screen.getAllByRole('listitem')).toHaveLength(items.length)
        expect(screen.getByText('Payment')).toBeTruthy()
        expect(screen.getByText('Status')).toBeTruthy()
        expect(screen.getByText('Balance')).toBeTruthy()
        expect(screen.getByText('Hidden')).toBeTruthy()
        expect(screen.getByText('Required')).toBeTruthy()
        expect((screen.getByRole('checkbox', { name: 'Show widget Status' }) as HTMLInputElement).checked).toBe(false)
        expect((screen.getByRole('checkbox', { name: 'Show widget Balance' }) as HTMLInputElement).disabled).toBe(true)
        expect(container.querySelector('[data-pne-widget-board-content-body="true"]')).toBeNull()
        expect(container.querySelector('.react-grid-layout')).toBeNull()
        expect(container.querySelector('.react-resizable-handle')).toBeNull()
    })

    it('moves rows immediately with buttons and preserves the original item objects', async () => {
        const onOrderChange = jest.fn()

        const ControlledEditor = () => {
            const [controlledItems, setControlledItems] = useState(items)

            return (
                <WidgetBoardOrderEditor
                    boardRootRef={jest.fn()}
                    isLoadingLayouts={false}
                    items={controlledItems}
                    onOrderChange={ids => {
                        onOrderChange(ids)
                        const byId = new Map(controlledItems.map(item => [item.id as string, item]))
                        setControlledItems(ids.flatMap(id => {
                            const item = byId.get(id)
                            return item ? [item] : []
                        }))
                    }}
                    onSetWidgetVisibility={jest.fn()}
                    visibilityItems={visibilityItems}
                />
            )
        }

        render(<ControlledEditor />)

        const getRowTitles = () =>
            screen
                .getAllByRole('listitem')
                .map(row => within(row).getByRole('heading').textContent)

        expect(getRowTitles()).toEqual(['Payment', 'Status', 'Balance'])
        expect(
            (screen.getByRole('button', { name: 'Move Payment up' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true)
        expect(
            (screen.getByRole('button', { name: 'Move Balance down' }) as HTMLButtonElement)
                .disabled,
        ).toBe(true)

        fireEvent.click(screen.getByRole('button', { name: 'Move Payment down' }))

        await waitFor(() => {
            expect(getRowTitles()).toEqual(['Status', 'Payment', 'Balance'])
        })

        expect(onOrderChange).toHaveBeenCalledWith(['status', 'payment', 'balance'])
    })

    it('commits a drag destination through the same geometry-preserving reorder path', async () => {
        const onOrderChange = jest.fn()
        const announce = jest.fn()

        const ControlledEditor = () => {
            const [controlledItems, setControlledItems] = useState(items)

            return (
                <WidgetBoardOrderEditor
                    boardRootRef={jest.fn()}
                    isLoadingLayouts={false}
                    items={controlledItems}
                    onOrderChange={ids => {
                        onOrderChange(ids)
                        const byId = new Map(controlledItems.map(item => [item.id as string, item]))
                        setControlledItems(ids.flatMap(id => {
                            const item = byId.get(id)
                            return item ? [item] : []
                        }))
                    }}
                    onSetWidgetVisibility={jest.fn()}
                    visibilityItems={visibilityItems}
                />
            )
        }

        render(<ControlledEditor />)

        act(() => {
            mockOnDragEnd?.(
                {
                    source: { index: 0 },
                    destination: null,
                },
                { announce },
            )
        })
        expect(onOrderChange).not.toHaveBeenCalled()

        act(() => {
            mockOnDragEnd?.(
                {
                    source: { index: 0 },
                    destination: { index: 2 },
                },
                { announce },
            )
        })

        await waitFor(() => {
            expect(
                screen
                    .getAllByRole('listitem')
                    .map(row => within(row).getByRole('heading').textContent),
            ).toEqual(['Status', 'Balance', 'Payment'])
        })

        expect(onOrderChange).toHaveBeenCalledWith(['status', 'balance', 'payment'])
        expect(announce).toHaveBeenCalledWith('Payment moved to position 3 of 3')
    })

    it('keeps a hidden row reorderable and toggles its visibility without mounting content', () => {
        const onOrderChange = jest.fn()
        const onSetWidgetVisibility = jest.fn()

        render(
            <WidgetBoardOrderEditor
                boardRootRef={jest.fn()}
                isLoadingLayouts={false}
                items={items}
                onOrderChange={onOrderChange}
                onSetWidgetVisibility={onSetWidgetVisibility}
                visibilityItems={visibilityItems}
            />,
        )

        const hiddenRow = screen.getByText('Status').closest('[role="listitem"]') as HTMLElement
        expect(hiddenRow.getAttribute('data-pne-widget-board-widget-visible')).toBe('false')
        expect(within(hiddenRow).getByText('Hidden')).toBeTruthy()

        fireEvent.click(within(hiddenRow).getByRole('button', { name: 'Move Status down' }))
        expect(onOrderChange).toHaveBeenCalledWith(['payment', 'balance', 'status'])

        fireEvent.click(within(hiddenRow).getByRole('checkbox', { name: 'Show widget Status' }))
        expect(onSetWidgetVisibility).toHaveBeenCalledWith('status', true)
    })
})
