import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

jest.mock('@hello-pangea/dnd', () => {
    const ReactModule = jest.requireActual<typeof import('react')>('react')

    return {
        DragDropContext: ({children}: React.PropsWithChildren) => (
            ReactModule.createElement(ReactModule.Fragment, null, children)
        ),
        Droppable: ({children}: {
            children: (provided: {innerRef: jest.Mock; placeholder: null}) => React.ReactNode
        }) => ReactModule.createElement('div', null, children({
            innerRef: jest.fn(),
            placeholder: null,
        })),
        Draggable: ({children}: {
            children: (provided: {
                innerRef: jest.Mock
                draggableProps: {style: undefined}
                dragHandleProps: Record<string, never>
            }) => React.ReactNode
        }) => ReactModule.createElement('div', null, children({
            innerRef: jest.fn(),
            draggableProps: {style: undefined},
            dragHandleProps: {},
        })),
    }
})

jest.mock('react-virtuoso', () => {
    const ReactModule = jest.requireActual<typeof import('react')>('react')

    return {
        Virtuoso: ({children, data, itemContent}: {
            children?: React.ReactNode
            data: {id: number}[]
            itemContent: (index: number, item: {id: number}) => React.ReactNode
        }) => ReactModule.createElement(
            'div',
            null,
            ...data.map((item, index) => ReactModule.createElement(
                ReactModule.Fragment,
                {key: item.id},
                itemContent(index, item),
            )),
            children,
        ),
    }
})

const filtersConfig = {
    hideShowFiltersButton: true,
    hideTemplatesSelect: true,
}

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const getGroupingCriterion = (container: HTMLElement, scope: string): HTMLElement => {
    const criterion = container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"] `
        + `[data-autotest="criterion"][data-autotest-value="${CriterionTypeEnum.GROUPING}"]`,
    )

    expect(criterion).not.toBeNull()

    return criterion as HTMLElement
}

const getGroupsTrigger = (criterion: HTMLElement): HTMLButtonElement => {
    const trigger = criterion.querySelector<HTMLButtonElement>(
        'button[data-autotest="criterion-grouping-groups"]',
    )

    expect(trigger).not.toBeNull()

    return trigger as HTMLButtonElement
}

const getSelectedGroups = (criterion: HTMLElement): string[] => Array.from(
    criterion.querySelectorAll<HTMLElement>('[data-autotest="criterion-grouping-value"]'),
    value => value.getAttribute('data-autotest-value') ?? '',
)

const getOwnedDialog = (scope: string): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="dialog"][data-autotest="criterion-grouping-panel"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${CriterionTypeEnum.GROUPING}"]`,
)

const getGroupOptions = (dialog: HTMLElement): HTMLButtonElement[] => Array.from(
    dialog.querySelectorAll<HTMLButtonElement>(
        'button[data-autotest="criterion-grouping-option"]',
    ),
)

const getGroupOptionValues = (dialog: HTMLElement): string[] => getGroupOptions(dialog).map(
    option => option.getAttribute('data-autotest-value') ?? '',
)

