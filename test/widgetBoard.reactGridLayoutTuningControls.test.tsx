import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { WidgetBoardReactGridLayoutTuningControls } from '../src/component/widget-board/WidgetBoardReactGridLayoutTuningControls'
import type { WidgetBoardReactGridLayoutTuning } from '../src/component/widget-board/types'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}))

describe('WidgetBoardReactGridLayoutTuningControls', () => {
    it('exposes independent compaction and collision toggles', () => {
        const tuning: WidgetBoardReactGridLayoutTuning = {
            compaction: 'none',
            collisionBehavior: 'push',
        }
        const onTuningChange = jest.fn()

        render(
            <WidgetBoardReactGridLayoutTuningControls
                tuning={tuning}
                onTuningChange={onTuningChange}
            />,
        )

        const compaction = screen.getByRole('button', {
            name: 'Vertical compaction: fill empty space',
        })
        const collision = screen.getByRole('button', {
            name: 'Prevent collisions: block occupied positions',
        })

        expect(compaction.getAttribute('aria-pressed')).toBe('false')
        expect(collision.getAttribute('aria-pressed')).toBe('false')

        fireEvent.click(compaction)
        expect(onTuningChange).toHaveBeenLastCalledWith({
            compaction: 'vertical',
            collisionBehavior: 'push',
        })

        fireEvent.click(collision)
        expect(onTuningChange).toHaveBeenLastCalledWith({
            compaction: 'none',
            collisionBehavior: 'prevent',
        })
    })
})
