import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {PneTableControlButton, PneTableViewSelector, PneThemeProvider, Skin} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

const style = (name: string) => window.getComputedStyle(screen.getByRole('button', {name}))

describe('PneTableControlButton', () => {
    it('is a 32px grey text button without border or shadow, like a view', () => {
        render(<PneTableControlButton onClick={jest.fn()}>Select all</PneTableControlButton>)

        const button = screen.getByRole('button', {name: 'Select all'})
        expect(button.tagName).toBe('BUTTON')
        expect(button.getAttribute('type')).toBe('button')
        const {borderRadius, color, fontWeight, height, padding, textTransform} = style('Select all')
        expect({borderRadius, color, fontWeight, height, padding, textTransform}).toEqual({
            borderRadius: '4px',
            color: 'rgb(138, 138, 138)',
            fontWeight: '700',
            height: '32px',
            padding: '0px 10px',
            textTransform: 'none',
        })
        expect(style('Select all').boxShadow).toBe('')
        expect(style('Select all').borderTopWidth).toBe('0px')
        expect(button.querySelector('svg')).toBeNull()
    })

    it('draws a menu trigger with a 16px chevron and the darker grey for the main action', () => {
        render(<PneTableControlButton aria-haspopup='menu' emphasis='strong' menu>Actions</PneTableControlButton>)

        const chevron = screen.getByRole('button', {name: 'Actions'}).querySelector('svg') as SVGElement
        expect(window.getComputedStyle(chevron).fontSize).toBe('16px')
        expect(style('Actions').color).toBe('rgb(92, 92, 92)')
        expect(style('Actions').paddingRight).toBe('6px')
    })

    it('fades a disabled button to the light grey whatever its emphasis', () => {
        render(<PneTableControlButton disabled emphasis='strong' menu>Actions</PneTableControlButton>)

        expect((screen.getByRole('button', {name: 'Actions'}) as HTMLButtonElement).disabled).toBe(true)
        expect(style('Actions').color).toBe('rgb(196, 196, 196)')
    })

    it('ignores the skin colours and matches the views of the band', () => {
        render(<PneThemeProvider skin={{experimentalColor: '#c62828'} as Skin}>
            <PneTableControlButton>Clear</PneTableControlButton>
            <PneTableViewSelector
                aria-label='Views'
                onChange={jest.fn()}
                value='brief'
                views={[{id: 'brief', label: 'Brief'}, {id: 'full', label: 'Full'}]}
            />
        </PneThemeProvider>)

        const button = style('Clear')
        const view = style('Full')
        for (const property of ['color', 'fontWeight', 'height', 'letterSpacing', 'lineHeight', 'padding', 'borderRadius'] as const) {
            expect(button[property]).toBe(view[property])
        }
        expect(button.color).toBe('rgb(138, 138, 138)')
        expect(button.backgroundColor).not.toBe('rgb(198, 40, 40)')
    })
})
