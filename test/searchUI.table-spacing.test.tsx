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
    it('sets the table 6px under the divider, with nothing around the pagination rows or under the table', async () => {
        const {container} = renderSearchUI(true)

        const table = await waitFor(() => {
            const element = container.querySelector<HTMLElement>('[data-autotest="table"][data-autotest-value="table-spacing"]')
            expect(element?.querySelector('tbody tr td')?.textContent).toBe('First')
            return element as HTMLElement
        })
        const tableBox = table.parentElement as HTMLElement
        const divider = tableBox.previousElementSibling as HTMLElement

        expect(divider.tagName).toBe('HR')
        // 6px under the divider, the 16px gutter on the sides, nothing at the bottom.
        expect(getComputedStyle(tableBox).paddingTop).toBe('6px')
        expect(getComputedStyle(tableBox).paddingLeft).toBe('16px')
        expect(getComputedStyle(tableBox).paddingRight).toBe('16px')
        expect(getComputedStyle(tableBox).paddingBottom).toBe('0px')
        expect(getComputedStyle(table).paddingBottom).toBe('0px')

        const toolbars = Array.from(table.querySelectorAll<HTMLElement>('.MuiTablePagination-toolbar'))
        expect(toolbars).toHaveLength(2)
        for (const toolbar of toolbars) {
            expect(getComputedStyle(toolbar).marginTop).toBe('0px')
            expect(getComputedStyle(toolbar).marginBottom).toBe('0px')
        }
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
