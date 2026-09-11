import * as React from 'react'
import {act, fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
    TransactionSessionStatuses,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const transactionSessionStatuses: TransactionSessionStatuses = {
    APPROVED: [
        {displayName: 'AUTHORIZED', selected: true},
        {displayName: 'CHARGED', selected: false},
    ],
    PROCESSING: [{displayName: 'PROCESSING', selected: true}],
    UNKNOWN: [{displayName: 'UNKNOWN', selected: true}],
    FILTERED: [{displayName: 'FILTERED', selected: true}],
    ERROR: [
        {displayName: 'DECLINED', selected: true},
        {displayName: 'SYSTEM_ERROR', selected: true},
    ],
    PENDING_RETURNS: [{displayName: 'PENDING_RETURN', selected: true}],
    VALIDATING_3D: [{displayName: 'VALIDATING_3D', selected: true}],
    VERIFICATING_PHONE: [{displayName: 'VERIFICATING_PHONE', selected: true}],
    INVOICED: [{displayName: 'INVOICED', selected: true}],
    SENT: [{displayName: 'SENT', selected: true}],
    ALL: [{displayName: 'ALL', selected: true}],
}

const transactionSessionGroups = [
    'APPROVED',
    'PROCESSING',
    'UNKNOWN',
    'FILTERED',
    'ERROR',
    'PENDING_RETURNS',
    'VALIDATING_3D',
    'VERIFICATING_PHONE',
    'INVOICED',
    'SENT',
    'ALL',
]

const createDeferredStatuses = () => {
    let resolve!: (statuses: TransactionSessionStatuses) => void
    const promise = new Promise<TransactionSessionStatuses>(resolvePromise => {
        resolve = resolvePromise
    })

    return {promise, resolve}
}

const getCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"]`
        + `[data-autotest-value="${CriterionTypeEnum.TRANSACTION_SESSION_STATUS}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getTrigger = (criterion: HTMLElement): HTMLButtonElement => {
    const trigger = criterion.querySelector<HTMLButtonElement>(
        'button[data-autotest="criterion-transaction-session-status"]',
    )

    expect(trigger).not.toBeNull()

    return trigger as HTMLButtonElement
}

const getValues = (criterion: HTMLElement): string[] => Array.from(
    criterion.querySelectorAll<HTMLElement>(
        '[data-autotest="criterion-transaction-session-status-value"]',
    ),
    value => value.getAttribute('data-autotest-value') ?? '',
)

const getOwnedPanel = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="dialog"][data-autotest="criterion-transaction-session-status-panel"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.TRANSACTION_SESSION_STATUS}"]`,
)

const getGroupControl = (panel: HTMLElement): HTMLElement => {
    const control = panel.querySelector<HTMLElement>(
        '[role="combobox"][data-autotest="criterion-transaction-session-status-group"]',
    )

    expect(control).not.toBeNull()

    return control as HTMLElement
}

const getOwnedGroupOptions = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="listbox"][data-autotest="criterion-transaction-session-status-group-options"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.TRANSACTION_SESSION_STATUS}"]`,
)

const getGroupOption = (listbox: HTMLElement, group: string): HTMLElement | null => (
    listbox.querySelector<HTMLElement>(
        '[role="option"][data-autotest="criterion-transaction-session-status-group-option"]'
        + `[data-autotest-value="${group}"]`,
    )
)

const getStatusOption = (panel: HTMLElement, status: string): HTMLInputElement | null => (
    panel.querySelector<HTMLInputElement>(
        'input[type="checkbox"][data-autotest="criterion-transaction-session-status-option"]'
        + `[data-autotest-value="${status}"]`,
    )
)

