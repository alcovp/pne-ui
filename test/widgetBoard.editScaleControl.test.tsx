import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { WidgetBoardEditScaleControl } from '../src/component/widget-board/WidgetBoardEditScaleControl'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options: Record<string, unknown> = {}) =>
            String(options.defaultValue ?? key).replace(
                /\{\{(\w+)\}\}/g,
                (_match, name) => String(options[name] ?? ''),
            ),
    }),
}))

describe('WidgetBoardEditScaleControl', () => {
    it('offers the three supported scales and marks 50% as overview', () => {
        const onScaleChange = jest.fn()
        const { container } = render(
            <WidgetBoardEditScaleControl scale={0.75} onScaleChange={onScaleChange} />,
        )

        expect(container.querySelector('[data-pne-widget-board-edit-scale-control="true"]')).toBeTruthy()
        const trigger = screen.getByRole('button', { name: 'Board scale: 75%' })
        expect(trigger.textContent).toContain('75%')

        fireEvent.click(trigger)
        expect(screen.getByRole('menuitem', { name: '100%' })).toBeTruthy()
        expect(screen.getByRole('menuitem', { name: '75%' }).classList).toContain('Mui-selected')

        fireEvent.click(screen.getByRole('menuitem', { name: '50% · Overview' }))
        expect(onScaleChange).toHaveBeenCalledWith(0.5)
        expect(screen.queryByRole('menu')).toBeNull()
    })

    it('can be disabled while keeping the current scale visible', () => {
        render(<WidgetBoardEditScaleControl scale={1} onScaleChange={jest.fn()} disabled />)

        expect((screen.getByRole('button', { name: 'Board scale: 100%' }) as HTMLButtonElement).disabled).toBe(true)
    })
})
