import * as React from 'react'
import {render, waitFor} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    CriterionTypeEnum,
    ExactCriterionSearchLabelEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIFilters,
    SearchUIProvider,
} from '../src'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

type CriterionContractFamily =
    | 'collection'
    | 'date'
    | 'dependent'
    | 'enum'
    | 'grouping'
    | 'input'
    | 'multiget'
    | 'processor-log'
    | 'session-status'

type CriterionContract = {
    family: CriterionContractFamily
    selector: string
}

const collectionContract: CriterionContract = {
    family: 'collection',
    selector: '[role="combobox"][data-autotest="criterion-collection"]',
}
const enumAnyContract: CriterionContract = {
    family: 'enum',
    selector: '[role="button"][data-autotest="criterion-option"]'
        + '[data-autotest-value="ANY"][aria-pressed="true"]',
}
const multigetContract: CriterionContract = {
    family: 'multiget',
    selector: 'button[data-autotest="criterion-multiget-trigger"]'
        + '[data-autotest-value="NONE"][aria-haspopup="dialog"][aria-expanded="false"]',
}

const criterionContracts = {
    [CriterionTypeEnum.EXACT]: {
        family: 'input',
        selector: 'input[data-autotest="criterion-input"]',
    },
    [CriterionTypeEnum.ORDERS_SEARCH]: {
        family: 'input',
        selector: 'button[role="combobox"][data-autotest="criterion-label"]',
    },
    [CriterionTypeEnum.CURRENCY]: collectionContract,
    [CriterionTypeEnum.CUSTOMER_LEVEL]: {
        family: 'dependent',
        selector: '[role="combobox"][data-autotest="criterion-customer-level"]',
    },
    [CriterionTypeEnum.THREE_D]: enumAnyContract,
    [CriterionTypeEnum.STATUS]: enumAnyContract,
    [CriterionTypeEnum.MERCHANT]: multigetContract,
    [CriterionTypeEnum.ENDPOINT]: multigetContract,
    [CriterionTypeEnum.RESELLER]: multigetContract,
    [CriterionTypeEnum.PROCESSOR]: multigetContract,
    [CriterionTypeEnum.MANAGER]: multigetContract,
    [CriterionTypeEnum.PROJECT]: multigetContract,
    [CriterionTypeEnum.COMPANY]: multigetContract,
    [CriterionTypeEnum.GATE]: multigetContract,
    [CriterionTypeEnum.DEALER]: multigetContract,
    [CriterionTypeEnum.DATE_RANGE]: {
        family: 'date',
        selector: '[role="combobox"][data-autotest="criterion-range-spec"]',
    },
    [CriterionTypeEnum.DATE_RANGE_ORDERS]: {
        family: 'date',
        selector: '[role="combobox"][data-autotest="criterion-order-date-type"]',
    },
    [CriterionTypeEnum.PROJECT_CURRENCY]: {
        family: 'dependent',
        selector: '[role="combobox"][data-autotest="criterion-project-currency"]',
    },
    [CriterionTypeEnum.CARD_TYPES]: collectionContract,
    [CriterionTypeEnum.COUNTRIES]: collectionContract,
    [CriterionTypeEnum.GROUPING]: {
        family: 'grouping',
        selector: 'button[data-autotest="criterion-grouping-groups"]'
            + '[aria-haspopup="dialog"][aria-expanded="false"]',
    },
    [CriterionTypeEnum.TRANSACTION_TYPES]: collectionContract,
    [CriterionTypeEnum.TRANSACTION_STATUS]: collectionContract,
    [CriterionTypeEnum.RECURRENCE_TYPE]: collectionContract,
    [CriterionTypeEnum.RECURRENCE_STATUS]: collectionContract,
    [CriterionTypeEnum.MFO_CONFIGURATION_TYPE]: collectionContract,
    [CriterionTypeEnum.MARKER_TYPE]: collectionContract,
    [CriterionTypeEnum.MARKER_STATUS]: {
        family: 'enum',
        selector: '[role="button"][data-autotest="criterion-option"]'
            + '[data-autotest-value="any"][aria-pressed="true"]',
    },
    [CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE]: {
        family: 'processor-log',
        selector: '[role="combobox"][data-autotest="criterion-processor-log-entry-type"]',
    },
    [CriterionTypeEnum.ERROR_CODE]: {
        family: 'dependent',
        selector: 'input[role="combobox"][data-autotest="criterion-error-code"]',
    },
    [CriterionTypeEnum.TRANSACTION_SESSION_STATUS]: {
        family: 'session-status',
        selector: 'button[data-autotest="criterion-transaction-session-status"]'
            + '[data-autotest-value="APPROVED"][aria-haspopup="dialog"]',
    },
} satisfies Record<CriterionTypeEnum, CriterionContract>

