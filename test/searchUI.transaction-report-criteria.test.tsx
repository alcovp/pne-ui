import React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import 'jest-canvas-mock'
import {SearchUIFilters} from '../src/component/search-ui/filters/SearchUIFilters'
import {
    CriterionTypeEnum,
    type SearchCriteria,
} from '../src/component/search-ui/filters/types'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const REPORT_CRITERIA = [
    CriterionTypeEnum.TRANSACTION_REPORT_SCOPE,
    CriterionTypeEnum.TRANSACTION_DATE_TYPE,
    CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER,
    CriterionTypeEnum.TIME_ZONE,
    CriterionTypeEnum.CSV_CHARSET,
]

const selectOption = async (currentValue: string, optionName: string): Promise<void> => {
    const chip = screen.getByRole('button', {name: currentValue})
    const expandIcon = chip.querySelector('[data-testid="ExpandMoreIcon"]')
    if (!expandIcon) {
        throw new Error(`Dropdown trigger was not found for ${currentValue}`)
    }

    fireEvent.click(expandIcon)
    fireEvent.click(await screen.findByRole('option', {name: optionName}))
}

describe('SearchUI transaction report criteria', () => {
    it('renders all five criteria and publishes the backend-aligned fields', async () => {
        const onFiltersUpdate = jest.fn<void, [SearchCriteria]>()

        render(<SearchUIFilters
            settingsContextName={'transaction-report-criteria'}
            possibleCriteria={REPORT_CRITERIA}
            predefinedCriteria={REPORT_CRITERIA}
            initialSearchConditions={{
                scope: 'SELECTED_BY_SESS_ID',
                transactionIds: '1001\n1002',
                datesType: 'CREATED',
                recurrentFilter: 'RECURRENTS_ONLY',
                timeZoneOffsetHours: 3,
                csvCharset: 'UTF-8-SIG',
            }}
            onFiltersUpdate={onFiltersUpdate}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
            }}
        />)

        const transactionIds = await screen.findByRole('textbox', {
            name: 'react.searchUI.transactionIds',
        })

        expect(transactionIds.tagName).toBe('TEXTAREA')
        expect((transactionIds as HTMLTextAreaElement).rows).toBe(6)
        expect(screen.getAllByText('transactionReportScope.SELECTED_BY_SESS_ID').length).toBeGreaterThan(0)
        expect(screen.getByText('advancedSearch.transactionsDatesType.CREATED')).toBeTruthy()
        expect(screen.getAllByText('recurrentFilterType.RECURRENTS_ONLY').length).toBeGreaterThan(0)
        expect(screen.getAllByText('GMT +3').length).toBeGreaterThan(0)
        expect(screen.getAllByText('UTF-8-SIG').length).toBeGreaterThan(0)

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            scope: 'SELECTED_BY_SESS_ID',
            transactionIds: '1001\n1002',
            datesType: 'CREATED',
            recurrentFilter: 'RECURRENTS_ONLY',
            timeZoneOffsetHours: 3,
            csvCharset: 'UTF-8-SIG',
        })))

        fireEvent.change(transactionIds, {target: {value: '2001\n2002'}})

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            transactionIds: '2001\n2002',
        })))

        await selectOption(
            'transactionReportScope.SELECTED_BY_SESS_ID',
            'transactionReportScope.SELECTED_BY_TX_RRN',
        )
        await selectOption(
            'recurrentFilterType.RECURRENTS_ONLY',
            'recurrentFilterType.NON_RECURRENTS_ONLY',
        )
        await selectOption('GMT +3', 'GMT -5')
        await selectOption('UTF-8-SIG', 'windows-1251')

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            scope: 'SELECTED_BY_TX_RRN',
            recurrentFilter: 'NON_RECURRENTS_ONLY',
            timeZoneOffsetHours: -5,
            csvCharset: 'windows-1251',
        })))
    })

    it('hides the transaction IDs input for the ALL scope', async () => {
        render(<SearchUIFilters
            settingsContextName={'transaction-report-all-scope'}
            possibleCriteria={[CriterionTypeEnum.TRANSACTION_REPORT_SCOPE]}
            predefinedCriteria={[CriterionTypeEnum.TRANSACTION_REPORT_SCOPE]}
            initialSearchConditions={{scope: 'ALL'}}
            onFiltersUpdate={jest.fn()}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
            }}
        />)

        expect((await screen.findAllByText('transactionReportScope.ALL')).length).toBeGreaterThan(0)
        expect(screen.queryByRole('textbox', {name: 'react.searchUI.transactionIds'})).toBeNull()
    })
})
