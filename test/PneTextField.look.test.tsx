import * as React from 'react'
import {MenuItem} from '@mui/material'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneField, PneTextField, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#007dff'} as Skin

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the look is checked
// on the rules of the element's own css- class. `&` stands for that class; selectors are compared
// without whitespace.
const ruleValue = (element: Element, selector: string, property: string): string | undefined => {
    const wanted = Array.from(element.classList)
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

const OUTLINED_BOX = '.MuiOutlinedInput-root.MuiInputBase-root'
const FILLED_BOX = '.MuiFilledInput-root.MuiInputBase-root'
const OUTLINED = `& ${OUTLINED_BOX}`
const FILLED = `& ${FILLED_BOX}`
const HOVER = ':hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error)'

const renderField = (ui: React.ReactElement) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiTextField-root')!
    return {...view, root}
}

describe('PneTextField (UI Kit look)', () => {
    it('rings the outlined box by state and keeps the MUI geometry', () => {
        const {root} = renderField(<PneTextField label='Name'/>)

        expect(ruleValue(root, OUTLINED, '--pne-field-ring')).toBe('#C9D2D9')
        expect(ruleValue(root, OUTLINED, '--pne-field-fill')).toBe('#FFFFFF')
        expect(ruleValue(root, `${OUTLINED}${HOVER}, &[data-pne-state="hover"] ${OUTLINED_BOX}`, '--pne-field-ring')).toBe('#8F9CAA')
        expect(ruleValue(root, `${OUTLINED}.Mui-focused, &[data-pne-state="focus"] ${OUTLINED_BOX}`, '--pne-field-ring')).toBe('#007DFF')
        expect(ruleValue(root, `${OUTLINED}.Mui-error`, '--pne-field-ring')).toBe('#EC4B5D')
        expect(ruleValue(root, `${OUTLINED}.Mui-disabled`, '--pne-field-ring')).toBe('#EBEDF0')
        expect(ruleValue(root, `${OUTLINED} .MuiOutlinedInput-notchedOutline`, 'border-color')).toBe('var(--pne-field-ring)')
        expect(ruleValue(root, `${OUTLINED} .MuiOutlinedInput-notchedOutline`, 'border-width')).toBe('1px')
        expect(root.querySelector('label')?.textContent).toBe('Name')
    })

    it('draws the Fill variant as a grey box with an inset ring and no underline', () => {
        const {root} = renderField(<PneTextField label='Name' variant='filled'/>)

        expect(ruleValue(root, FILLED, '--pne-field-fill')).toBe('#F5F6F7')
        expect(ruleValue(root, FILLED, '--pne-field-ring')).toBe('#EBEDF0')
        expect(ruleValue(root, FILLED, 'box-shadow')).toBe('inset 0 0 0 1px var(--pne-field-ring)')
        expect(ruleValue(root, FILLED, 'border-radius')).toBe('4px')
        expect(ruleValue(root, `${FILLED}::before, ${FILLED}::after`, 'display')).toBe('none')
        expect(ruleValue(root, `${FILLED}.Mui-focused, &[data-pne-state="focus"] ${FILLED_BOX}`, '--pne-field-fill')).toBe('#EBEDF0')
    })

    it('centres the text of a filled box whose label PneField puts above', () => {
        const bare = renderField(<PneTextField aria-label='Bare' variant='filled'/>)
        expect(bare.root.querySelector('.MuiFilledInput-root')?.classList.contains('MuiInputBase-hiddenLabel')).toBe(true)
        bare.unmount()

        const labelled = renderField(<PneTextField label='Name' variant='filled'/>)
        expect(labelled.root.querySelector('.MuiFilledInput-root')?.classList.contains('MuiInputBase-hiddenLabel')).toBe(false)
    })

    it('colours the value, placeholder and helper text by UI Kit role', () => {
        const {root} = renderField(<PneTextField helperText='Format hint' label='Name'/>)

        expect(ruleValue(root, `${OUTLINED} .MuiInputBase-input, ${FILLED} .MuiInputBase-input`, 'color')).toBe('#41556B')
        expect(ruleValue(root, `${OUTLINED} .MuiInputBase-input::placeholder, ${FILLED} .MuiInputBase-input::placeholder`, 'color')).toBe('#7C8B9B')
        expect(ruleValue(root, '& .MuiFormHelperText-root', 'color')).toBe('#7C8B9B')
        expect(ruleValue(root, '& .MuiFormHelperText-root.Mui-error', 'color')).toBe('#C8283B')
    })

    it('draws the PneSelect chevron and list in select mode', () => {
        const {root} = renderField(<PneTextField label='Server' onChange={() => undefined} select value='a'>
            <MenuItem value='a'>Email</MenuItem>
        </PneTextField>)

        expect(root.querySelector('.MuiSelect-icon')?.getAttribute('data-testid')).toBe('PneChevronDownIcon')
        fireEvent.mouseDown(screen.getByRole('combobox'), {button: 0})
        const menu = document.querySelector<HTMLElement>('.MuiMenu-root')!
        expect(ruleValue(menu, '& .MuiMenu-paper', 'border-radius')).toBe('8px')
    })

    it('keeps the browser list of a native select', () => {
        const {root} = renderField(<PneTextField
            label='Server'
            onChange={() => undefined}
            select
            slotProps={{select: {native: true}}}
            value='a'
        >
            <option value='a'>Email</option>
        </PneTextField>)

        expect(root.querySelector('[data-testid="PneChevronDownIcon"]')).toBeNull()
    })

    it('marks a pinned specimen state on the root', () => {
        const {root} = renderField(<PneTextField data-pne-state='focus' label='Pinned'/>)

        expect(root.getAttribute('data-pne-state')).toBe('focus')
    })
})

describe('PneField (UI Kit look)', () => {
    it('keeps the label colour in error and turns the helper text red', () => {
        const {container} = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <PneField error helperText='Fix it' label='Email'>
                <PneTextField/>
            </PneField>
        </PneThemeProvider>)
        const label = container.querySelector('.MuiFormLabel-root')!
        const helper = container.querySelector('.MuiFormControl-root > .MuiFormHelperText-root')!

        expect(ruleValue(label, '&', 'color')).toBe('#41556B')
        expect(ruleValue(label, '&.Mui-focused, &.Mui-error', 'color')).toBe('#41556B')
        expect(ruleValue(helper, '&.Mui-error', 'color')).toBe('#C8283B')
    })
})
