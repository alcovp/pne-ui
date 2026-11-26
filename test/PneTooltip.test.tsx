import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react'

import {PneTooltip} from '../src'

let tooltipRenders = 0
jest.mock('@mui/material/Tooltip', () => {
    const actual = jest.requireActual('@mui/material/Tooltip')
    const ReactModule = jest.requireActual('react')
    const Counted = ({ref, ...props}: Record<string, unknown> & {ref?: unknown}) => {
        tooltipRenders += 1
        return ReactModule.createElement(actual.default, {...props, ref})
    }
    return {__esModule: true, ...actual, default: Counted}
})

describe('PneTooltip', () => {
    beforeEach(() => {
        tooltipRenders = 0
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('mounts no Tooltip until the pointer comes, and gives the child what the closed Tooltip gives it', () => {
        render(
            <PneTooltip title='Edit gate' data-autotest='edit' className='outer'>
                <button type='button' className='inner'>
                    E
                </button>
            </PneTooltip>,
        )

        const button = screen.getByRole('button', {name: 'Edit gate'})
        expect(tooltipRenders).toBe(0)
        expect(button.getAttribute('data-autotest')).toBe('edit')
        expect(button.className).toBe('outer inner')
    })

    it('opens after its delay on the first hover, as a mounted Tooltip does', () => {
        render(
            <PneTooltip title='Edit gate' enterDelay={100}>
                <button type='button'>E</button>
            </PneTooltip>,
        )

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Edit gate'}))
        expect(tooltipRenders).toBeGreaterThan(0)
        expect(screen.queryByRole('tooltip')).toBeNull()

        act(() => {
            jest.advanceTimersByTime(150)
        })
        expect(screen.getByRole('tooltip').textContent).toBe('Edit gate')
    })

    it('keeps the focus on the element that armed it', () => {
        render(
            <PneTooltip title='Edit gate'>
                <button type='button'>E</button>
            </PneTooltip>,
        )

        act(() => {
            screen.getByRole('button', {name: 'Edit gate'}).focus()
        })
        expect(tooltipRenders).toBeGreaterThan(0)
        expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Edit gate'}))
    })

    it('keeps the child its own handlers and its ref', () => {
        const onMouseOver = jest.fn()
        const ref = React.createRef<HTMLButtonElement>()
        render(
            <PneTooltip title='Edit gate'>
                <button type='button' ref={ref} onMouseOver={onMouseOver}>
                    E
                </button>
            </PneTooltip>,
        )

        expect(ref.current?.tagName).toBe('BUTTON')
        fireEvent.mouseOver(screen.getByRole('button', {name: 'Edit gate'}))
        expect(onMouseOver).toHaveBeenCalled()
        // Drawn anew inside the Tooltip, the element is the one the ref holds.
        expect(ref.current).toBe(screen.getByRole('button', {name: 'Edit gate'}))
    })

    it('mounts a controlled Tooltip at once', () => {
        render(
            <PneTooltip title='Saved' open>
                <span>Status</span>
            </PneTooltip>,
        )

        expect(tooltipRenders).toBeGreaterThan(0)
        expect(screen.getByRole('tooltip').textContent).toBe('Saved')
    })
})
