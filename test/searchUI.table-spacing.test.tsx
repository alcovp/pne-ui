import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {SearchUI, type SearchParams} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

type Row = {
    id: string
    label: string
}

const rows: Row[] = [{id: '1', label: 'First'}, {id: '2', label: 'Second'}]

const renderSearchUI = (duplicatePagination: boolean) => render(
    <SearchUI<Row>
        autoTestId={'table-spacing'}
        config={{hideShowFiltersButton: true, hideTemplatesSelect: true}}
        possibleCriteria={[]}
        settingsContextName={'table-spacing-settings'}
        tableParams={{duplicatePagination}}
        searchData={(_params: SearchParams) => Promise.resolve(rows)}
        createTableHeader={() => <tr><th>Header</th></tr>}
        createTableRow={row => <tr key={row.id}><td>{row.label}</td></tr>}
    />,
)

describe('SearchUI table spacing', () => {
    it('sets the table 8px under the filter panel, with no line between them, and the bottom pagination 6px under the last row', async () => {
        const {container} = renderSearchUI(true)

        const table = await waitFor(() => {
            const element = container.querySelector<HTMLElement>('[data-autotest="table"][data-autotest-value="table-spacing"]')
            expect(element?.querySelector('tbody tr td')?.textContent).toBe('First')
            return element as HTMLElement
        })
        const tableBox = table.parentElement as HTMLElement
        const panel = tableBox.previousElementSibling as HTMLElement

        // The panel is a framed block: no line under it, 8px over and under it, 16px at its sides.
        expect(container.querySelector('hr')).toBeNull()
        expect(getComputedStyle(panel).marginTop).toBe('8px')
        expect(getComputedStyle(panel).marginBottom).toBe('8px')
        expect(getComputedStyle(panel).marginLeft).toBe('16px')
        // The margin of the panel is the gap: the box of the table adds nothing over it, only the 16px gutter.
        expect(getComputedStyle(tableBox).paddingTop).toBe('0px')
        expect(getComputedStyle(tableBox).paddingLeft).toBe('16px')
        expect(getComputedStyle(tableBox).paddingRight).toBe('16px')
        expect(getComputedStyle(tableBox).paddingBottom).toBe('0px')
        expect(getComputedStyle(table).paddingBottom).toBe('0px')

        const toolbar = (position: 'top' | 'bottom') => table.querySelector<HTMLElement>(
            `[data-autotest="pagination"][data-autotest-value="${position}"] .MuiTablePagination-toolbar`,
        ) as HTMLElement
        // The top row touches the table head; the bottom row keeps 6px from the last row.
        expect(getComputedStyle(toolbar('top')).marginTop).toBe('0px')
        expect(getComputedStyle(toolbar('top')).marginBottom).toBe('0px')
        expect(getComputedStyle(toolbar('bottom')).marginTop).toBe('6px')
        expect(getComputedStyle(toolbar('bottom')).marginBottom).toBe('0px')
    })

    it('keeps the default pagination spacing of a table outside SearchUI', async () => {
        const {PneTable} = await import('../src')
        const {container} = render(
            <PneTable<Row>
                autoTestId={'plain-table'}
                data={rows}
                createTableHeader={() => <tr><th>Header</th></tr>}
                createRow={row => <tr key={row.id}><td>{row.label}</td></tr>}
                paginator={{
                    rowsPerPageOptions: [10, 25],
                    rowsPerPage: 10,
                    page: 0,
                    onPageChange: jest.fn(),
                    onPageSizeChange: jest.fn(),
                    hasNext: true,
                    disableActions: false,
                    displayedRowsLabel: '1 - 2',
                    paginationRef: {current: null},
                    duplicatePagination: true,
                }}
            />,
        )

        const table = container.querySelector<HTMLElement>('[data-autotest="table"][data-autotest-value="plain-table"]') as HTMLElement
        expect(getComputedStyle(table).paddingBottom).toBe('8px')
        const toolbar = table.querySelector<HTMLElement>('.MuiTablePagination-toolbar') as HTMLElement
        expect(getComputedStyle(toolbar).marginTop).toBe('6px')
        expect(getComputedStyle(toolbar).marginBottom).toBe('6px')
    })
})
