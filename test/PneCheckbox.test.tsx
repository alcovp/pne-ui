import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {PneCheckbox, PneField, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderCheckbox = (ui: React.ReactElement) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiCheckbox-root')!
    return {...view, root}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so colour checks read
// the checkbox's own rules (those of its css- class). `&` stands for that class; selectors are
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

const ON = (scope: string) => `${scope}.Mui-checked, ${scope}.MuiCheckbox-indeterminate`
const INTERACTIVE = '&:not(.Mui-disabled):not([data-pne-readonly]):not([data-pne-error])'

describe('PneCheckbox (UI Kit look)', () => {
    it.each([
        {size: 'small', box: '16', square: '12.5'},
        {size: 'medium', box: '20', square: '16.5'},
        {size: 'large', box: '24', square: '20.5'},
    ] as const)('draws the $size UI Kit box inside the MUI hit area', ({size, box, square}) => {
        const {root} = renderCheckbox(<PneCheckbox aria-label='Sized' size={size}/>)
        const svg = root.querySelector('svg.PneCheckbox-box')!
        const rect = svg.querySelector('rect.PneCheckbox-square')!

        expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual([box, box])
        expect([rect.getAttribute('x'), rect.getAttribute('width'), rect.getAttribute('stroke-width')])
            .toEqual(['1.75', square, '1.5'])
        expect(ruleValue(root, '&', 'padding')).toBe('11px')
    })

    it('draws the off box empty, the on box with the check and the mixed one with the bar', () => {
        const off = renderCheckbox(<PneCheckbox aria-label='Off'/>)
        expect(off.root.querySelector('.PneCheckbox-off .PneCheckbox-mark')).toBeNull()
        off.unmount()

        const on = renderCheckbox(<PneCheckbox aria-label='On' defaultChecked/>)
        expect(on.root.querySelector('.PneCheckbox-on .PneCheckbox-mark')?.getAttribute('d')).toBe('M4.2 8.2 L6.6 10.6 L11.8 5.4')
        on.unmount()

        const mixed = renderCheckbox(<PneCheckbox aria-label='Mixed' indeterminate/>)
        expect(mixed.root.querySelector('.PneCheckbox-on .PneCheckbox-mark')?.getAttribute('d')).toBe('M4.75 8 H11.25')
    })

    it('colours the box by UI Kit role through custom properties and the root colour', () => {
        const {root} = renderCheckbox(<PneCheckbox aria-label='Roles'/>)

        expect(ruleValue(root, '&', '--pne-checkbox-off-ring')).toBe('#B2B8BF')
        expect(ruleValue(root, '&', '--pne-checkbox-off-fill')).toBe('#F7FBFF')
        expect(ruleValue(root, '&', '--pne-checkbox-on-fill')).toBe('#026FD7')
        expect(ruleValue(root, '&', '--pne-checkbox-on-ring')).toBe('currentColor')
        expect(ruleValue(root, '&', '--pne-checkbox-mark')).toBe('#F7FBFF')
        expect(ruleValue(root, '&', 'color')).toBe('var(--pne-checkbox-off-ring)')
        expect(ruleValue(root, ON('&'), 'color')).toBe('var(--pne-checkbox-on-fill)')
        expect(ruleValue(root, '& .PneCheckbox-off .PneCheckbox-square', 'stroke')).toBe('currentColor')
        expect(ruleValue(root, '& .PneCheckbox-on .PneCheckbox-square', 'fill')).toBe('currentColor')
        expect(ruleValue(root, '& .PneCheckbox-on .PneCheckbox-mark', 'stroke')).toBe('var(--pne-checkbox-mark)')
    })

    it('has hover, pressed, error, read-only and disabled rules by UI Kit role', () => {
        const {root} = renderCheckbox(<PneCheckbox aria-label='States'/>)

        expect(ruleValue(root, `${INTERACTIVE}:hover`, '--pne-checkbox-off-ring')).toBe('#026FD7')
        expect(ruleValue(root, `${INTERACTIVE}:hover`, '--pne-checkbox-on-fill')).toBe('#005EB9')
        expect(ruleValue(root, `${INTERACTIVE}:active`, '--pne-checkbox-off-fill')).toBe('#EBF3FF')
        expect(ruleValue(root, `${INTERACTIVE}:active`, '--pne-checkbox-off-ring')).toBe('#004B96')
        expect(ruleValue(root, '&[data-pne-state="pressed"]', '--pne-checkbox-on-fill')).toBe('#004B96')
        expect(ruleValue(root, '&[data-pne-error]', '--pne-checkbox-off-ring')).toBe('#CC2538')
        expect(ruleValue(root, '&[data-pne-error]', '--pne-checkbox-on-fill')).toBe('#CC2538')
        expect(ruleValue(root, '&[data-pne-readonly]', '--pne-checkbox-off-ring')).toBe('#E2E9F0')
        expect(ruleValue(root, '&[data-pne-readonly]', '--pne-checkbox-off-fill')).toBe('#F0F4F8')
        expect(ruleValue(root, '&[data-pne-readonly]', '--pne-checkbox-on-fill')).toBe('#8D9399')
        expect(ruleValue(root, '&[data-pne-readonly]', 'cursor')).toBe('default')
        expect(ruleValue(root, '&.Mui-disabled', '--pne-checkbox-off-fill')).toBe('#F0F4F8')
        expect(ruleValue(root, '&.Mui-disabled', '--pne-checkbox-on-fill')).toBe('#B2B8BF')
        expect(ruleValue(root, '&.Mui-disabled', 'color')).toBe('var(--pne-checkbox-off-ring)')
    })

    it('rings the focused box', () => {
        const {root} = renderCheckbox(<PneCheckbox aria-label='Focus'/>)

        expect(ruleValue(root, '&.Mui-focusVisible .PneCheckbox-box, &[data-pne-state="focus"] .PneCheckbox-box', 'box-shadow'))
            .toBe('0 0 0 2px #fff,0 0 0 4px #026FD7')
    })

    it('marks error, read-only and pinned states on the root', () => {
        const invalid = renderCheckbox(<PneCheckbox aria-invalid aria-label='Invalid'/>)
        expect(invalid.root.getAttribute('data-pne-error')).toBe('true')
        invalid.unmount()

        const field = renderCheckbox(<PneField error label='Terms'><PneCheckbox/></PneField>)
        expect(field.root.getAttribute('data-pne-error')).toBe('true')
        field.unmount()

        const readOnly = renderCheckbox(<PneCheckbox aria-label='Read only' readOnly/>)
        expect(readOnly.root.getAttribute('data-pne-readonly')).toBe('true')
        expect(readOnly.root.getAttribute('data-pne-error')).toBeNull()
        readOnly.unmount()

        const pinned = renderCheckbox(<PneCheckbox aria-label='Pinned' data-pne-state='hover'/>)
        expect(pinned.root.getAttribute('data-pne-state')).toBe('hover')
    })

    it('keeps consumer icons and leaves the ripple out unless asked', async () => {
        // MUI mounts the ripple on the first press.
        const custom = renderCheckbox(<PneCheckbox aria-label='Custom' icon={<span data-testid='custom-icon'/>}/>)
        fireEvent.mouseDown(custom.root)
        expect(screen.getByTestId('custom-icon')).toBeTruthy()
        expect(custom.root.querySelector('.PneCheckbox-box')).toBeNull()
        expect(custom.root.querySelector('.MuiTouchRipple-root')).toBeNull()
        custom.unmount()

        const rippled = renderCheckbox(<PneCheckbox aria-label='Ripple' disableRipple={false}/>)
        fireEvent.mouseDown(rippled.root)
        await waitFor(() => expect(rippled.root.querySelector('.MuiTouchRipple-root')).not.toBeNull())
    })
})
