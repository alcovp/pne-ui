import * as React from 'react'
import {ToggleButton, ToggleButtonGroup} from '@mui/material'
import type {ToggleButtonGroupProps} from '@mui/material'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const Group = (props: ToggleButtonGroupProps) => (
    <ToggleButtonGroup exclusive value='enabled' {...props}>
        <ToggleButton value='disabled'>Disabled</ToggleButton>
        <ToggleButton value='enabled'>Enabled</ToggleButton>
    </ToggleButtonGroup>
)

const renderGroup = (ui: React.ReactElement, mode: 'light' | 'dark' = 'light') => {
    const view = render(<PneThemeProvider mode={mode} skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiToggleButtonGroup-root')!
    return {...view, root}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the checks read the
// element's own rules (those of its css- class). `&` stands for that class; selectors are compared
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

const GROUPED = '&& .MuiToggleButtonGroup-grouped'
const PICKED = `${GROUPED}.Mui-selected`

describe('MUI ToggleButtonGroup under the pne-ui theme', () => {
    it.each([
        {size: undefined, shell: '40px', button: '32px', font: '14px', line: '20px', padding: '6px 12px'},
        {size: 'medium', shell: '40px', button: '32px', font: '14px', line: '20px', padding: '6px 12px'},
        {size: 'large', shell: '40px', button: '32px', font: '14px', line: '20px', padding: '6px 12px'},
        {size: 'small', shell: '32px', button: '24px', font: '12px', line: '16px', padding: '4px 8px'},
    ] as const)('is the UI Kit tabs group of size $size', ({size, shell, button, font, line, padding}) => {
        const {root} = renderGroup(<Group size={size}/>)

        expect(ruleValue(root, '&', 'min-height')).toBe(shell)
        expect(ruleValue(root, '&', 'background-color')).toBe('#F0F4F8')
        expect(ruleValue(root, '&', 'box-shadow')).toBe('inset 0 0 0 1px #E2E9F0')
        expect(ruleValue(root, '&', 'border-radius')).toBe('8px')
        expect(ruleValue(root, '&', 'padding')).toBe('4px')
        expect(ruleValue(root, '&', 'gap')).toBe('4px')
        expect(ruleValue(root, GROUPED, 'height')).toBe(button)
        expect(ruleValue(root, GROUPED, 'font-size')).toBe(font)
        expect(ruleValue(root, GROUPED, 'line-height')).toBe(line)
        expect(ruleValue(root, GROUPED, 'padding')).toBe(padding)
        expect(ruleValue(root, GROUPED, 'text-transform')).toBe('none')
        expect(ruleValue(root, GROUPED, 'font-weight')).toBe('500')
    })

    it('takes MUI\'s borders, joined corners and overlapping margins off the buttons', () => {
        const {root} = renderGroup(<Group/>)

        expect(ruleValue(root, GROUPED, 'border')).toMatch(/^0/)
        expect(ruleValue(root, GROUPED, 'border-radius')).toBe('4px')
        expect(ruleValue(root, GROUPED, 'margin')).toMatch(/^0/)
        // The resting fill is the fill of the shell, so the button does not show on it.
        expect(ruleValue(root, GROUPED, 'background-color')).toBe(ruleValue(root, '&', 'background-color'))
    })

    it('draws the picked button as a white tile with the tab shadow, whatever the colour of the group', () => {
        const plain = renderGroup(<Group/>).root
        const primary = renderGroup(<Group color='primary'/>).root

        for (const root of [plain, primary]) {
            expect(ruleValue(root, PICKED, 'background-color')).toBe('#FFFFFF')
            expect(ruleValue(root, PICKED, 'color')).toBe('#565B61')
            expect(ruleValue(root, PICKED, 'box-shadow')).toMatch(/rgba?\(/)
        }
        expect(screen.getAllByRole('button', {name: 'Enabled'})[0].getAttribute('aria-pressed')).toBe('true')
    })

    it('stretches the buttons of a stacked group', () => {
        const {root} = renderGroup(<Group orientation='vertical'/>)

        expect(ruleValue(root, '&', 'align-items')).toBe('stretch')
    })

    it('is the dark shell on a dark page', () => {
        const {root} = renderGroup(<Group/>, 'dark')

        expect(ruleValue(root, '&', 'background-color')).toBe('#242424')
        expect(ruleValue(root, PICKED, 'background-color')).toBe('#303030')
    })

    it('still switches the value', () => {
        const onChange = jest.fn()
        renderGroup(<Group onChange={(_event, value) => onChange(value)}/>)

        fireEvent.click(screen.getByRole('button', {name: 'Disabled'}))

        expect(onChange).toHaveBeenCalledWith('disabled')
    })

    it('leaves a toggle button that stands alone to MUI', () => {
        const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <ToggleButton value='details'>Details</ToggleButton>
        </PneThemeProvider>)
        const button = view.container.querySelector<HTMLElement>('.MuiToggleButton-root')!

        expect(button.classList.contains('MuiToggleButtonGroup-grouped')).toBe(false)
        expect(ruleValue(button, '&', 'text-transform')).toBe('uppercase')
    })
})