describe('SearchUI transaction-session-status Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('scopes native triggers, restored raw values, and detached panels across two instances', async () => {
        const deferredStatuses = createDeferredStatuses()
        const getTransactionSessionStatuses = jest.fn(() => deferredStatuses.promise)
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getTransactionSessionStatuses,
                }}
            >
                <SearchUIFilters
                    autoTestId="session-status-first"
                    settingsContextName="session-status-first-context"
                    possibleCriteria={[CriterionTypeEnum.TRANSACTION_SESSION_STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_SESSION_STATUS]}
                    initialSearchConditions={{
                        transactionSessionStatusGroup: 'APPROVED',
                        transactionSessionStatuses: [
                            {displayName: 'AUTHORIZED', selected: true},
                            {displayName: 'CHARGED', selected: false},
                        ],
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="session-status-second"
                    settingsContextName="session-status-second-context"
                    possibleCriteria={[CriterionTypeEnum.TRANSACTION_SESSION_STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.TRANSACTION_SESSION_STATUS]}
                    initialSearchConditions={{
                        transactionSessionStatusGroup: 'ERROR',
                        transactionSessionStatuses: [
                            {displayName: 'DECLINED', selected: true},
                            {displayName: 'SYSTEM_ERROR', selected: true},
                        ],
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(getTransactionSessionStatuses).toHaveBeenCalledTimes(2)
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionSessionStatuses: 'AUTHORIZED',
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                transactionSessionStatuses: 'DECLINED,SYSTEM_ERROR',
            }))
        })

        const firstCriterion = getCriterion(container, 'session-status-first')
        const secondCriterion = getCriterion(container, 'session-status-second')
        const firstTrigger = getTrigger(firstCriterion)
        const secondTrigger = getTrigger(secondCriterion)

        expect(firstTrigger.type).toBe('button')
        expect(firstTrigger.getAttribute('aria-label')).toBe('Transaction session statuses')
        expect(firstTrigger.getAttribute('aria-haspopup')).toBe('dialog')
        expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(firstTrigger.getAttribute('aria-busy')).toBe('true')
        expect(firstTrigger.getAttribute('data-autotest-value')).toBe('APPROVED')
        expect(secondTrigger.getAttribute('data-autotest-value')).toBe('ERROR')
        expect(secondTrigger.getAttribute('aria-busy')).toBe('true')
        expect(firstTrigger.querySelectorAll('button')).toHaveLength(0)
        expect(firstCriterion.querySelector(
            '[data-autotest="criterion-transaction-session-status-group-value"]'
            + '[data-autotest-value="APPROVED"]',
        )).not.toBeNull()
        expect(secondCriterion.querySelector(
            '[data-autotest="criterion-transaction-session-status-group-value"]'
            + '[data-autotest-value="ERROR"]',
        )).not.toBeNull()
        expect(getValues(firstCriterion)).toEqual(['AUTHORIZED'])
        expect(getValues(secondCriterion)).toEqual(['DECLINED', 'SYSTEM_ERROR'])

        await act(async () => {
            deferredStatuses.resolve(transactionSessionStatuses)
            await deferredStatuses.promise
        })

        await waitFor(() => {
            expect(firstTrigger.getAttribute('aria-busy')).toBe('false')
            expect(secondTrigger.getAttribute('aria-busy')).toBe('false')
        })

        fireEvent.click(firstTrigger)
        fireEvent.click(secondTrigger)

        await waitFor(() => {
            expect(getOwnedPanel('session-status-first')).not.toBeNull()
            expect(getOwnedPanel('session-status-second')).not.toBeNull()
        })

        const firstPanel = getOwnedPanel('session-status-first') as HTMLElement
        const secondPanel = getOwnedPanel('session-status-second') as HTMLElement

        expect(firstTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(firstTrigger.getAttribute('aria-controls')).toBe(firstPanel.id)
        expect(secondTrigger.getAttribute('aria-controls')).toBe(secondPanel.id)
        expect(firstPanel.id).not.toBe(secondPanel.id)
        expect(firstPanel.getAttribute('aria-label')).toBeNull()
        expect(secondPanel.getAttribute('aria-label')).toBeNull()
        expect(document.getElementById(firstPanel.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('react.searchUI.addSessionStatusTitle')
        expect(document.getElementById(secondPanel.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('react.searchUI.addSessionStatusTitle')
        expect(firstPanel.getAttribute('aria-modal')).toBe('true')
        expect(firstPanel.getAttribute('aria-busy')).toBe('false')
        expect(secondPanel.getAttribute('aria-busy')).toBe('false')
        expect(firstCriterion.contains(firstPanel)).toBe(false)
        expect(secondCriterion.contains(secondPanel)).toBe(false)

        const firstGroupControl = getGroupControl(firstPanel)
        const secondGroupControl = getGroupControl(secondPanel)

        expect(firstGroupControl.getAttribute('aria-label')).toBe(
            'Transaction session status group',
        )
        expect(firstGroupControl.getAttribute('data-autotest-value')).toBe('APPROVED')
        expect(secondGroupControl.getAttribute('data-autotest-value')).toBe('ERROR')
        expect(firstGroupControl.getAttribute('aria-busy')).toBe('false')
        expect(firstGroupControl.getAttribute('aria-disabled')).toBeNull()

        fireEvent.mouseDown(firstGroupControl)
        fireEvent.mouseDown(secondGroupControl)

        await waitFor(() => {
            expect(getOwnedGroupOptions('session-status-first')).not.toBeNull()
            expect(getOwnedGroupOptions('session-status-second')).not.toBeNull()
        })

        const firstGroupOptions = getOwnedGroupOptions('session-status-first') as HTMLElement
        const secondGroupOptions = getOwnedGroupOptions('session-status-second') as HTMLElement

        for (const [panel, control, listbox, selectedGroup] of [
            [firstPanel, firstGroupControl, firstGroupOptions, 'APPROVED'],
            [secondPanel, secondGroupControl, secondGroupOptions, 'ERROR'],
        ] as const) {
            expect(control.getAttribute('aria-expanded')).toBe('true')
            expect(control.getAttribute('aria-controls')).toBe(listbox.id)
            expect(panel.contains(listbox)).toBe(false)
            expect(Array.from(listbox.querySelectorAll<HTMLElement>(
                '[role="option"][data-autotest="criterion-transaction-session-status-group-option"]',
            ), option => option.getAttribute('data-autotest-value'))).toEqual(
                transactionSessionGroups,
            )

            for (const group of transactionSessionGroups) {
                expect(getGroupOption(listbox, group)?.getAttribute('aria-selected')).toBe(
                    String(group === selectedGroup),
                )
            }
        }

        expect(getStatusOption(firstPanel, 'AUTHORIZED')?.checked).toBe(true)
        expect(getStatusOption(firstPanel, 'CHARGED')?.checked).toBe(false)
        expect(getStatusOption(secondPanel, 'DECLINED')?.checked).toBe(true)
        expect(getStatusOption(secondPanel, 'SYSTEM_ERROR')?.checked).toBe(true)

        firstOnFiltersUpdate.mockClear()
        secondOnFiltersUpdate.mockClear()
        fireEvent.click(getStatusOption(firstPanel, 'CHARGED') as HTMLInputElement)

        await waitFor(() => {
            expect(getStatusOption(firstPanel, 'CHARGED')?.checked).toBe(true)
            expect(firstOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionSessionStatuses: 'AUTHORIZED,CHARGED',
            }))
        })
        expect(getStatusOption(secondPanel, 'DECLINED')?.checked).toBe(true)
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        firstOnFiltersUpdate.mockClear()
        fireEvent.click(getGroupOption(firstGroupOptions, 'PROCESSING') as HTMLElement)

        await waitFor(() => {
            expect(firstGroupControl.getAttribute('data-autotest-value')).toBe('PROCESSING')
            expect(firstTrigger.getAttribute('data-autotest-value')).toBe('PROCESSING')
            expect(getStatusOption(firstPanel, 'PROCESSING')?.checked).toBe(true)
            expect(firstOnFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
                transactionSessionStatuses: 'PROCESSING',
            }))
        })
        expect(firstCriterion.querySelector(
            '[data-autotest="criterion-transaction-session-status-group-value"]'
            + '[data-autotest-value="PROCESSING"]',
        )).not.toBeNull()
        expect(getValues(firstCriterion)).toEqual(['PROCESSING'])
        expect(secondGroupControl.getAttribute('data-autotest-value')).toBe('ERROR')
        expect(getValues(secondCriterion)).toEqual(['DECLINED', 'SYSTEM_ERROR'])
        expect(secondOnFiltersUpdate).not.toHaveBeenCalled()

        const firstClose = firstPanel.querySelector<HTMLButtonElement>('button[aria-label="Close"]')
        const secondClose = secondPanel.querySelector<HTMLButtonElement>('button[aria-label="Close"]')

        expect(firstClose).not.toBeNull()
        expect(secondClose).not.toBeNull()
        fireEvent.click(firstClose as HTMLButtonElement)

        await waitFor(() => {
            expect(getOwnedPanel('session-status-first')).toBeNull()
            expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        })
        expect(getOwnedPanel('session-status-second')).toBe(secondPanel)
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(getValues(secondCriterion)).toEqual(['DECLINED', 'SYSTEM_ERROR'])
    })
})
