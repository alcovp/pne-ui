import * as React from 'react'
import {render} from '@testing-library/react'

import {PneButton, PneCheckbox, PneSwitch, PneTableSelectionCell, PneTextField, PneThemeProvider, type Skin} from '../src'
import {PneLegacyLook} from '../src/component/legacy/legacyLook'

const UI_KIT_SKIN = {experimentalColor: '#007dff'} as Skin

const renderInTheme = (ui: React.ReactElement) => render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)

// Rules of an element's own css- class; `&` stands for that class (see the PneCheckbox tests).
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

describe('PneLegacyLook (composites keep the 4.x look of the primitives)', () => {
    it('draws the 4.x button: MUI variant and colour classes follow pneStyle again', () => {
        const {getByRole} = renderInTheme(<PneLegacyLook><PneButton pneStyle='error'>Delete</PneButton></PneLegacyLook>)
        const button = getByRole('button', {name: 'Delete'})

        expect(button.className).toContain('MuiButton-outlined')
        expect(button.className).toContain('MuiButton-colorError')
        expect(button.getAttribute('data-pne-variant')).toBeNull()
    })

    it('keeps the plain MUI checkbox with its ripple', () => {
        const {container} = renderInTheme(<PneLegacyLook><PneCheckbox aria-label='Legacy'/></PneLegacyLook>)
        const root = container.querySelector('.MuiCheckbox-root')!

        expect(root.querySelector('.PneCheckbox-box')).toBeNull()
        expect(root.querySelector('[data-testid="CheckBoxOutlineBlankIcon"]')).not.toBeNull()
        expect(ruleValue(root, '&', '--pne-checkbox-off-ring')).toBeUndefined()
    })

    it('keeps the 4.x switch geometry', () => {
        const {container} = renderInTheme(<PneLegacyLook><PneSwitch aria-label='Legacy'/></PneLegacyLook>)
        const root = container.querySelector('.MuiSwitch-root')!

        expect(ruleValue(root, '&', '--pne-switch-track-width')).toBe('34px')
    })

    it('keeps the plain MUI text field', () => {
        const {container} = renderInTheme(<PneLegacyLook><PneTextField label='Legacy'/></PneLegacyLook>)
        const root = container.querySelector('.MuiTextField-root')!

        expect(ruleValue(root, '& .MuiOutlinedInput-root.MuiInputBase-root:not(.MuiAutocomplete-inputRoot)', '--pne-field-ring')).toBeUndefined()
    })

    it('is switched on by the table selection cell', () => {
        const {container} = renderInTheme(<table><tbody><tr>
            <PneTableSelectionCell aria-label='Select row' checked={false} onChange={() => undefined}/>
        </tr></tbody></table>)

        expect(container.querySelector('.PneCheckbox-box')).toBeNull()
        expect(container.querySelector('[data-testid="CheckBoxOutlineBlankIcon"]')).not.toBeNull()
    })

    it('leaves primitives outside composites on the pne-ui 5 look', () => {
        const {container} = renderInTheme(<PneCheckbox aria-label='Plain'/>)

        expect(container.querySelector('.PneCheckbox-box')).not.toBeNull()
    })
})
