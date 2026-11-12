import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {
    PneTableAction,
    PneTableActionsCell,
    PneTableExpandCell,
    PneTableLinkCell,
    PneTableNumberCell,
    PneTableRow,
    PneThemeProvider,
    type Skin,
} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

// jsdom ignores selector specificity in getComputedStyle, so nested rules are read from the rules of
// the element's own css- class. `&` stands for that class; selectors are compared without whitespace.
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

const renderRow = (cells: React.ReactNode, onRowClick?: () => void) => render(<PneThemeProvider skin={UI_KIT_SKIN}>
    <table>
        <tbody>
            <PneTableRow onClick={onRowClick}>{cells}</PneTableRow>
        </tbody>
    </table>
</PneThemeProvider>)

// UI Kit Cell: Numbers, Link, Pseudo link, Actions, Expand and Collapse.
describe('PneTable cell kinds', () => {
    it('sets a number at the right edge in the mono font, on one line', () => {
        const {container} = renderRow(<PneTableNumberCell>767.50 USD</PneTableNumberCell>)
        const cell = container.querySelector('td')!

        expect(cell.getAttribute('data-pne-cell')).toBe('number')
        expect(cell.classList.contains('MuiTableCell-alignRight')).toBe(true)
        expect(ruleValue(cell, '&', 'font-family')).toContain('Roboto Mono')
        expect(ruleValue(cell, '&', 'font-variant-numeric')).toBe('tabular-nums')
        expect(ruleValue(cell, '&', 'white-space')).toBe('nowrap')
    })

    it('gives the link of the consumer the link colour without an underline', () => {
        const {container} = renderRow(<PneTableLinkCell><a href='#order'>9232734</a></PneTableLinkCell>)
        const cell = container.querySelector('td')!

        expect(cell.getAttribute('data-pne-cell')).toBe('link')
        expect(screen.getByRole('link', {name: '9232734'})).toBeTruthy()
        expect(ruleValue(cell, '& a', 'color')).toBe('#005EB9')
        expect(ruleValue(cell, '& a', 'text-decoration')).toBe('none')
        expect(ruleValue(cell, '& a:hover', 'text-decoration')).toBe('underline')
    })

    it('turns the content into an underlined button when the cell acts in place', () => {
        const onAction = jest.fn()
        const onRowClick = jest.fn()
        const {container} = renderRow(
            <PneTableLinkCell actionProps={{'data-autotest': 'merchant-filter'}} onAction={onAction}>
                Contoso
            </PneTableLinkCell>,
            onRowClick,
        )
        const button = screen.getByRole('button', {name: 'Contoso'})

        expect(container.querySelector('td')?.getAttribute('data-pne-cell')).toBe('pseudo-link')
        expect(button.getAttribute('data-autotest')).toBe('merchant-filter')
        expect(ruleValue(button, '&', 'border-bottom')).toBe('1px solid #005EB9')
        expect(ruleValue(button, '&', 'color')).toBe('#005EB9')

        fireEvent.click(button)

        expect(onAction).toHaveBeenCalledTimes(1)
        // The action belongs to the cell: a clickable row does not hear it.
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('stands the actions of a row 4px apart as 24px icon actions', () => {
        const onEdit = jest.fn()
        const onRowClick = jest.fn()
        const {container} = renderRow(
            <PneTableActionsCell>
                <PneTableAction aria-label='Edit' onClick={onEdit}><svg/></PneTableAction>
                <PneTableAction aria-label='Delete' disabled tone='danger'><svg/></PneTableAction>
            </PneTableActionsCell>,
            onRowClick,
        )
        const cell = container.querySelector('td')!
        const edit = screen.getByRole('button', {name: 'Edit'})
        const remove = screen.getByRole('button', {name: 'Delete'})

        expect(cell.getAttribute('data-pne-cell')).toBe('actions')
        expect(ruleValue(cell, '&', 'padding')).toBe('0 12px')
        expect(ruleValue(cell.firstElementChild!, '&', 'gap')).toBe('4px')
        expect(ruleValue(edit, '&', 'width')).toBe('24px')
        expect(ruleValue(edit, '&', 'height')).toBe('24px')
        expect(ruleValue(edit, '& .MuiSvgIcon-root', 'font-size')).toBe('14px')
        expect(edit.getAttribute('data-pne-tone')).toBe('neutral')
        expect(remove.getAttribute('data-pne-tone')).toBe('danger')
        expect(ruleValue(remove, '&:hover', 'color')).toBe('#B1182C')
        expect((remove as HTMLButtonElement).disabled).toBe(true)

        fireEvent.click(edit)

        expect(onEdit).toHaveBeenCalledTimes(1)
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('shows the hint of an action', async () => {
        renderRow(<PneTableActionsCell>
            <PneTableAction aria-label='Edit' tooltip='Edit the record'><svg/></PneTableAction>
        </PneTableActionsCell>)

        fireEvent.mouseOver(screen.getByRole('button', {name: 'Edit'}))

        expect(await screen.findByRole('tooltip')).toBeTruthy()
        expect(screen.getByRole('tooltip').textContent).toBe('Edit the record')
    })

    it('opens and closes a row with the chevron and keeps the click from the row', () => {
        const onToggle = jest.fn()
        const onRowClick = jest.fn()
        const cells = (expanded: boolean) => <PneThemeProvider skin={UI_KIT_SKIN}>
            <table>
                <tbody>
                    <PneTableRow onClick={onRowClick}>
                        <PneTableExpandCell
                            aria-label='Details of 9232734'
                            autoTestValue={9232734}
                            expanded={expanded}
                            onToggle={onToggle}
                        />
                    </PneTableRow>
                </tbody>
            </table>
        </PneThemeProvider>
        const {container, rerender} = render(cells(false))
        const button = screen.getByRole('button', {name: 'Details of 9232734'})

        expect(container.querySelector('td')?.getAttribute('data-pne-cell')).toBe('expand')
        expect(button.getAttribute('aria-expanded')).toBe('false')
        expect(button.getAttribute('data-autotest')).toBe('row-expand')
        expect(button.getAttribute('data-autotest-value')).toBe('9232734')
        expect(ruleValue(button, '&', 'width')).toBe('24px')

        fireEvent.click(button)

        expect(onToggle).toHaveBeenCalledTimes(1)
        expect(onToggle.mock.calls[0][0]).toBe(true)
        expect(onRowClick).not.toHaveBeenCalled()

        rerender(cells(true))
        fireEvent.click(screen.getByRole('button', {name: 'Details of 9232734'}))

        expect(screen.getByRole('button', {name: 'Details of 9232734'}).getAttribute('aria-expanded')).toBe('true')
        expect(onToggle.mock.calls[1][0]).toBe(false)
    })
})
