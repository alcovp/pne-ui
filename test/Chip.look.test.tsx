import * as React from 'react'
import {Autocomplete, Chip, TextField} from '@mui/material'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneAutocomplete, PneThemeProvider, type Skin} from '../src'
import {PNE_CHIP_REMOVE_CLASS} from '../src/chipLook'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderChip = (ui: React.ReactElement, mode: 'light' | 'dark' = 'light') => {
    const view = render(
        <PneThemeProvider mode={mode} skin={UI_KIT_SKIN}>
            {ui}
        </PneThemeProvider>,
    )
    const root = view.container.querySelector<HTMLElement>('.MuiChip-root')!
    return {...view, root}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the checks read the
// chip's own rules (those of its css- class). `&` stands for that class; selectors are compared
// without whitespace.
const ruleValue = (root: HTMLElement, selector: string, property: string): string | undefined => {
    const wanted = Array.from(root.classList)
        .filter(className => className.startsWith('css-'))
        .map(className => selector.replace(/&/g, `.${className}`).replace(/\s+/g, ''))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => wanted.includes(rule.selectorText.replace(/\s+/g, '')))
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const REMOVE = `& .MuiChip-deleteIcon.${PNE_CHIP_REMOVE_CLASS}`
const noop = () => undefined

describe('MUI Chip under the pne-ui theme', () => {
    it.each([
        {size: undefined, height: '32px', padding: '10px', gap: '6px', remove: '18px', edge: '0 6px 0 0'},
        {size: 'medium', height: '32px', padding: '10px', gap: '6px', remove: '18px', edge: '0 6px 0 0'},
        {size: 'small', height: '24px', padding: '8px', gap: '4px', remove: '16px', edge: '0 4px 0 0'},
    ] as const)(
        'is the UI Kit badge of size $size: radius 4, 14/20 text',
        ({size, height, padding, gap, remove, edge}) => {
            const {root} = renderChip(<Chip label='Visa' onDelete={noop} size={size} />)

            expect(ruleValue(root, '&', 'height')).toBe(height)
            expect(ruleValue(root, '&', 'border-radius')).toBe('4px')
            expect(ruleValue(root, '&', 'font-size')).toBe('14px')
            expect(ruleValue(root, '&', 'line-height')).toBe('20px')
            expect(ruleValue(root, '&', 'font-weight')).toBe('400')
            expect(ruleValue(root, '& .MuiChip-label', 'padding-left')).toBe(padding)
            expect(ruleValue(root, '& .MuiChip-label', 'padding-right')).toBe(gap)
            expect(ruleValue(root, REMOVE, 'width')).toBe(remove)
            expect(ruleValue(root, REMOVE, 'height')).toBe(remove)
            expect(ruleValue(root, REMOVE, 'margin')).toBe(edge)
        },
    )

    it.each([
        {name: 'filled', props: {}, fill: '#F0F4F8', ring: 'none', text: '#2C3136'},
        {
            name: 'outlined',
            props: {variant: 'outlined'},
            fill: '#F7FBFF',
            ring: 'inset 0 0 0 1px #CED5DC',
            text: '#2C3136',
        },
        {name: 'filled primary', props: {color: 'primary'}, fill: '#026FD7', ring: 'none', text: '#FFFFFF'},
        {name: 'filled success', props: {color: 'success'}, fill: '#DFFBE4', ring: 'none', text: '#017433'},
        {name: 'filled error', props: {color: 'error'}, fill: '#FFEEED', ring: 'none', text: '#B1182C'},
        {name: 'filled warning', props: {color: 'warning'}, fill: '#FEEFE4', ring: 'none', text: '#8E4E01'},
        {
            name: 'outlined error',
            props: {color: 'error', variant: 'outlined'},
            fill: '#F7FBFF',
            ring: 'inset 0 0 0 1px #CC2538',
            text: '#B1182C',
        },
    ] as const)('draws $name as its UI Kit tone', ({props, fill, ring, text}) => {
        const {root} = renderChip(<Chip label='Visa' {...props} />)

        expect(ruleValue(root, '&', 'background-color')).toBe(fill)
        expect(ruleValue(root, '&', 'box-shadow')).toBe(ring)
        expect(ruleValue(root, '&', 'color')).toBe(text)
        expect(ruleValue(root, '&', 'border')).toMatch(/^0/)
    })

    it('answers the pointer only when it can be clicked', () => {
        const {root} = renderChip(<Chip label='Visa' onClick={noop} />)

        expect(root.classList.contains('MuiChip-clickable')).toBe(true)
        expect(ruleValue(root, '&:hover', 'background-color')).toBe('#E2E9F0')
        expect(ruleValue(root, '&.Mui-disabled', 'opacity')).toBe('0.5')

        const plain = renderChip(<Chip label='Plain' />).root

        expect(plain.classList.contains('MuiChip-clickable')).toBe(false)
        expect(ruleValue(plain, '&:hover', 'background-color')).toBeUndefined()
    })

    it('shows the brand ring on a hovered outlined chip', () => {
        const {root} = renderChip(<Chip label='Visa' onClick={noop} variant='outlined' />)

        expect(ruleValue(root, '&:hover', 'box-shadow')).toBe('inset 0 0 0 1px #026FD7')
        expect(ruleValue(root, '&:hover', 'background-color')).toBe('#F7FBFF')
    })

    it('removes with the UI Kit cross and a light square under it on hover', () => {
        const onDelete = jest.fn()
        const {root} = renderChip(<Chip label='Visa' onDelete={onDelete} />)
        const cross = root.querySelector('.MuiChip-deleteIcon')!

        expect(cross.classList.contains(PNE_CHIP_REMOVE_CLASS)).toBe(true)
        expect(cross.getAttribute('data-testid')).toBe('PneCloseIcon')
        expect(ruleValue(root, '& .MuiChip-deleteIcon', 'color')).toBe('#6E747A')
        expect(ruleValue(root, `${REMOVE}:hover`, 'background-color')).toBe('#E2E9F0')
        expect(ruleValue(root, '& .MuiChip-deleteIcon:hover, & .MuiChip-deleteIcon:active', 'color')).toBe('#2C3136')

        fireEvent.click(cross)

        expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('leaves a delete icon the page gives without the geometry of the cross', () => {
        const {root} = renderChip(<Chip deleteIcon={<svg data-testid='own-icon' />} label='Visa' onDelete={noop} />)
        const icon = screen.getByTestId('own-icon')

        expect(icon.classList.contains('MuiChip-deleteIcon')).toBe(true)
        expect(icon.classList.contains(PNE_CHIP_REMOVE_CLASS)).toBe(false)
        expect(root.querySelector(`.${PNE_CHIP_REMOVE_CLASS}`)).toBeNull()
    })

    it('is a dark surface with light text on a dark page', () => {
        const {root} = renderChip(<Chip label='Visa' />, 'dark')

        expect(ruleValue(root, '&', 'background-color')).toBe('#242424')
        expect(ruleValue(root, '&', 'color')).toBe('#F2F2F2')
    })

    it('keeps the value chips of a field of the library as the field draws them', () => {
        const view = render(
            <PneThemeProvider skin={UI_KIT_SKIN}>
                <PneAutocomplete label='Currency' multiple onChange={noop} options={['USD', 'EUR']} value={['USD']} />
            </PneThemeProvider>,
        )
        const tag = view.container.querySelector<HTMLElement>('.MuiAutocomplete-tag.MuiChip-root')!
        const cross = tag.querySelector('.MuiChip-deleteIcon')!

        // The field gives its own cross, so the theme's geometry of the cross does not reach it.
        expect(cross.classList.contains('PneAutocomplete-icon')).toBe(true)
        expect(cross.classList.contains(PNE_CHIP_REMOVE_CLASS)).toBe(false)
    })

    it('draws the tags of a stock Autocomplete too', () => {
        const view = render(
            <PneThemeProvider skin={UI_KIT_SKIN}>
                <Autocomplete
                    multiple
                    onChange={noop}
                    options={['USD', 'EUR']}
                    renderInput={params => <TextField {...params} label='Currency' />}
                    value={['USD']}
                />
            </PneThemeProvider>,
        )
        const tag = view.container.querySelector<HTMLElement>('.MuiAutocomplete-tag.MuiChip-root')!

        expect(ruleValue(tag, '&', 'border-radius')).toBe('4px')
        expect(tag.querySelector(`.${PNE_CHIP_REMOVE_CLASS}`)).not.toBeNull()
    })
})
