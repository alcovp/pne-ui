import * as React from 'react'
import {render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import PneAsyncAutocomplete from '../src/component/dropdown/PneAsyncAutocomplete'
import {PneAutocomplete, PneThemeProvider, type Skin} from '../src'
import type {AutoCompleteChoice} from '../src/common/paynet/type'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

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
        expect(ruleValue(root, '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator', 'color')).toBe('#2C3136')
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
        expect(ruleValue(root, '& .MuiAutocomplete-tag.MuiChip-root', 'background-color')).toBe('#F7FBFF')
        expect(ruleValue(root, '& .MuiAutocomplete-tag.MuiChip-root', 'box-shadow')).toBe('inset 0 0 0 1px #CED5DC')
    })

    it.each([
        ['small', '16px', '12px', '0 2px 0 4px', '4px', '16px'],
        ['medium', '24px', '14px', '0 4px 0 8px', '4px', '20px'],
        ['large', '32px', '14px', '0 6px 0 10px', '4px', '20px'],
    ] as const)('makes the badges of a %s multiple field %s high, 4px inside the box', (size, height, fontSize, padding, inset, button) => {
        const {container} = inTheme(<PneAutocomplete
            label='Currencies'
            multiple
            options={CURRENCIES}
            size={size}
            value={['USD', 'GBP']}
        />)
        const root = container.querySelector('.MuiAutocomplete-root')!
        const sized = `&&&[data-pne-size="${size}"]`

        expect(root.getAttribute('data-pne-size')).toBe(size)
        expect(root.hasAttribute('data-pne-multiple')).toBe(true)
        expect(container.querySelector('.MuiTextField-root')?.getAttribute('data-pne-size')).toBe(size)
        expect(container.querySelector('.MuiTextField-root')?.hasAttribute('data-pne-filled')).toBe(true)
        expect(ruleValue(root, `${sized} .MuiAutocomplete-tag.MuiChip-root`, 'height')).toBe(height)
        expect(ruleValue(root, `${sized} .MuiAutocomplete-tag.MuiChip-root`, 'font-size')).toBe(fontSize)
        expect(ruleValue(root, `${sized} .MuiAutocomplete-tag.MuiChip-root`, 'padding')).toBe(padding)
        expect(ruleValue(root, `${sized}[data-pne-multiple] .MuiAutocomplete-inputRoot`, 'padding-top')).toBe(inset)
        expect(ruleValue(root, `${sized}[data-pne-multiple] .MuiAutocomplete-inputRoot`, 'gap')).toBe('4px')
        expect(ruleValue(root, `${sized} .MuiAutocomplete-endAdornment .MuiIconButton-root`, 'width')).toBe(button)
    })

    it.each([
        ['small', '4px 0 4px 8px', '4px', '24px', '44px'],
        ['medium', '6px 0 6px 8px', '6px', '34px', '58px'],
        ['large', '10px 0 10px 12px', '10px', '38px', '62px'],
    ] as const)('sets the text and the icon buttons of a %s single field by the UI Kit', (size, padding, right, one, two) => {
        const {container} = inTheme(<PneAutocomplete label='Currency' options={CURRENCIES} size={size} value='EUR'/>)
        const root = container.querySelector('.MuiAutocomplete-root')!
        const sized = `&&&[data-pne-size="${size}"]`
        const box = '.MuiAutocomplete-inputRoot'

        expect(root.hasAttribute('data-pne-multiple')).toBe(false)
        expect(ruleValue(root, `${sized} ${box} .MuiAutocomplete-input`, 'padding')).toBe(padding)
        expect(ruleValue(root, `${sized} .MuiAutocomplete-endAdornment`, 'right')).toBe(right)
        expect(ruleValue(
            root,
            `${sized}.MuiAutocomplete-hasPopupIcon ${box}, ${sized}.MuiAutocomplete-hasClearIcon ${box}`,
            'padding-right',
        )).toBe(one)
        expect(ruleValue(root, `${sized}.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon ${box}`, 'padding-right')).toBe(two)
    })

    it.each([
        ['small', '24px', '12px', '200px', '14px', '20px', '56px'],
        ['medium', '32px', '14px', '264px', '16px', '24px', '72px'],
        ['large', '40px', '14px', '328px', '20px', '28px', '88px'],
    ] as const)('makes the rows of a %s list %s high', (size, height, fontSize, eightRows, checkbox, group, status) => {
        inTheme(<PneAutocomplete label='Currencies' multiple open options={CURRENCIES} size={size} value={['USD']}/>)
        const paper = paperOf()
        const sized = `&[data-pne-size="${size}"]`
        const listbox = `${sized} .MuiAutocomplete-listbox`
        const multi = `${listbox}[aria-multiselectable="true"]:not([data-pne-rows="own"]) .MuiAutocomplete-option`

        expect(paper.getAttribute('data-pne-size')).toBe(size)
        expect(ruleValue(paper, listbox, 'max-height')).toBe(eightRows)
        expect(ruleValue(paper, `${listbox} .MuiAutocomplete-option`, 'min-height')).toBe(height)
        expect(ruleValue(paper, `${listbox} .MuiAutocomplete-option`, 'font-size')).toBe(fontSize)
        expect(ruleValue(paper, `${multi}::before`, 'width')).toBe(checkbox)
        expect(ruleValue(paper, `${sized} .MuiAutocomplete-groupLabel`, 'height')).toBe(group)
        expect(ruleValue(paper, `${sized} .MuiAutocomplete-noOptions, ${sized} .MuiAutocomplete-loading`, 'min-height')).toBe(status)
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
        expect(ruleValue(paper, '&', 'box-shadow')).toMatch(/^inset 0 0 0 1px #E2E9F0, ?0 17px 36px/)
        expect(ruleValue(paper, '& .MuiAutocomplete-listbox', 'padding')).toBe('4px')
        expect(ruleValue(paper, OPTION, 'border-radius')).toBe('4px')
        expect(ruleValue(paper, SINGLE_PICKED, 'background-color')).toBe('#EBF3FF')
        expect(ruleValue(paper, `${SINGLE_PICKED}::after`, 'background-color')).toBe('#026FD7')
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
        expect(ruleValue(paper, MULTI_OWN_PICKED, 'background-color')).toBe('#EBF3FF')
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
        expect(ruleValue(paper, '&[data-pne-status="error"] .MuiAutocomplete-noOptions', 'color')).toBe('#B1182C')
        // A warning sign stands before the text of a failed load.
        expect(ruleValue(paper, '&[data-pne-status="error"] .MuiAutocomplete-noOptions::before', 'background-color')).toBe('currentColor')
    })

    it('shows the spinner in the loading row of the list, not in the field', async () => {
        const {container} = inTheme(<PneAsyncAutocomplete<AutoCompleteChoice>
            defaultOpen
            htmlInputProps={{'aria-label': 'Remote account'}}
            loadOptions={() => new Promise<readonly AutoCompleteChoice[]>(() => undefined)}
            loadingText='Loading'
        />)

        expect(await screen.findAllByText('Loading')).not.toHaveLength(0)
        const paper = paperOf()
        expect(paper.querySelector('.MuiAutocomplete-loading')).not.toBeNull()
        expect(ruleValue(paper, '& .MuiAutocomplete-loading::before', 'border-right-color')).toBe('transparent')
        expect(ruleValue(paper, '& .MuiAutocomplete-loading::before', 'border-radius')).toBe('50%')
        expect(ruleValue(paper, '&[data-pne-size="medium"] .MuiAutocomplete-loading::before, '
            + '&[data-pne-size="medium"][data-pne-status="error"] .MuiAutocomplete-noOptions::before', 'width')).toBe('16px')
        expect(container.querySelector('.MuiCircularProgress-root')).toBeNull()
    })
})
