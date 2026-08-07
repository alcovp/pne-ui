import React from 'react'
import { render, screen } from '@testing-library/react'
import { WidgetBoardReactGridLayoutItem } from '../src/component/widget-board/WidgetBoardReactGridLayoutEngine'
import type { WidgetDefinitionWithLayout } from '../src/component/widget-board/widgetBoardLayoutUtils'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options: Record<string, unknown> = {}) =>
            String(options.defaultValue ?? key).replace(
                /\{\{(\w+)\}\}/g,
                (_match, name) => String(options[name] ?? ''),
            ),
    }),
}))

describe('WidgetBoard edit overview', () => {
    it('keeps the drag header active while making widget content and actions inert', () => {
        const definition: WidgetDefinitionWithLayout = {
            id: 'sales',
            title: 'Sales',
            render: () => <button type='button'>Open details</button>,
            settingsActions: <button type='button'>Settings</button>,
            layout: { defaultSize: { columnSpan: 2, rowSpan: 3 } },
        }

        const { container } = render(
            <WidgetBoardReactGridLayoutItem
                item={{ id: 'sales', data: { id: 'sales', title: 'Sales' } }}
                definition={definition}
                heightMode='fixed'
                isCollapsed={false}
                interactionMode='edit'
                isOverview
                onContentRef={jest.fn()}
                onHide={jest.fn()}
            />,
        )

        const body = container.querySelector<HTMLElement>(
            '[data-pne-widget-board-content-body="true"]',
        )
        expect(body?.hasAttribute('inert')).toBe(true)
        expect(body?.getAttribute('data-pne-widget-board-overview')).toBe('true')
        expect(container.querySelector('.pne-widget-board-rgl-drag-handle')).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'Hide widget Sales' })).toBeNull()
    })
})
