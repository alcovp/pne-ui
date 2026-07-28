import React from 'react'
import type { BoardProps } from '@cloudscape-design/board-components/board'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
    WidgetBoardReactGridLayoutEngine,
    WidgetBoardReactGridLayoutItem,
} from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'
import type { WidgetBoardItemData } from '../src/component/widget-board/types'
import type { WidgetDefinitionWithLayout } from '../src/component/widget-board/widgetBoardLayoutUtils'

const item: BoardProps.Item<WidgetBoardItemData> = {
    id: 'payment',
    columnSpan: 1,
    rowSpan: 7,
    data: { id: 'payment', title: 'Payment' },
}

const definition: WidgetDefinitionWithLayout = {
    id: 'payment',
    title: 'Payment',
    render: () => <span>Payment content</span>,
    settingsActions: <button type='button'>Payment settings</button>,
    layout: {
        defaultSize: { columnSpan: 1, rowSpan: 3 },
    },
}

describe('WidgetBoard order-only item', () => {
    it('keeps content mounted but invisible and exposes only reorder controls', () => {
        const onMove = jest.fn()
        const { container } = render(
            <WidgetBoardReactGridLayoutItem
                definition={definition}
                editBehavior='order-only'
                heightMode='auto'
                interactionMode='edit'
                isCollapsed={false}
                item={item}
                itemCount={3}
                onContentRef={jest.fn()}
                onHide={jest.fn()}
                onMove={onMove}
                position={0}
            />,
        )

        expect(screen.getByText('Payment')).toBeTruthy()
        expect(screen.getByText('Payment content')).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Payment settings' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'Remove Payment' })).toBeNull()

        const contentBody = container.querySelector('[data-pne-widget-board-content-body="true"]')
        expect(contentBody?.getAttribute('aria-hidden')).toBe('true')
        expect(contentBody ? getComputedStyle(contentBody).display : null).toBe('none')

        const moveUp = screen.getByRole('button', { name: 'Move Payment up' }) as HTMLButtonElement
        expect(moveUp.disabled).toBe(true)
        fireEvent.click(screen.getByRole('button', { name: 'Move Payment down' }))
        expect(onMove).toHaveBeenCalledWith('payment', 1)
        expect(container.querySelectorAll('.pne-widget-board-rgl-drag-handle')).toHaveLength(1)
    })

    it('renders content and normal widget actions outside order-only edit', () => {
        render(
            <WidgetBoardReactGridLayoutItem
                definition={definition}
                editBehavior='grid'
                heightMode='auto'
                interactionMode='view'
                isCollapsed={false}
                item={item}
                itemCount={1}
                onContentRef={jest.fn()}
                onHide={jest.fn()}
                onMove={jest.fn()}
                position={0}
            />,
        )

        expect(screen.getByRole('button', { name: 'Payment settings' })).toBeTruthy()
        expect(screen.getByText('Payment content').closest('[aria-hidden="true"]')).toBeNull()
    })

    it('renders only horizontal resize handles in grid edit and no handles in order-only edit', async () => {
        const renderEngine = (editBehavior: 'grid' | 'order-only') => (
            <WidgetBoardReactGridLayoutEngine
                boardRootRef={jest.fn()}
                columns={6}
                containerPadding={[0, 0]}
                editBehavior={editBehavior}
                interactionMode='edit'
                isLoadingLayouts={false}
                items={[item]}
                margin={[0, 0]}
                minWidthPxByWidgetId={{}}
                onItemsChange={jest.fn()}
                renderItem={() => <div>Widget row</div>}
                rowHeight={16}
                useCSSTransforms
            />
        )
        const { container, rerender } = render(renderEngine('grid'))

        await waitFor(() => {
            expect(container.querySelector('.react-resizable-handle-e')).not.toBeNull()
            expect(container.querySelector('.react-resizable-handle-w')).not.toBeNull()
        })
        expect(
            container.querySelector(
                [
                    '.react-resizable-handle-n',
                    '.react-resizable-handle-ne',
                    '.react-resizable-handle-nw',
                    '.react-resizable-handle-s',
                    '.react-resizable-handle-se',
                    '.react-resizable-handle-sw',
                ].join(','),
            ),
        ).toBeNull()

        rerender(renderEngine('order-only'))
        await waitFor(() =>
            expect(container.querySelector('.react-resizable-handle')).toBeNull(),
        )
    })
})
