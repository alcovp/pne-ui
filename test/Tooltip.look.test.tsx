import * as React from 'react'
import {Tooltip} from '@mui/material'
import {render, screen} from '@testing-library/react'

import {PneThemeProvider, type Skin} from '../src'
import {PNE_TOOLTIP_GAP} from '../src/tooltipLook'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderTooltip = (ui: React.ReactElement, mode: 'light' | 'dark' = 'light') => {
    render(<PneThemeProvider mode={mode} skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const popper = screen.getByRole('tooltip')
    const body = popper.querySelector<HTMLElement>('.MuiTooltip-tooltip')!
    return {body, popper}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the checks read the
// element's own rules (those of its css- class). `&` stands for that class; selectors are compared
// without whitespace.
const ruleValue = (element: HTMLElement, selector: string, property: string): string | undefined => {
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

const trigger = <button type='button'>Refresh</button>

describe('MUI Tooltip under the pne-ui theme', () => {
    it('is the UI Kit body: dark fill, white 12/16 text, radius 4, padding 4/8, up to 240 wide', () => {
        const {body} = renderTooltip(<Tooltip open title='Refresh the list'>{trigger}</Tooltip>)

        expect(ruleValue(body, '&', 'background-color')).toBe('#2C3136')
        expect(ruleValue(body, '&', 'color')).toBe('#FFFFFF')
        expect(ruleValue(body, '&', 'border-radius')).toBe('4px')
        expect(ruleValue(body, '&', 'padding')).toBe('4px 8px')
        expect(ruleValue(body, '&', 'font-size')).toBe('12px')
        expect(ruleValue(body, '&', 'line-height')).toBe('16px')
        expect(ruleValue(body, '&', 'font-weight')).toBe('400')
        expect(ruleValue(body, '&', 'max-width')).toBe('240px')
    })

    it('has the arrow by default: a 10×6 triangle of the body colour in the 6px to the trigger', () => {
        const {body, popper} = renderTooltip(<Tooltip open title='Refresh the list'>{trigger}</Tooltip>)
        const arrow = popper.querySelector<HTMLElement>('.MuiTooltip-arrow')!

        expect(arrow).not.toBeNull()
        expect(ruleValue(arrow, '&', 'color')).toBe('#2C3136')
        expect(ruleValue(arrow, '&::before', 'transform')).toBe('none')
        expect(ruleValue(popper, '&[data-popper-placement*="bottom"] .MuiTooltip-arrow', 'width')).toBe('10px')
        expect(ruleValue(popper, '&[data-popper-placement*="bottom"] .MuiTooltip-arrow', 'height')).toBe('6px')
        expect(ruleValue(popper, '&[data-popper-placement*="bottom"] .MuiTooltip-arrow', 'margin-top')).toBe('-6px')
        expect(ruleValue(popper, '&[data-popper-placement*="left"] .MuiTooltip-arrow', 'width')).toBe('6px')
        expect(ruleValue(popper, '&[data-popper-placement*="left"] .MuiTooltip-arrow', 'height')).toBe('10px')
        expect(ruleValue(body, '.MuiTooltip-popper[data-popper-placement*="bottom"] &', 'margin-top'))
            .toBe(`${PNE_TOOLTIP_GAP}px`)
        expect(ruleValue(body, '.MuiTooltip-popper[data-popper-placement*="top"] &', 'margin-bottom'))
            .toBe(`${PNE_TOOLTIP_GAP}px`)
    })

    it('drops the arrow on arrow={false} and keeps the gap', () => {
        const {body, popper} = renderTooltip(<Tooltip arrow={false} open title='Refresh the list'>{trigger}</Tooltip>)

        expect(popper.querySelector('.MuiTooltip-arrow')).toBeNull()
        expect(ruleValue(body, '.MuiTooltip-popper[data-popper-placement*="bottom"] &', 'margin-top'))
            .toBe(`${PNE_TOOLTIP_GAP}px`)
    })

    it('is a light body with dark text on a dark page', () => {
        const {body, popper} = renderTooltip(<Tooltip open title='Refresh the list'>{trigger}</Tooltip>, 'dark')

        expect(ruleValue(body, '&', 'background-color')).toBe('#F0F4F8')
        expect(ruleValue(body, '&', 'color')).toBe('#1D2227')
        expect(ruleValue(popper.querySelector<HTMLElement>('.MuiTooltip-arrow')!, '&', 'color')).toBe('#F0F4F8')
    })
})
