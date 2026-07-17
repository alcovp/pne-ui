import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    AbstractEntity,
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIDefaults,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

type MultigetMatrixEntry = {
    criterionType: CriterionTypeEnum
    entityType: LinkedEntityTypeEnum
    hasOnlyEnabled: boolean
    hasSearchLabels: boolean
}

type GetMatchLinkedItemsRequest = Parameters<SearchUIDefaults['getMatchLinkedItems']>[0]

const multigetMatrix = [
    {
        criterionType: CriterionTypeEnum.PROJECT,
        entityType: LinkedEntityTypeEnum.PROJECT,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.ENDPOINT,
        entityType: LinkedEntityTypeEnum.ENDPOINT,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.GATE,
        entityType: LinkedEntityTypeEnum.GATE,
        hasOnlyEnabled: true,
        hasSearchLabels: true,
    },
    {
        criterionType: CriterionTypeEnum.PROCESSOR,
        entityType: LinkedEntityTypeEnum.PROCESSOR,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.COMPANY,
        entityType: LinkedEntityTypeEnum.COMPANY,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.MANAGER,
        entityType: LinkedEntityTypeEnum.MANAGER,
        hasOnlyEnabled: false,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.MERCHANT,
        entityType: LinkedEntityTypeEnum.MERCHANT,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.RESELLER,
        entityType: LinkedEntityTypeEnum.RESELLER,
        hasOnlyEnabled: true,
        hasSearchLabels: false,
    },
    {
        criterionType: CriterionTypeEnum.DEALER,
        entityType: LinkedEntityTypeEnum.DEALER,
        hasOnlyEnabled: false,
        hasSearchLabels: false,
    },
] as const satisfies readonly MultigetMatrixEntry[]

const createCriterion = (entityType: LinkedEntityTypeEnum): MultigetCriterion => ({
    entityType,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems: '',
    selectedItemNames: '',
    deselectedItems: '',
    deselectedItemNames: '',
})

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

const getOwnedPanel = (
    scope: string,
    criterionType: CriterionTypeEnum,
): HTMLElement | null => document.body.querySelector<HTMLElement>(
    '[role="dialog"][data-autotest="criterion-multiget-panel"]'
    + `[data-autotest-value="${scope}"]`
    + `[data-autotest-criterion="${criterionType}"]`,
)

describe('SearchUI multiget criterion matrix', () => {
    beforeEach(() => {
        localStorage.clear()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                addListener: jest.fn(),
                removeListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        })
    })

    it('maps all nine criterion owners and conditional controls to their entity requests', async () => {
        const scope = 'multiget-matrix'
        const initialCriteria = multigetMatrix.map(({entityType}) => createCriterion(entityType))
        const getMatchLinkedItems = jest.fn(
            async (_request: GetMatchLinkedItemsRequest): Promise<AbstractEntity[]> => [],
        )
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider
                defaults={{
                    getSearchTemplates: neverResolves,
                    getMatchLinkedItems,
                }}
            >
                <SearchUIFilters
                    autoTestId={scope}
                    settingsContextName={`${scope}-context`}
                    possibleCriteria={multigetMatrix.map(({criterionType}) => criterionType)}
                    predefinedCriteria={multigetMatrix.map(({criterionType}) => criterionType)}
                    initialSearchConditions={{multigetCriteria: initialCriteria}}
                    onFiltersUpdate={onFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalledWith(expect.objectContaining({
                multigetCriteria: initialCriteria,
            }))
        })

        const filters = container.querySelector<HTMLElement>(
            `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
        )

        expect(filters).not.toBeNull()
        expect(Array.from(
            filters?.querySelectorAll<HTMLElement>('[data-autotest="criterion"]') ?? [],
            criterion => criterion.getAttribute('data-autotest-value'),
        ).sort()).toEqual(multigetMatrix.map(({criterionType}) => criterionType).sort())

        for (const entry of multigetMatrix) {
            getMatchLinkedItems.mockClear()

            const criterion = filters?.querySelector<HTMLElement>(
                `[data-autotest="criterion"][data-autotest-value="${entry.criterionType}"]`,
            )
            const trigger = criterion?.querySelector<HTMLButtonElement>(
                'button[data-autotest="criterion-multiget-trigger"]',
            )

            expect(criterion).not.toBeNull()
            expect(trigger).not.toBeNull()
            expect(trigger?.getAttribute('data-autotest-value')).toBe(MultichoiceFilterTypeEnum.NONE)

            fireEvent.click(trigger as HTMLButtonElement)

            await waitFor(() => {
                expect(getOwnedPanel(scope, entry.criterionType)).not.toBeNull()
                expect(getMatchLinkedItems).toHaveBeenCalled()
            })

            const panel = getOwnedPanel(scope, entry.criterionType) as HTMLElement
            const request = getMatchLinkedItems.mock.calls.at(-1)?.[0]
            const modeButtons = Array.from(panel.querySelectorAll<HTMLButtonElement>(
                'button[data-autotest="criterion-multiget-mode"]',
            ))
            const searchLabels = Array.from(panel.querySelectorAll<HTMLButtonElement>(
                'button[data-autotest="criterion-multiget-search-label"]',
            ))
            const onlyEnabled = panel.querySelectorAll<HTMLInputElement>(
                'input[data-autotest="criterion-multiget-only-enabled"]',
            )
            const search = panel.querySelector<HTMLInputElement>(
                'input[data-autotest="criterion-multiget-search"]',
            )

            expect(trigger?.getAttribute('aria-expanded')).toBe('true')
            expect(trigger?.getAttribute('aria-controls')).toBe(panel.id)
            expect(request?.type).toBe(entry.entityType)
            expect(request?.criteria.map(criterion => criterion.entityType).sort()).toEqual(
                initialCriteria
                    .filter(criterion => criterion.entityType !== entry.entityType)
                    .map(criterion => criterion.entityType)
                    .sort(),
            )
            expect(modeButtons.map(button => button.getAttribute('data-autotest-value'))).toEqual([
                MultichoiceFilterTypeEnum.NONE,
                MultichoiceFilterTypeEnum.ALL,
            ])
            expect(modeButtons.map(button => button.getAttribute('aria-pressed'))).toEqual([
                'true',
                'false',
            ])
            expect(onlyEnabled).toHaveLength(entry.hasOnlyEnabled ? 1 : 0)
            expect(search).not.toBeNull()
            expect(search?.type).toBe('text')
            expect(search?.value).toBe('')
            expect(searchLabels.map(button => button.getAttribute('data-autotest-value'))).toEqual(
                entry.hasSearchLabels ? ['all', 'mid', 'descriptor'] : [],
            )
            if (entry.hasSearchLabels) {
                expect(searchLabels.map(button => button.getAttribute('aria-pressed'))).toEqual([
                    'true',
                    'false',
                    'false',
                ])
            }

            const close = panel.querySelector<HTMLButtonElement>(
                'button[data-autotest="criterion-multiget-close"]',
            )

            expect(close).not.toBeNull()
            fireEvent.click(close as HTMLButtonElement)

            await waitFor(() => {
                expect(getOwnedPanel(scope, entry.criterionType)).toBeNull()
            })
        }
    })
})
