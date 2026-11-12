import * as React from 'react'
import {Table, TableBody, TableHead} from '@mui/material'
import {render, screen} from '@testing-library/react'

import {
    PneHeaderTableCell,
    PneTable,
    PneTableCell,
    PneTableRow,
    PneTableSortLabel,
    PneThemeProvider,
    type Skin,
} from '../src'
import type {TableSortOptions} from '../src/component/table/AbstractTable'

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

const sortOptions = (sortIndex: number, order: 'asc' | 'desc'): TableSortOptions => ({
    sortIndex,
    order,
    setSortIndex: () => undefined,
    setOrder: () => undefined,
    onSortChange: () => undefined,
})

const renderTable = (options = sortOptions(1, 'asc')) => render(<PneThemeProvider skin={UI_KIT_SKIN}>
    <Table>
        <TableHead>
            <PneTableRow>
                <PneHeaderTableCell><PneTableSortLabel sortIndex={0} sortOptions={options}>Date</PneTableSortLabel></PneHeaderTableCell>
                <PneHeaderTableCell><PneTableSortLabel sortIndex={1} sortOptions={options}>ID</PneTableSortLabel></PneHeaderTableCell>
            </PneTableRow>
        </TableHead>
        <TableBody>
            <PneTableRow data-testid='first-row'>
                <PneTableCell>Dec 09</PneTableCell>
                <PneTableCell>9232734</PneTableCell>
            </PneTableRow>
            <PneTableRow data-testid='picked-row' selected>
                <PneTableCell selected>Dec 10</PneTableCell>
                <PneTableCell selected>9232735</PneTableCell>
            </PneTableRow>
        </TableBody>
    </Table>
</PneThemeProvider>)

const style = (element: Element) => window.getComputedStyle(element)