type MultigetCriterionType =
    | CriterionTypeEnum.PROJECT
    | CriterionTypeEnum.ENDPOINT
    | CriterionTypeEnum.GATE
    | CriterionTypeEnum.PROCESSOR
    | CriterionTypeEnum.COMPANY
    | CriterionTypeEnum.MANAGER
    | CriterionTypeEnum.MERCHANT
    | CriterionTypeEnum.RESELLER
    | CriterionTypeEnum.DEALER

const multigetEntityByCriterion = {
    [CriterionTypeEnum.PROJECT]: LinkedEntityTypeEnum.PROJECT,
    [CriterionTypeEnum.ENDPOINT]: LinkedEntityTypeEnum.ENDPOINT,
    [CriterionTypeEnum.GATE]: LinkedEntityTypeEnum.GATE,
    [CriterionTypeEnum.PROCESSOR]: LinkedEntityTypeEnum.PROCESSOR,
    [CriterionTypeEnum.COMPANY]: LinkedEntityTypeEnum.COMPANY,
    [CriterionTypeEnum.MANAGER]: LinkedEntityTypeEnum.MANAGER,
    [CriterionTypeEnum.MERCHANT]: LinkedEntityTypeEnum.MERCHANT,
    [CriterionTypeEnum.RESELLER]: LinkedEntityTypeEnum.RESELLER,
    [CriterionTypeEnum.DEALER]: LinkedEntityTypeEnum.DEALER,
} satisfies Record<MultigetCriterionType, LinkedEntityTypeEnum>

const createMultigetCriterion = (entityType: LinkedEntityTypeEnum): MultigetCriterion => ({
    entityType,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems: '',
    selectedItemNames: '',
    deselectedItems: '',
    deselectedItemNames: '',
})

const neverResolves = <T,>(): Promise<T> => new Promise(() => undefined)

describe('SearchUI 31-of-31 criterion contract', () => {
    beforeEach(() => {
        localStorage.clear()
        resetSearchUIRetentionForTests()
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

    afterEach(() => {
        resetSearchUIRetentionForTests()
    })

    it('renders one typed meaningful locator contract for every enum value', async () => {
        const criterionTypes = Object.values(CriterionTypeEnum)
        const initialMultigetCriteria = Object.values(multigetEntityByCriterion)
            .map(createMultigetCriterion)
        const onFiltersUpdate = jest.fn()
        const {container} = render(
            <SearchUIProvider defaults={{getSearchTemplates: neverResolves}}>
                <SearchUIFilters
                    autoTestId="criterion-contract"
                    settingsContextName="criterion-contract-context"
                    possibleCriteria={criterionTypes}
                    predefinedCriteria={criterionTypes}
                    exactSearchLabels={[ExactCriterionSearchLabelEnum.ID]}
                    initialSearchConditions={{multigetCriteria: initialMultigetCriteria}}
                    onFiltersUpdate={onFiltersUpdate}
                    config={{
                        hideShowFiltersButton: true,
                        hideTemplatesSelect: true,
                    }}
                />
            </SearchUIProvider>,
        )

        await waitFor(() => {
            expect(onFiltersUpdate).toHaveBeenCalled()
            expect(container.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(31)
        })

        expect(criterionTypes).toHaveLength(31)
        expect(Object.keys(criterionContracts).sort()).toEqual([...criterionTypes].sort())

        const filters = container.querySelector<HTMLElement>(
            '[data-autotest="search-filters"][data-autotest-value="criterion-contract"]',
        )
        const renderedCriterionTypes = Array.from(
            filters?.querySelectorAll<HTMLElement>('[data-autotest="criterion"]') ?? [],
            criterion => criterion.getAttribute('data-autotest-value'),
        )

        expect(renderedCriterionTypes.sort()).toEqual([...criterionTypes].sort())

        for (const criterionType of criterionTypes) {
            const criterion = filters?.querySelector<HTMLElement>(
                `[data-autotest="criterion"][data-autotest-value="${criterionType}"]`,
            )
            const contract = criterionContracts[criterionType]

            expect(criterion).not.toBeNull()
            expect(criterion?.querySelectorAll(contract.selector)).toHaveLength(1)
        }
    })
})
