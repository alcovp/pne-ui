import * as React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'

import {CriterionTypeEnum, SearchUIFilters, type OrderSearchLabel, type SearchCriteria} from '../src'
import {getRequestSourceHostname} from '../src/component/search-ui/filters/requestSource'
import {getSearchUIFiltersInitialState} from '../src/component/search-ui/filters/state/initial'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'
import {
    SEARCH_UI_ORDERS_SEARCH_INVALID_REQUEST_SOURCE,
    validateSearchUIFiltersState,
} from '../src/component/search-ui/filters/validation'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string, hostname?: string}) => (
            (options?.defaultValue ?? key).replace('{{hostname}}', options?.hostname ?? '')
        ),
    }),
}))

jest.mock(
    '../src/component/search-ui/filters/component/select/SearchUIOrdersSearchLabelSelect',
    () => ({SearchUIOrdersSearchLabelSelect: () => null}),
)

describe('Request source hostname', () => {
    it.each([
        // The normalisation table of #172526 (R-ORD-002).
        ['https://gate.example.com', 'gate.example.com'],
        ['https://gate.example.com/', 'gate.example.com'],
        ['https://gate.example.com/checkout', 'gate.example.com'],
        ['https://gate.example.com/pay?id=1', 'gate.example.com'],
        ['gate.example.com', 'gate.example.com'],
        ['gate.example.com/', 'gate.example.com'],
        ['gate.example.com:8443', 'gate.example.com'],
        ['WWW.Gate.Example.com', 'gate.example.com'],
        ['www.example.com', 'example.com'],
        ['https://www.example.com/', 'example.com'],
        ['praefectus_castrorum.com', 'praefectus_castrorum.com'],
        ['пример.рф', 'пример.рф'],
        ['xn--e1afmapc.xn--p1ai', 'xn--e1afmapc.xn--p1ai'],
        // Spellings the table leaves out.
        ['HTTP://Example.com#top', 'example.com'],
        ['  http://user:secret@shop.example.com:80/a  ', 'shop.example.com'],
        ['ПРИМЕР.РФ/оплата', 'пример.рф'],
    ])('takes %j as %j', (value, hostname) => {
        expect(getRequestSourceHostname(value)).toBe(hostname)
    })

    it.each([
        'localhost',
        'не URL без точки',
        '',
        '   ',
        'https://',
        'www.',
        'exa mple.com',
        '[2001:db8::1]',
        'ftp://example.com',
        'example,com.net',
    ])('finds no hostname in %j', value => {
        expect(getRequestSourceHostname(value)).toBeNull()
    })
})

describe('Request source validation', () => {
    const stateWith = (ordersSearchLabel: OrderSearchLabel, ordersSearchValue: string) => ({
        ...getSearchUIFiltersInitialState(),
        criteria: [CriterionTypeEnum.ORDERS_SEARCH],
        ordersSearchLabel,
        ordersSearchValue,
    })

    it('rejects a request source without a hostname', () => {
        expect(validateSearchUIFiltersState(stateWith('request_source', 'localhost'))).toEqual({
            isValid: false,
            errors: [{
                criterion: CriterionTypeEnum.ORDERS_SEARCH,
                code: SEARCH_UI_ORDERS_SEARCH_INVALID_REQUEST_SOURCE,
                messageKey: 'react.searchUI.ordersSearch.requestSource.invalid',
                params: {},
            }],
        })
    })

    it.each([
        ['an empty request source, which is no filter', 'request_source', '  '],
        ['a request source with a hostname', 'request_source', 'https://www.example.com/'],
        ['the same text under another field', 'merchant_invoice_id', 'localhost'],
    ] as const)('accepts %s', (_, label, value) => {
        expect(validateSearchUIFiltersState(stateWith(label, value)).isValid).toBe(true)
    })

    it('ignores a request source when the criterion is not added', () => {
        expect(validateSearchUIFiltersState({
            ...stateWith('request_source', 'localhost'),
            criteria: [],
        }).isValid).toBe(true)
    })
})

