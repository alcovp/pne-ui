import * as React from 'react'
import {act, cleanup, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {SearchUI, type SearchParams} from '../src/component/search-ui/SearchUI'
import {CriterionTypeEnum} from '../src/component/search-ui/filters/types'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'
import {initialSearchUIDefaults, SearchUIDefaultsContext} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

type Row = {id: number}

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(done => {
        resolve = done
    })
    return {promise, resolve}
}

const rowsFor = (params: SearchParams): Row[] =>
    Array.from({length: params.rowCount}, (_, index) => ({id: params.startNum + index + 1}))

describe('SearchUI rows', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        resetSearchUIRetentionForTests()
    })

    afterEach(() => {
        cleanup()
        resetSearchUIRetentionForTests()
    })

    it('draws the rows of a page once: a page on its way leaves the shown rows as they are', async () => {
        const answers: Array<ReturnType<typeof createDeferred<Row[]>>> = []
        const searchData = jest.fn((params: SearchParams) => {
            const answer = createDeferred<Row[]>()
            answers.push(answer)
            void answer.promise
            return answer.promise.then(() => rowsFor(params))
        })
        const drawn: number[] = []
        const RowView = ({row}: {row: Row}) => {
            drawn.push(row.id)
            return (
                <tr>
                    <td>{`Row ${row.id}`}</td>
                </tr>
            )
        }

        const {container} = render(
            <SearchUIDefaultsContext value={initialSearchUIDefaults}>
                <SearchUI
                    settingsContextName='rows-render'
                    possibleCriteria={[CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.STATUS]}
                    searchData={searchData}
                    createTableHeader={() => (
                        <tr>
                            <th>Result</th>
                        </tr>
                    )}
                    createTableRow={row => <RowView key={row.id} row={row} />}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIDefaultsContext>,
        )

        await waitFor(() => expect(searchData).toHaveBeenCalledTimes(1))
        await act(async () => {
            answers[0].resolve([])
            await answers[0].promise
        })
        await waitFor(() => expect(container.textContent).toContain('Row 1'))
        const firstPage = drawn.length
        expect(firstPage).toBeGreaterThan(0)

        const next = container.querySelector<HTMLButtonElement>('[data-autotest="next-page"]')
        expect(next).not.toBeNull()
        fireEvent.click(next as HTMLButtonElement)
        await waitFor(() => expect(searchData).toHaveBeenCalledTimes(2))
        // The next page is on its way: the rows on screen were not drawn again.
        expect(drawn).toHaveLength(firstPage)

        await act(async () => {
            answers[1].resolve([])
            await answers[1].promise
        })
        await waitFor(() => expect(container.textContent).toContain(`Row ${firstPage + 1}`))
        expect(drawn.slice(firstPage, firstPage + 1)).toEqual([firstPage + 1])
    })
})
