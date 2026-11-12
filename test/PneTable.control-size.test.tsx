import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {
    PneTable,
    PneTableColumnSettingsAction,
    PneTableSelectionControls,
    PneTableToolbar,
    type PaginatorProps,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key}),
}))

type Row = {
    id: string
    label: string
}

const paginator: PaginatorProps = {
    rowsPerPageOptions: [10, 25, 50],
    rowsPerPage: 25,
    page: 1,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    hasNext: true,
    disableActions: false,
    displayedRowsLabel: '26 - 50',
    paginationRef: {current: null},
    duplicatePagination: true,
}

const renderTable = (options: {paginator?: PaginatorProps, toolbar?: React.ReactNode}) => render(
    <PneTable<Row>
        autoTestId='sizes'
        data={[{id: '1', label: 'First'}]}
        paginator={options.paginator}
        toolbar={options.toolbar}
        createTableHeader={() => <tr><th>Name</th></tr>}
        createRow={row => <tr key={row.id}><td>{row.label}</td></tr>}
    />,
)

const size = (element: Element) => {
    const style = window.getComputedStyle(element)
    return {height: style.height, width: style.width}
}

describe('PneTable control size', () => {
    it('draws the pagination of both bands as 24px buttons 4px apart in 32px shells', () => {
        const {container} = renderTable({paginator})

        const bands = Array.from(container.querySelectorAll('[data-autotest="pagination"]'))
        expect(bands.map(band => band.getAttribute('data-autotest-value'))).toEqual(['top', 'bottom'])

        for (const band of bands) {
            for (const id of ['first-page', 'prev-page', 'next-page']) {
                expect(size(band.querySelector(`[data-autotest="${id}"]`) as Element))
                    .toEqual({height: '24px', width: '24px'})
            }
            const sizes = Array.from(band.querySelectorAll('[data-autotest="page-size"]'))
            expect(sizes).toHaveLength(3)
            for (const pageSize of sizes) {
                // A page size is as wide as its label, and never narrower than a square.
                expect(window.getComputedStyle(pageSize).height).toBe('24px')
                expect(window.getComputedStyle(pageSize).minWidth).toBe('24px')
            }

            const currentPage = window.getComputedStyle(band.querySelector('[data-autotest="current-page"]') as Element)
            expect(currentPage.height).toBe('24px')
            expect(currentPage.minWidth).toBe('24px')

            // UI Kit Button group: a white shell with a ring, 4px around its controls and between them.
            for (const id of ['page-navigation', 'page-sizes']) {
                const shell = window.getComputedStyle(band.querySelector(`[data-autotest="${id}"]`) as Element)
                expect(shell.gap).toBe('4px')
                expect(shell.padding).toBe('4px')
                expect(shell.minHeight).toBe('32px')
                expect(shell.borderRadius).toBe('8px')
                expect(shell.backgroundColor).toBe('rgb(255, 255, 255)')
            }
            // Groups in one row stand 8px apart; on a narrow screen the rows they wrap onto stand 4px apart.
            expect(window.getComputedStyle(band.querySelector('[data-autotest="pagination-actions"]') as Element).gap)
                .toBe('4px 8px')
        }

        // jsdom resolves rules by source order, not by specificity, so MUI's own 52px toolbar rule, inserted
        // after ours, wins there. Browsers apply the more specific override, so read the override itself.
        const toolbarMinHeights = Array.from(document.styleSheets)
            .flatMap(sheet => Array.from(sheet.cssRules))
            .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
                && rule.selectorText.endsWith('.MuiToolbar-root.MuiTablePagination-toolbar'))
            .map(rule => rule.style.getPropertyValue('min-height'))
        expect(toolbarMinHeights).toContain('32px')
        expect(toolbarMinHeights).not.toContain('40px')
    })

    it('gives a toolbar without pagination a 32px row', () => {
        const {container} = renderTable({toolbar: <button type='button'>View</button>})

        const toolbar = container.querySelector('[data-autotest="table-toolbar"]') as Element
        expect(window.getComputedStyle(toolbar).minHeight).toBe('32px')
    })

    it('wraps the toolbar groups onto rows 4px apart and keeps everything of the selection 4px apart', () => {
        const {container} = renderTable({
            paginator,
            toolbar: <PneTableToolbar
                aria-label='Table controls'
                contextual={<PneTableSelectionControls summary='2 selected' actions={<button type='button'>Clear</button>}/>}
                persistent={<button type='button'>View</button>}
            />,
        })

        expect(window.getComputedStyle(container.querySelector('[data-autotest="table-control-bar"]') as Element).gap)
            .toBe('4px 8px')
        expect(window.getComputedStyle(container.querySelector('[data-autotest="selection-controls"]') as Element).gap)
            .toBe('4px')
    })

    it('draws the column settings icon as a 24px icon action', () => {
        render(<PneTableColumnSettingsAction autoTestId='sizes' onClick={jest.fn()}/>)

        expect(size(screen.getByRole('button', {name: 'Table settings'}))).toEqual({height: '24px', width: '24px'})
    })
})