describe('Request source criterion', () => {
    beforeEach(() => {
        localStorage.clear()
        resetSearchUIRetentionForTests()
    })

    let renderCount = 0
    const renderCriterion = (ordersSearchLabel: OrderSearchLabel, ordersSearchValue: string) => {
        const onFiltersUpdate = jest.fn<void, [SearchCriteria]>()
        const onValidationChange = jest.fn()
        renderCount += 1
        render(<SearchUIFilters
            autoTestId={'request-source'}
            settingsContextName={`request-source-context-${renderCount}`}
            possibleCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
            predefinedCriteria={[CriterionTypeEnum.ORDERS_SEARCH]}
            initialSearchConditions={{ordersSearchLabel, ordersSearchValue}}
            onFiltersUpdate={onFiltersUpdate}
            onValidationChange={onValidationChange}
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
            }}
        />)
        return {onFiltersUpdate, onValidationChange}
    }

    const valueInput = () => screen.getByRole<HTMLInputElement>('textbox', {name: 'Order search value'})
    const note = (autoTestId: string) => document.querySelector<HTMLElement>(`[data-autotest="${autoTestId}"]`)
    const refreshButton = () => screen.getByRole<HTMLButtonElement>('button', {name: 'Refresh'})

    it('shows the data delay and the hostname that is searched for', async () => {
        const {onFiltersUpdate} = renderCriterion('request_source', '')
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            ordersSearchLabel: 'request_source',
            ordersSearchValue: '',
        })))

        expect(note('criterion-request-source-delay')?.textContent)
            .toBe('Data is updated with a delay of up to 7 minutes')
        expect(note('criterion-request-source-hostname')).toBeNull()

        const url = 'https://WWW.Shop.Example.com:8443/pay?id=1'
        act(() => valueInput().focus())
        fireEvent.change(valueInput(), {target: {value: url}})

        // The search gets the address as typed; the server takes the hostname by the same rules.
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            ordersSearchLabel: 'request_source',
            ordersSearchValue: url,
        })))
        const hostname = note('criterion-request-source-hostname')
        expect(hostname?.getAttribute('data-autotest-value')).toBe('shop.example.com')
        expect(hostname?.textContent).toBe('Search by hostname: shop.example.com')
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('keeps a long URL whole', async () => {
        const {onFiltersUpdate} = renderCriterion('request_source', '')
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())

        const url = `https://example.com/${'a'.repeat(300)}`
        fireEvent.change(valueInput(), {target: {value: url}})

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            ordersSearchValue: url,
        })))
        expect(valueInput().value).toBe(url)
    })

    it('reports an address without a hostname once the field is left and searches nothing with it', async () => {
        const {onFiltersUpdate, onValidationChange} = renderCriterion('request_source', 'example.com')
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalled())
        onFiltersUpdate.mockClear()

        act(() => valueInput().focus())
        fireEvent.change(valueInput(), {target: {value: 'localhost'}})

        await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith({
            isValid: false,
            errors: [expect.objectContaining({code: SEARCH_UI_ORDERS_SEARCH_INVALID_REQUEST_SOURCE})],
        }))
        // No red while typing: the address may be unfinished.
        expect(screen.queryByRole('alert')).toBeNull()
        expect(refreshButton().disabled).toBe(true)

        act(() => valueInput().blur())

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('Enter a site address such as example.com')
        expect(alert.getAttribute('data-autotest')).toBe('criterion-request-source-error')
        expect(valueInput().getAttribute('aria-invalid')).toBe('true')
        expect(note('criterion-request-source-hostname')).toBeNull()
        expect(note('criterion-request-source-delay')).not.toBeNull()
        expect(onFiltersUpdate).not.toHaveBeenCalled()
    })

    it('searches without the filter once the address is erased', async () => {
        const {onFiltersUpdate} = renderCriterion('request_source', 'localhost')
        await waitFor(() => expect(screen.getByRole('alert')).not.toBeNull())
        expect(onFiltersUpdate).not.toHaveBeenCalled()

        fireEvent.change(valueInput(), {target: {value: ''}})

        await waitFor(() => expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            ordersSearchLabel: 'request_source',
            ordersSearchValue: '',
        })))
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('adds no notes to the other fields', async () => {
        const {onFiltersUpdate} = renderCriterion('merchant_invoice_id', 'localhost')
        await waitFor(() => expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            ordersSearchLabel: 'merchant_invoice_id',
            ordersSearchValue: 'localhost',
        })))

        expect(note('criterion-request-source-delay')).toBeNull()
        expect(note('criterion-request-source-hostname')).toBeNull()
        expect(screen.queryByRole('alert')).toBeNull()
    })
})
