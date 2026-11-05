import * as React from 'react'
import {render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import PneAsyncAutocomplete from '../src/component/dropdown/PneAsyncAutocomplete'
import {PneAutocomplete, PneThemeProvider, type Skin} from '../src'
import type {AutoCompleteChoice} from '../src/common/paynet/type'

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

const OPTION = '& .MuiAutocomplete-listbox .MuiAutocomplete-option'
const SINGLE_PICKED = '& .MuiAutocomplete-listbox:not([aria-multiselectable="true"]) .MuiAutocomplete-option[aria-selected="true"]'
const MULTI = '& .MuiAutocomplete-listbox[aria-multiselectable="true"]:not([data-pne-rows="own"]) .MuiAutocomplete-option'
const MULTI_OWN_PICKED = '& .MuiAutocomplete-listbox[aria-multiselectable="true"][data-pne-rows="own"] .MuiAutocomplete-option[aria-selected="true"]'

const CURRENCIES = ['USD', 'EUR', 'GBP']

const inTheme = (ui: React.ReactElement) => render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)

const paperOf = () => document.querySelector<HTMLElement>('.MuiAutocomplete-paper')!

describe('PneAutocomplete (UI Kit look)', () => {
    it('draws the UI Kit chevron and clear cross at 14px in the colour of the value', () => {
        const {container} = inTheme(<PneAutocomplete label='Currency' options={CURRENCIES} value='EUR'/>)
        const root = container.querySelector('.MuiAutocomplete-root')!

        expect(root.querySelector('.MuiAutocomplete-popupIndicator [data-testid="PneChevronDownIcon"]')).not.toBeNull()
        expect(root.querySelector('.MuiAutocomplete-clearIndicator [data-testid="PneCloseIcon"]')).not.toBeNull()
        expect(ruleValue(root, '& .MuiAutocomplete-endAdornment .PneAutocomplete-icon', 'font-size')).toBe('14px')
        expect(ruleValue(root, '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator', 'color')).toBe('#41556B')
    })

    it('keeps a popup icon of the consumer', () => {
        const {container} = inTheme(<PneAutocomplete
            label='Currency'
            options={CURRENCIES}
            popupIcon={<span data-testid='ConsumerIcon'/>}
        />)

        expect(container.querySelector('.MuiAutocomplete-popupIndicator [data-testid="ConsumerIcon"]')).not.toBeNull()
    })

    it('draws the picked values of a multiple field as UI Kit badges', () => {
        const {container} = inTheme(<PneAutocomplete label='Currencies' multiple options={CURRENCIES} value={['USD', 'GBP']}/>)
        const root = container.querySelector('.MuiAutocomplete-root')!
        const chip = root.querySelector('.MuiAutocomplete-tag')!

        expect(chip.querySelector('[data-testid="PneCloseIcon"]')).not.toBeNull()
        expect(ruleValue(root, '& .MuiAutocomplete-tag.MuiChip-root', 'border-radius')).toBe('4px')
        expect(ruleValue(root, '& .MuiAutocomplete-tag.MuiChip-root', 'background-color')).toBe('#FFFFFF')
        expect(ruleValue(root, '& .MuiAutocomplete-tag.MuiChip-root', 'box-shadow')).toBe('inset 0 0 0 1px #C9D2D9')
    })

    it('draws the UI Kit dropdown panel and single rows', () => {
        inTheme(<PneAutocomplete
            getOptionDisabled={option => option === 'GBP'}
            label='Currency'
            open
            options={CURRENCIES}
            value='EUR'
        />)
        const paper = paperOf()

        expect(ruleValue(paper, '&', 'border-radius')).toBe('8px')
        expect(ruleValue(paper, '&', 'box-shadow')).toMatch(/^inset 0 0 0 1px #EBEDF0, ?0 17px 36px/)
        expect(ruleValue(paper, '& .MuiAutocomplete-listbox', 'padding')).toBe('4px')
        expect(ruleValue(paper, OPTION, 'border-radius')).toBe('4px')
        expect(ruleValue(paper, SINGLE_PICKED, 'background-color')).toBe('#F2F8FF')
        expect(ruleValue(paper, `${SINGLE_PICKED}::after`, 'background-color')).toBe('#007DFF')
        expect(ruleValue(paper, `${OPTION}[aria-disabled="true"]`, 'opacity')).toBe('1')
        expect(screen.getByRole('option', {name: 'EUR'}).getAttribute('aria-selected')).toBe('true')
    })

    it('draws a checkbox in each row of a multiple list instead of tinting the picked ones', () => {
        inTheme(<PneAutocomplete label='Currencies' multiple open options={CURRENCIES} value={['USD']}/>)
        const paper = paperOf()

        expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true')
        expect(ruleValue(paper, `${MULTI}[aria-selected="true"]`, 'background-color')).toBe('transparent')
        expect(ruleValue(paper, `${MULTI}::before`, 'background-image')).toContain('data:image/svg+xml')
        expect(ruleValue(paper, `${MULTI}[aria-selected="true"]::before`, 'background-image')).toContain('data:image/svg+xml')
    })

    it('tints the picked rows that the consumer renders, which may carry a checkbox of their own', () => {
        inTheme(<PneAutocomplete
            label='Currencies'
            multiple
            open
            options={CURRENCIES}
            renderOption={({key, ...optionProps}, option) => <li key={key} {...optionProps}>{option}</li>}
            value={['USD']}
        />)
        const paper = paperOf()

        expect(screen.getByRole('listbox').getAttribute('data-pne-rows')).toBe('own')
        expect(ruleValue(paper, MULTI_OWN_PICKED, 'background-color')).toBe('#F2F8FF')
    })

    it('lets the consumer paper sx follow the dropdown look', () => {
        inTheme(<PneAutocomplete
            label='Currency'
            open
            options={CURRENCIES}
            slotProps={{paper: {sx: {maxWidth: '300px'}}}}
        />)
        const paper = paperOf()

        expect(ruleValue(paper, '&', 'max-width')).toBe('300px')
        expect(ruleValue(paper, '&', 'border-radius')).toBe('8px')
    })
})

describe('PneAsyncAutocomplete (UI Kit look)', () => {
    it('marks a failed load on the paper, so its row reads as an error', async () => {
        inTheme(<PneAsyncAutocomplete<AutoCompleteChoice>
            defaultOpen
            htmlInputProps={{'aria-label': 'Remote account'}}
            loadOptions={async () => {
                throw new Error('down')
            }}
        />)

        expect(await screen.findAllByText('Unable to load options')).toHaveLength(2)
        const paper = paperOf()
        expect(paper.getAttribute('data-pne-status')).toBe('error')
        expect(ruleValue(paper, '&[data-pne-status="error"] .MuiAutocomplete-noOptions', 'color')).toBe('#C8283B')
    })
})