describe('PneTable frame (UI Kit look)', () => {
    it('sets a body cell 14/20 with 12px at the sides, so a one-line row is 40px high with its line', () => {
        renderTable()
        const cell = screen.getByText('Dec 09')

        expect(style(cell).padding).toBe('10px 12px 9px')
        expect(style(cell).fontSize).toBe('14px')
        expect(style(cell).lineHeight).toBe('20px')
        expect(style(cell).color).toBe('rgb(44, 49, 54)')
    })

    it('draws a hairline under each row but the last and fills a row under the pointer', () => {
        renderTable()
        const row = screen.getByTestId('first-row')

        expect(style(row).borderBottomColor.toLowerCase()).toBe('#e2e9f0')
        expect(ruleValue(row, 'tbody > &:last-of-type', 'border-bottom-color')).toBe('transparent')
        expect(ruleValue(row, 'tbody > &:hover', 'background-color')).toBe('#F0F4F8')
    })

    it('leaves a row without the hover fill when the consumer switches it off', () => {
        render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <Table><TableBody><PneTableRow data-testid='plain-row' hover={false}><PneTableCell>x</PneTableCell></PneTableRow></TableBody></Table>
        </PneThemeProvider>)

        expect(ruleValue(screen.getByTestId('plain-row'), 'tbody > &:hover', 'background-color')).toBeUndefined()
    })

    it('fills a picked row and its cells with Brand/100', () => {
        renderTable()
        const row = screen.getByTestId('picked-row')

        expect(ruleValue(row, '&&.Mui-selected, tbody > &&.Mui-selected:hover', 'background-color')).toBe('#EBF3FF')
        expect(style(screen.getByText('Dec 10')).background).toBe('rgb(235, 243, 255)')
    })

    it('sets the header 14/20 SemiBold over a hairline', () => {
        renderTable()
        const header = screen.getByText('Date').closest('th')!

        expect(style(header).fontSize).toBe('14px')
        expect(style(header).lineHeight).toBe('20px')
        expect(style(header).fontWeight).toBe('600')
        expect(style(header).color).toBe('rgb(44, 49, 54)')
        expect(style(header).padding).toBe('10px 12px 9px')
        expect(style(header).borderBottom.toLowerCase()).toBe('1px solid #e2e9f0')
    })

    it('shows both arrows of the sort sign at all times and marks the direction in force', () => {
        renderTable(sortOptions(1, 'desc'))
        const idle = screen.getByText('Date').closest('.MuiTableSortLabel-root')!
        const sorted = screen.getByText('ID').closest('.MuiTableSortLabel-root')!
        const icon = '& .MuiTableSortLabel-icon, &.Mui-active .MuiTableSortLabel-icon'

        expect(idle.querySelector('.PneTableSortLabel-up')).not.toBeNull()
        expect(idle.querySelector('.PneTableSortLabel-down')).not.toBeNull()
        expect(ruleValue(idle, icon, 'opacity')).toBe('1')
        expect(ruleValue(idle, icon, 'transform')).toBe('none')
        expect(ruleValue(idle, icon, 'color')).toBe('#6E747A')
        expect(sorted.classList.contains('Mui-active')).toBe(true)
        expect(sorted.classList.contains('MuiTableSortLabel-directionDesc')).toBe(true)
        expect(ruleValue(
            sorted,
            '&.Mui-active.MuiTableSortLabel-directionAsc .PneTableSortLabel-up, '
                + '&.Mui-active.MuiTableSortLabel-directionDesc .PneTableSortLabel-down',
            'stroke',
        )).toBe('#005EB9')
        expect(ruleValue(
            sorted,
            '&.Mui-active.MuiTableSortLabel-directionAsc .PneTableSortLabel-down, '
                + '&.Mui-active.MuiTableSortLabel-directionDesc .PneTableSortLabel-up',
            'stroke',
        )).toBe('#B2B8BF')
        // The label keeps the colour of the header whether its column is sorted or not.
        expect(ruleValue(sorted, '&.Mui-active', 'color')).toBe('inherit')
    })

    it('fills the page size in force with the brand colour and leaves the others tertiary', () => {
        const {container} = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <PneTable<{id: string}>
                autoTestId='band'
                createRow={row => <tr key={row.id}><td>{row.id}</td></tr>}
                createTableHeader={() => <tr><th>ID</th></tr>}
                data={[{id: '1'}]}
                paginator={{
                    activeActionSx: {},
                    disableActions: false,
                    displayedRowsLabel: '1 - 1',
                    hasNext: false,
                    onPageChange: () => undefined,
                    onPageSizeChange: () => undefined,
                    page: 0,
                    paginationRef: {current: null},
                    rowsPerPage: 25,
                    rowsPerPageOptions: [10, 25, 50],
                }}
            />
        </PneThemeProvider>)
        const sizes = Array.from(container.querySelectorAll<HTMLElement>('[data-autotest="page-size"]')).slice(0, 3)
        const [ten, twentyFive] = sizes.map(button => style(button))

        expect(sizes.map(button => button.textContent)).toEqual(['10', '25', '50'])
        expect(twentyFive.backgroundColor).toBe('rgb(2, 111, 215)')
        expect(twentyFive.color).toBe('rgb(255, 255, 255)')
        expect(ten.backgroundColor).toBe('rgb(240, 244, 248)')
        expect(ten.color).toBe('rgb(86, 91, 97)')
        // The range is a label drawn as the buttons beside it.
        const range = style(container.querySelector('[data-autotest="current-page"]')!)
        expect(range.background).toBe('rgb(240, 244, 248)')
        expect(range.fontWeight).toBe('500')
    })

    it('shows the message of an empty table under a glyph in a round fill, with no other content', () => {
        const {container} = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <PneTable<{id: string}>
                autoTestId='empty'
                createRow={row => <tr key={row.id}><td>{row.id}</td></tr>}
                createTableHeader={() => <tr><th>ID</th></tr>}
                data={[]}
                noRowsMessage='Nothing is found.'
            />
        </PneThemeProvider>)
        const row = container.querySelector<HTMLElement>('[data-autotest="empty-state"]')!
        const cell = row.querySelector('td')!
        const sign = cell.querySelector<HTMLElement>('span[aria-hidden="true"]')!

        expect(cell.textContent).toBe('Nothing is found.')
        expect(style(cell).padding).toBe('32px 24px')
        expect(style(sign).width).toBe('48px')
        expect(style(sign).height).toBe('48px')
        expect(style(sign).borderRadius).toBe('50%')
        expect(style(sign).backgroundColor).toBe('rgb(240, 244, 248)')
        expect(sign.querySelector('svg')).not.toBeNull()
        expect(style(sign.parentElement!).fontWeight).toBe('500')
        expect(style(sign.parentElement!).textAlign).toBe('center')
        expect(cell.querySelectorAll('button, a')).toHaveLength(0)
    })
})
