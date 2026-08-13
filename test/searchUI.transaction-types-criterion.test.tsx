import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import { SearchUIFilters } from '../src/component/search-ui/filters/SearchUIFilters'
import { resetSearchUIRetentionForTests } from '../src/component/search-ui/filters/state/retention'
import { CriterionTypeEnum, SearchCriteria } from '../src/component/search-ui/filters/types'
import {
    initialSearchUIDefaults,
    SearchUIDefaultsContext,
} from '../src/component/search-ui/SearchUIProvider'
import type { AbstractEntity } from '../src/common/paynet/type'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}))

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
}

const createDeferred = <T,>(): Deferred<T> => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>(innerResolve => {
        resolve = innerResolve
    })

    return {promise, resolve}
}

const transactionTypes: AbstractEntity[] = [
    {id: 611, displayName: 'chargeback'},
    {id: 722, displayName: 'fraud'},
    {id: 833, displayName: 'sale'},
]

const allowedNames = ['chargeback', 'fraud'] as const

type RenderFiltersOptions = {
    getTransactionTypes?: () => Promise<AbstractEntity[]>
    onFiltersUpdate?: (criteria: SearchCriteria) => void
    restricted?: boolean
    initialSearchConditions?: React.ComponentProps<typeof SearchUIFilters>['initialSearchConditions']
    searchConditions?: React.ComponentProps<typeof SearchUIFilters>['searchConditions']
}

const renderFilters = ({
    getTransactionTypes = jest.fn().mockResolvedValue(transactionTypes),
    onFiltersUpdate = jest.fn(),
    restricted = true,
    initialSearchConditions,
    searchConditions,
}: RenderFiltersOptions = {}) => render(
    <SearchUIDefaultsContext.Provider
        value={{
            ...initialSearchUIDefaults,
            getTransactionTypes,
        }}
    >
        <SearchUIFilters
            settingsContextName={'transaction-types-criterion-test'}
            possibleCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
            predefinedCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
            initialSearchConditions={initialSearchConditions}
            searchConditions={searchConditions}
            onFiltersUpdate={onFiltersUpdate}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
                ...(restricted ? {
                    transactionTypes: {allowedNames},
                } : {}),
            }}
        />
    </SearchUIDefaultsContext.Provider>,
)

describe('SearchUIFilters restricted transaction types', () => {
    beforeEach(() => {
        resetSearchUIRetentionForTests()
    })

    afterEach(() => {
        resetSearchUIRetentionForTests()
    })

    it('keeps unrestricted Transaction Types behavior backward compatible', async () => {
        const onFiltersUpdate = jest.fn()
        renderFilters({onFiltersUpdate, restricted: false})

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [],
            }))
        })

        const select = await screen.findByRole('combobox')
        fireEvent.mouseDown(select)

        expect(await screen.findByRole('option', {name: 'chargeback'})).toBeTruthy()
        expect(screen.getByRole('option', {name: 'fraud'})).toBeTruthy()
        expect(screen.getByRole('option', {name: 'sale'})).toBeTruthy()

        fireEvent.click(screen.getByRole('option', {name: 'sale'}))
        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [833],
            }))
        })
    })

    it('waits for the dictionary and emits only resolved allowed IDs on first update', async () => {
        const deferred = createDeferred<AbstractEntity[]>()
        const getTransactionTypes = jest.fn(() => deferred.promise)
        const onFiltersUpdate = jest.fn()

        renderFilters({getTransactionTypes, onFiltersUpdate})

        expect(onFiltersUpdate).not.toHaveBeenCalled()

        await act(async () => {
            deferred.resolve(transactionTypes)
            await deferred.promise
        })

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledTimes(1)
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [611, 722],
            }))
        })
        expect(getTransactionTypes).toHaveBeenCalledTimes(1)
    })

    it('shows only allowed options and keeps All inside the restricted dictionary', async () => {
        const onFiltersUpdate = jest.fn()
        renderFilters({onFiltersUpdate})

        const select = await screen.findByRole('combobox')
        fireEvent.mouseDown(select)

        expect(await screen.findByRole('option', {name: 'chargeback'})).toBeTruthy()
        expect(screen.getByRole('option', {name: 'fraud'})).toBeTruthy()
        expect(screen.queryByRole('option', {name: 'sale'})).toBeNull()

        fireEvent.click(screen.getByRole('option', {name: 'chargeback'}))
        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [611],
            }))
        })

        fireEvent.click(screen.getByRole('option', {name: 'react.searchUI.all'}))
        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [611, 722],
            }))
        })
    })

    it('normalizes initial and external selections by name to current dictionary entities', async () => {
        const onFiltersUpdate = jest.fn()
        const initialSearchConditions = {
            transactionTypes: {
                all: false,
                entities: [
                    {id: 1, displayName: 'chargeback'},
                    {id: 2, displayName: 'sale'},
                ],
            },
        }
        const view = renderFilters({onFiltersUpdate, initialSearchConditions})

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [611],
            }))
        })

        view.rerender(
            <SearchUIDefaultsContext.Provider
                value={{
                    ...initialSearchUIDefaults,
                    getTransactionTypes: jest.fn().mockResolvedValue(transactionTypes),
                }}
            >
                <SearchUIFilters
                    settingsContextName={'transaction-types-criterion-test'}
                    possibleCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
                    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_TYPES]}
                    searchConditions={{
                        criteria: [CriterionTypeEnum.TRANSACTION_TYPES],
                        transactionTypes: {
                            all: false,
                            entities: [
                                {id: 3, displayName: 'fraud'},
                                {id: 4, displayName: 'sale'},
                            ],
                        },
                    }}
                    onFiltersUpdate={onFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                        transactionTypes: {allowedNames},
                    }}
                />
            </SearchUIDefaultsContext.Provider>,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionTypes: [722],
            }))
        })
    })
})
