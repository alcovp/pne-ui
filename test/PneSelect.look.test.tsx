import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneSelect, PneThemeProvider, type Skin} from '../src'

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

const OUTLINED = '& .MuiOutlinedInput-root.MuiInputBase-root'
const ITEM = '& .MuiMenuItem-root'

const OPTIONS = ['Email', 'SFTP', 'FTP'] as const

// Extra props are untyped here: PneSelect's overloads infer the option type from `options`.
const renderSelect = (props: object = {}) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>
        <PneSelect
            aria-label='Delivery'
            getOptionDisabled={option => option === 'FTP'}
            onChange={() => undefined}
            options={OPTIONS}
            value='SFTP'
            {...props}
        />
    </PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiFormControl-root')!
    return {...view, root}
}

const openMenu = () => {
    fireEvent.mouseDown(screen.getByRole('combobox'), {button: 0})
    return document.querySelector<HTMLElement>('.MuiMenu-root')!
}

describe('PneSelect (UI Kit look)', () => {
    it('draws the field look of PneTextField on the select box', () => {
        const {root} = renderSelect()

        expect(ruleValue(root, OUTLINED, '--pne-field-ring')).toBe('#E2E9F0')
        expect(ruleValue(root, `${OUTLINED} .MuiOutlinedInput-notchedOutline`, 'border-color')).toBe('var(--pne-field-ring)')
        expect(ruleValue(root, `${OUTLINED} .MuiInputBase-input, & .MuiFilledInput-root.MuiInputBase-root .MuiInputBase-input`, 'color'))
            .toBe('#2C3136')
    })

    it('marks a pinned specimen state on the root', () => {
        const {root} = renderSelect({'data-pne-state': 'focus'})

        expect(root.getAttribute('data-pne-state')).toBe('focus')
    })

    it('keeps no room for a label inside a filled box, with a label of its own or without one', () => {
        const bare = renderSelect({variant: 'filled'})
        expect(bare.root.querySelector('.MuiFilledInput-root')?.classList.contains('MuiInputBase-hiddenLabel')).toBe(true)
        bare.unmount()

        const labelled = renderSelect({label: 'Delivery', variant: 'filled'})
        expect(labelled.root.querySelector('.MuiFilledInput-root')?.classList.contains('MuiInputBase-hiddenLabel')).toBe(true)
    })

    it.each([
        ['small', '24px', '5px', '24px'],
        ['medium', '32px', '9px', '34px'],
        ['large', '40px', '13px', '38px'],
    ] as const)('makes the %s box %s high with the chevron in the middle of its icon button', (size, height, right, reserve) => {
        const {root} = renderSelect({size})
        const sized = `&[data-pne-size="${size}"]`

        expect(root.getAttribute('data-pne-size')).toBe(size)
        expect(ruleValue(root, `${sized} .MuiInputBase-root`, 'min-height')).toBe(height)
        expect(ruleValue(root, `${sized} .MuiSelect-icon.PneSelect-chevron`, 'right')).toBe(right)
        expect(ruleValue(root, `${sized} .MuiSelect-select.MuiInputBase-input`, 'padding-right')).toBe(reserve)
    })

    it('is medium unless a size is given and marks a box that holds a value', () => {
        const picked = renderSelect()
        expect(picked.root.getAttribute('data-pne-size')).toBe('medium')
        expect(picked.root.hasAttribute('data-pne-filled')).toBe(true)
        picked.unmount()

        const empty = renderSelect({placeholder: 'Please select', value: null})
        expect(empty.root.hasAttribute('data-pne-filled')).toBe(false)
    })

    it('draws the 14px UI Kit chevron in the colour of the value', () => {
        const {root} = renderSelect()
        const icon = root.querySelector('.MuiSelect-icon')!

        expect(icon.getAttribute('data-testid')).toBe('PneChevronDownIcon')
        expect(icon.classList.contains('PneSelect-chevron')).toBe(true)
        expect(ruleValue(root, '& .MuiSelect-icon.PneSelect-chevron', 'font-size')).toBe('14px')
        expect(ruleValue(root, '& .MuiSelect-icon', 'color')).toBe('#2C3136')
        expect(ruleValue(root, '& .MuiSelect-icon.Mui-disabled', 'color')).toBe('#B2B8BF')
    })

    it('keeps an icon component of the consumer at its own size', () => {
        const Arrow = ({className}: {className?: string}) => <svg className={className} data-testid='ConsumerArrow'/>
        const {root} = renderSelect({IconComponent: Arrow})
        const icon = root.querySelector('.MuiSelect-icon')!

        expect(icon.getAttribute('data-testid')).toBe('ConsumerArrow')
        expect(icon.classList.contains('PneSelect-chevron')).toBe(false)
    })

    it('greys the placeholder as the field placeholder', () => {
        renderSelect({placeholder: 'Please select', value: null})
        const placeholder = screen.getByText('Please select')

        expect(ruleValue(placeholder, '&', 'color')).toBe('#8D9399')
    })

    it('draws the UI Kit dropdown panel', () => {
        renderSelect()
        const menu = openMenu()

        expect(ruleValue(menu, '& .MuiMenu-paper', 'border-radius')).toBe('8px')
        expect(ruleValue(menu, '& .MuiMenu-paper', 'box-shadow')).toMatch(/^inset 0 0 0 1px #E2E9F0, ?0 17px 36px/)
        expect(ruleValue(menu, '& .MuiMenu-paper', 'margin-top')).toBe('4px')
        expect(ruleValue(menu, '& .MuiMenu-list', 'padding')).toBe('4px')
    })

    it.each([
        ['small', '24px', '12px', '4px 8px', '200px'],
        ['medium', '32px', '14px', '6px 8px', '264px'],
        ['large', '40px', '14px', '10px 12px', '328px'],
    ] as const)('makes the rows of a %s select %s high and shows eight of them', (size, height, fontSize, padding, eightRows) => {
        renderSelect({size})
        const menu = openMenu()
        const sized = `&[data-pne-size="${size}"]`

        expect(menu.getAttribute('data-pne-size')).toBe(size)
        expect(ruleValue(menu, `${sized} .MuiMenuItem-root`, 'min-height')).toBe(height)
        expect(ruleValue(menu, `${sized} .MuiMenuItem-root`, 'font-size')).toBe(fontSize)
        expect(ruleValue(menu, `${sized} .MuiMenuItem-root`, 'padding')).toBe(padding)
        expect(ruleValue(menu, `${sized} .MuiMenu-paper`, 'max-height')).toContain(eightRows)
    })

    it('tints the hovered and the picked option, checks the picked one and drops MUI opacity on disabled ones', () => {
        renderSelect()
        const menu = openMenu()

        expect(ruleValue(menu, ITEM, 'border-radius')).toBe('4px')
        expect(ruleValue(
            menu,
            `${ITEM}:hover, ${ITEM}.Mui-focusVisible, ${ITEM}[data-pne-state="hover"]`,
            'background-color',
        )).toBe('#F0F4F8')
        expect(ruleValue(menu, `${ITEM}.Mui-selected`, 'background-color')).toBe('#EBF3FF')
        expect(ruleValue(menu, `${ITEM}.Mui-selected::after`, 'background-color')).toBe('#026FD7')
        expect(ruleValue(menu, `${ITEM}.Mui-disabled`, 'opacity')).toBe('1')
        expect(ruleValue(menu, `${ITEM}.Mui-disabled`, 'color')).toBe('#B2B8BF')
    })

    it('shows the label of the picked option in the field, not the check of its row', () => {
        renderSelect()
        const combobox = screen.getByRole('combobox')
        openMenu()

        expect(combobox.textContent).toBe('SFTP')
        expect(screen.getByRole('option', {name: 'SFTP'}).getAttribute('aria-selected')).toBe('true')
    })

    it('lets the consumer menu sx follow the dropdown look', () => {
        renderSelect({MenuProps: {sx: {'& .MuiMenu-paper': {maxHeight: '200px'}}}})
        const menu = openMenu()

        expect(ruleValue(menu, '& .MuiMenu-paper', 'max-height')).toBe('200px')
        expect(ruleValue(menu, '& .MuiMenu-paper', 'border-radius')).toBe('8px')
    })
})
