import * as React from 'react'
import {FormControlLabel, Radio, RadioGroup} from '@mui/material'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderRadio = (ui: React.ReactElement) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiRadio-root')!
    return {...view, root}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so colour checks read
// the radio's own rules (those of its css- class). `&` stands for that class; selectors are
// compared without whitespace.
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

const INTERACTIVE = '&:not(.Mui-disabled)'
const label = {input: {'aria-label': 'Choice'}}

describe('MUI Radio under the pne-ui theme', () => {
    it.each([
        {size: undefined, box: '20', ring: '8.25'},
        {size: 'medium', box: '20', ring: '8.25'},
        {size: 'small', box: '16', ring: '6.25'},
    ] as const)('draws the UI Kit circle of size $size inside the MUI hit area', ({size, box, ring}) => {
        const {root} = renderRadio(<Radio size={size} slotProps={label}/>)
        const svg = root.querySelector('svg.PneRadio-dot')!

        expect(svg.getAttribute('width')).toBe(box)
        expect(svg.getAttribute('height')).toBe(box)
        expect(svg.classList.contains('PneRadio-off')).toBe(true)
        expect(svg.querySelector('.PneRadio-ring')!.getAttribute('r')).toBe(ring)
        expect(svg.querySelector('.PneRadio-ring')!.getAttribute('stroke-width')).toBe('1.5')
        expect(ruleValue(root, '&', 'padding')).toBe('11px')
        expect(root.querySelector('.MuiTouchRipple-root')).toBeNull()
    })

    it.each([
        {size: 'medium', thick: '5.5', radius: '6.25'},
        {size: 'small', thick: '4.5', radius: '4.75'},
    ] as const)('draws a picked $size circle as a thick ring around the centre', ({size, thick, radius}) => {
        const {root} = renderRadio(<Radio checked readOnly size={size} slotProps={label}/>)
        const svg = root.querySelector('svg.PneRadio-on')!

        expect(svg.querySelector('.PneRadio-thick')!.getAttribute('stroke-width')).toBe(thick)
        expect(svg.querySelector('.PneRadio-thick')!.getAttribute('r')).toBe(radius)
        expect(svg.querySelector('.PneRadio-edge')).not.toBeNull()
    })

    it('takes the colours of the UI Kit checkbox by state', () => {
        const {root} = renderRadio(<Radio slotProps={label}/>)

        expect(ruleValue(root, '&', '--pne-radio-off-ring')).toBe('#B2B8BF')
        expect(ruleValue(root, '&', '--pne-radio-off-fill')).toBe('#F7FBFF')
        expect(ruleValue(root, '&', '--pne-radio-on')).toBe('#026FD7')
        expect(ruleValue(root, '&', '--pne-radio-on-edge')).toBe('currentColor')
        expect(ruleValue(root, '&', '--pne-radio-centre')).toBe('#F7FBFF')
        expect(ruleValue(root, '&', 'color')).toBe('var(--pne-radio-off-ring)')
        expect(ruleValue(root, '&.Mui-checked', 'color')).toBe('var(--pne-radio-on)')
        expect(ruleValue(root, `${INTERACTIVE}:hover`, '--pne-radio-off-ring')).toBe('#026FD7')
        expect(ruleValue(root, `${INTERACTIVE}:hover`, '--pne-radio-on')).toBe('#005EB9')
        expect(ruleValue(root, `${INTERACTIVE}:hover`, 'background-color')).toBe('transparent')
        expect(ruleValue(root, `${INTERACTIVE}:active`, '--pne-radio-off-fill')).toBe('#EBF3FF')
        expect(ruleValue(root, '&[data-pne-state="pressed"]', '--pne-radio-on')).toBe('#004B96')
        expect(ruleValue(root, '&.Mui-disabled', '--pne-radio-off-ring')).toBe('#E2E9F0')
        expect(ruleValue(root, '&.Mui-disabled', '--pne-radio-on')).toBe('#B2B8BF')
        expect(ruleValue(root, '& .PneRadio-ring', 'fill')).toBe('var(--pne-radio-off-fill)')
        expect(ruleValue(root, '& .PneRadio-thick', 'fill')).toBe('var(--pne-radio-centre)')
        expect(ruleValue(root, '& .PneRadio-thick', 'stroke')).toBe('currentColor')
    })

    it('still picks one value of a group', () => {
        const onChange = jest.fn()
        render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <RadioGroup onChange={(_event, value) => onChange(value)} value='black'>
                <FormControlLabel control={<Radio/>} label='Black' value='black'/>
                <FormControlLabel control={<Radio/>} label='White' value='white'/>
            </RadioGroup>
        </PneThemeProvider>)

        expect((screen.getByRole('radio', {name: 'Black'}) as HTMLInputElement).checked).toBe(true)
        expect(document.querySelectorAll('svg.PneRadio-on')).toHaveLength(1)

        fireEvent.click(screen.getByRole('radio', {name: 'White'}))

        expect(onChange).toHaveBeenCalledWith('white')
    })

    it('keeps an icon the page gives', () => {
        const {root} = renderRadio(<Radio icon={<span data-testid='own-icon'/>} slotProps={label}/>)

        expect(screen.getByTestId('own-icon')).not.toBeNull()
        expect(root.querySelector('svg.PneRadio-dot')).toBeNull()
    })
})