describe('SearchUI grouping groups Selenium contract', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('exposes scoped native triggers, dialogs, and raw keyboard-operable group rows', async () => {
        const firstOnFiltersUpdate = jest.fn()
        const secondOnFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider defaults={{getSearchTemplates: neverResolves}}>
                <SearchUIFilters
                    autoTestId="grouping-groups-first"
                    settingsContextName="grouping-groups-first-context"
                    possibleCriteria={[CriterionTypeEnum.GROUPING]}
                    predefinedCriteria={[CriterionTypeEnum.GROUPING]}
                    initialSearchConditions={{
                        grouping: {
                            dateType: 'DAY',
                            availableGroupingTypes: ['ENDPOINT', 'CARD_TYPE'],
                            selectedGroupingTypes: ['MERCHANT', 'PROJECT', 'DATE'],
                        },
                    }}
                    onFiltersUpdate={firstOnFiltersUpdate}
                    config={filtersConfig}
                />
                <SearchUIFilters
                    autoTestId="grouping-groups-second"
                    settingsContextName="grouping-groups-second-context"
                    possibleCriteria={[CriterionTypeEnum.GROUPING]}
                    predefinedCriteria={[CriterionTypeEnum.GROUPING]}
                    initialSearchConditions={{
                        grouping: {
                            dateType: 'MONTH',
                            availableGroupingTypes: ['CURRENCY'],
                            selectedGroupingTypes: ['MANAGER', 'DATE'],
                        },
                    }}
                    onFiltersUpdate={secondOnFiltersUpdate}
                    config={filtersConfig}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(firstOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                groupTypes: ['MERCHANT', 'PROJECT', 'DAY'],
            }))
            expect(secondOnFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                groupTypes: ['MANAGER', 'MONTH'],
            }))
        })

        const firstCriterion = getGroupingCriterion(container, 'grouping-groups-first')
        const secondCriterion = getGroupingCriterion(container, 'grouping-groups-second')
        const firstTrigger = getGroupsTrigger(firstCriterion)
        const secondTrigger = getGroupsTrigger(secondCriterion)

        expect(firstTrigger.type).toBe('button')
        expect(firstTrigger.getAttribute('aria-label')).toBe('Grouping groups')
        expect(firstTrigger.getAttribute('aria-haspopup')).toBe('dialog')
        expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(getSelectedGroups(firstCriterion)).toEqual(['MERCHANT', 'PROJECT', 'DATE'])
        expect(getSelectedGroups(secondCriterion)).toEqual(['MANAGER', 'DATE'])

        fireEvent.click(firstTrigger)
        fireEvent.click(secondTrigger)

        await waitFor(() => {
            expect(firstTrigger.getAttribute('aria-expanded')).toBe('true')
            expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
            expect(getOwnedDialog('grouping-groups-first')).not.toBeNull()
            expect(getOwnedDialog('grouping-groups-second')).not.toBeNull()
        })

        const firstDialog = getOwnedDialog('grouping-groups-first') as HTMLElement
        const secondDialog = getOwnedDialog('grouping-groups-second') as HTMLElement

        expect(firstTrigger.getAttribute('aria-controls')).toBe(firstDialog.id)
        expect(secondTrigger.getAttribute('aria-controls')).toBe(secondDialog.id)
        expect(firstDialog.getAttribute('aria-label')).toBeNull()
        expect(firstDialog.getAttribute('aria-modal')).toBe('true')
        expect(secondDialog.getAttribute('aria-label')).toBeNull()
        expect(secondDialog.getAttribute('aria-modal')).toBe('true')
        expect(document.getElementById(firstDialog.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('performanceReport.grouping')
        expect(document.getElementById(secondDialog.getAttribute('aria-labelledby')!)?.textContent)
            .toBe('performanceReport.grouping')
        expect(firstDialog.id).not.toBe(secondDialog.id)
        expect(firstCriterion.contains(firstDialog)).toBe(false)
        expect(secondCriterion.contains(secondDialog)).toBe(false)
        expect(getSelectedGroups(secondCriterion)).toEqual(['MANAGER', 'DATE'])

        const firstAvailable = firstDialog.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-grouping-available"]',
        )
        const firstSelected = firstDialog.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-grouping-selected"]',
        )
        const secondAvailable = secondDialog.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-grouping-available"]',
        )
        const secondSelected = secondDialog.querySelector<HTMLElement>(
            '[role="group"][data-autotest="criterion-grouping-selected"]',
        )

        expect(firstAvailable?.getAttribute('aria-label')).toBe('Available grouping groups')
        expect(firstSelected?.getAttribute('aria-label')).toBe('Selected grouping groups')
        expect(secondAvailable?.getAttribute('aria-label')).toBe('Available grouping groups')
        expect(secondSelected?.getAttribute('aria-label')).toBe('Selected grouping groups')

        await waitFor(() => {
            expect(getGroupOptionValues(firstDialog)).toEqual([
                'ENDPOINT',
                'CARD_TYPE',
                'MERCHANT',
                'PROJECT',
                'DATE',
            ])
            expect(getGroupOptionValues(secondDialog)).toEqual([
                'CURRENCY',
                'MANAGER',
                'DATE',
            ])
        })

        const firstSearch = firstDialog.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-grouping-search"]',
        )
        const secondSearch = secondDialog.querySelector<HTMLInputElement>(
            'input[data-autotest="criterion-grouping-search"]',
        )
        const firstAddAll = firstDialog.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-grouping-add-all"]',
        )
        const firstRemoveAll = firstDialog.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-grouping-remove-all"]',
        )

        expect(firstSearch?.type).toBe('text')
        expect(firstSearch?.getAttribute('aria-label')).toBe('Search grouping groups')
        expect(secondSearch?.value).toBe('')
        expect(firstAddAll?.type).toBe('button')
        expect(firstAddAll?.getAttribute('aria-label')).toBe('Add all groups')
        expect(firstRemoveAll?.type).toBe('button')
        expect(firstRemoveAll?.getAttribute('aria-label')).toBe('Remove all groups')

        fireEvent.change(firstSearch as HTMLInputElement, {target: {value: 'CARD'}})

        await waitFor(() => {
            expect(firstSearch?.value).toBe('CARD')
            expect(getGroupOptionValues(firstAvailable as HTMLElement)).toEqual(['CARD_TYPE'])
        })
        expect(secondSearch?.value).toBe('')
        expect(getGroupOptionValues(secondAvailable as HTMLElement)).toEqual(['CURRENCY'])

        const firstSearchClear = firstDialog.querySelector<HTMLButtonElement>(
            'button[data-autotest="criterion-grouping-search-clear"]',
        )
        expect(firstSearchClear?.type).toBe('button')
        expect(firstSearchClear?.getAttribute('aria-label')).toBe('Clear grouping search')
        fireEvent.click(firstSearchClear as HTMLButtonElement)

        await waitFor(() => {
            expect(firstSearch?.value).toBe('')
            expect(getGroupOptionValues(firstAvailable as HTMLElement)).toEqual([
                'ENDPOINT',
                'CARD_TYPE',
            ])
        })

        for (const option of [...getGroupOptions(firstDialog), ...getGroupOptions(secondDialog)]) {
            expect(option.tagName).toBe('BUTTON')
            expect(option.type).toBe('button')
            expect(option.tabIndex).toBe(0)
        }
        expect(getGroupOptions(firstDialog).map(option => option.getAttribute('aria-label'))).toEqual([
            'Add group: ENDPOINT',
            'Add group: CARD_TYPE',
            'Remove group: MERCHANT',
            'Remove group: PROJECT',
            'Remove group: DATE',
        ])

        const endpointOption = getGroupOptions(firstDialog).find(
            option => option.getAttribute('data-autotest-value') === 'ENDPOINT',
        )
        expect(endpointOption).not.toBeUndefined()
        fireEvent.click(endpointOption as HTMLButtonElement)

        await waitFor(() => {
            expect(getGroupOptionValues(firstDialog)).toEqual([
                'CARD_TYPE',
                'MERCHANT',
                'PROJECT',
                'DATE',
                'ENDPOINT',
            ])
        })
        expect(getGroupOptions(firstDialog).at(-1)?.getAttribute('aria-label')).toBe(
            'Remove group: ENDPOINT',
        )
        expect(getGroupOptionValues(secondDialog)).toEqual(['CURRENCY', 'MANAGER', 'DATE'])

        fireEvent.click(firstAddAll as HTMLButtonElement)

        await waitFor(() => {
            expect(getGroupOptionValues(firstAvailable as HTMLElement)).toEqual([])
            expect(getGroupOptionValues(firstSelected as HTMLElement)).toEqual([
                'MERCHANT',
                'PROJECT',
                'DATE',
                'ENDPOINT',
                'CARD_TYPE',
            ])
        })
        expect(getGroupOptionValues(secondAvailable as HTMLElement)).toEqual(['CURRENCY'])
        expect(getGroupOptionValues(secondSelected as HTMLElement)).toEqual(['MANAGER', 'DATE'])

        const firstClose = firstDialog.querySelector<HTMLButtonElement>('button[aria-label="Close"]')
        const secondClose = secondDialog.querySelector<HTMLButtonElement>('button[aria-label="Close"]')

        expect(firstClose).not.toBeNull()
        expect(secondClose).not.toBeNull()
        fireEvent.click(firstClose as HTMLButtonElement)

        await waitFor(() => {
            expect(getOwnedDialog('grouping-groups-first')).toBeNull()
            expect(firstTrigger.getAttribute('aria-expanded')).toBe('false')
        })
        expect(getOwnedDialog('grouping-groups-second')).toBe(secondDialog)
        expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
    })
})
