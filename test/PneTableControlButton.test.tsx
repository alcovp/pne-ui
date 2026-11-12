import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneTableControlButton, PneTableViewSelector, PneThemeProvider, Skin} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        // Interpolates like i18next with the library defaults, so the hints read as in the application.
        t: (_key: string, options?: {defaultValue?: string, view?: string}) =>
            (options?.defaultValue ?? _key).replace('{{view}}', options?.view ?? ''),
    }),
}))

const style = (name: string) => window.getComputedStyle(screen.getByRole('button', {name}))

describe('PneTableControlButton', () => {
    it('is a 24px tertiary button of the UI Kit: a 12/16 Medium label on the sunken fill, without border or shadow', () => {
        render(<PneTableControlButton onClick={jest.fn()}>Select all</PneTableControlButton>)

        const button = screen.getByRole('button', {name: 'Select all'})
        expect(button.tagName).toBe('BUTTON')
        expect(button.getAttribute('type')).toBe('button')
        const {backgroundColor, borderRadius, color, fontSize, fontWeight, height, lineHeight, padding, textTransform} = style('Select all')
        expect({backgroundColor, borderRadius, color, fontSize, fontWeight, height, lineHeight, padding, textTransform}).toEqual({
            backgroundColor: 'rgb(240, 244, 248)',
            borderRadius: '4px',
            color: 'rgb(86, 91, 97)',
            fontSize: '12px',
            fontWeight: '500',
            height: '24px',
            lineHeight: '16px',
            padding: '4px 8px',
            textTransform: 'none',
        })
        expect(style('Select all').boxShadow).toBe('')
        expect(style('Select all').borderTopWidth).toBe('0px')
        expect(button.querySelector('svg')).toBeNull()
    })

    it('draws a menu trigger with a 14px chevron and the colour of a value for the main action', () => {
        render(<PneTableControlButton aria-haspopup='menu' emphasis='strong' menu>Actions</PneTableControlButton>)

        const chevron = screen.getByRole('button', {name: 'Actions'}).querySelector('svg') as SVGElement
        expect(window.getComputedStyle(chevron).fontSize).toBe('14px')
        expect(style('Actions').color).toBe('rgb(44, 49, 54)')
        expect(style('Actions').paddingRight).toBe('6px')
    })

    it('fades the label of a disabled button whatever its emphasis', () => {
        render(<PneTableControlButton disabled emphasis='strong' menu>Actions</PneTableControlButton>)

        expect((screen.getByRole('button', {name: 'Actions'}) as HTMLButtonElement).disabled).toBe(true)
        expect(style('Actions').color).toBe('rgb(178, 184, 191)')
    })

    it('rests in the neutral colours whatever the skin and matches the views of the band', () => {
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
        expect(button.color).toBe('rgb(86, 91, 97)')
        expect(button.backgroundColor).toBe('rgb(240, 244, 248)')
    })

    it('explains itself on hover, keeping its label as its name', async () => {
        render(<PneTableControlButton tooltip='Select all rows found by the filters'>Select all</PneTableControlButton>)

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Select all'}))

        expect((await screen.findByRole('tooltip')).textContent).toBe('Select all rows found by the filters')
        expect(screen.getByRole('button', {name: 'Select all'})).not.toBeNull()
    })

    it('explains itself when disabled too', async () => {
        render(<PneTableControlButton disabled menu tooltip='Select rows to run an operation on them'>
            Actions
        </PneTableControlButton>)

        // A disabled button ignores the pointer; its wrapper hears it.
        fireEvent.mouseOver(screen.getByRole('button', {name: 'Actions'}).parentElement as HTMLElement)

        expect((await screen.findByRole('tooltip')).textContent).toBe('Select rows to run an operation on them')
    })
})

describe('PneTableViewSelector hints', () => {
    const renderViews = () => render(<PneTableViewSelector
        aria-label='Views'
        onChange={jest.fn()}
        value='brief'
        views={[
            {id: 'brief', label: 'Brief'},
            {id: 'full', label: 'Full'},
            {id: 'detailed', label: 'Detailed (0)', disabled: true},
        ]}
    />)

    it('offers to switch to another view', async () => {
        renderViews()

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Full'}))

        expect((await screen.findByRole('tooltip')).textContent).toBe('Switch to Full')
    })

    it('names a view without the count its label carries', async () => {
        render(<PneTableViewSelector
            aria-label='Views'
            onChange={jest.fn()}
            value='brief'
            views={[
                {id: 'brief', label: 'Brief'},
                {id: 'detailed', label: 'Detailed (2)', name: 'Detailed'},
            ]}
        />)

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Detailed (2)'}))

        expect((await screen.findByRole('tooltip')).textContent).toBe('Switch to Detailed')
    })

    it('marks the chosen view as the current one', async () => {
        renderViews()

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Brief'}))

        expect((await screen.findByRole('tooltip')).textContent).toBe('Brief — current view')
        expect(screen.getByRole('button', {name: 'Brief'}).getAttribute('aria-pressed')).toBe('true')
    })

    it('gives a disabled view no hint', async () => {
        renderViews()

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Detailed (0)'}).parentElement as HTMLElement)
        fireEvent.mouseOver(screen.getByRole('button', {name: 'Detailed (0)'}))

        await new Promise(resolve => setTimeout(resolve, 400))
        expect(screen.queryByRole('tooltip')).toBeNull()
    })
})
