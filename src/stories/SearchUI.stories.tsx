import {
    AbstractEntity,
    AutoCompleteChoiceWithStatus,
    Country,
    ensure,
    ExactCriterionSearchLabelEnum,
    PneButton,
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
    TransactionSessionGroup,
} from '../index'
import React, { useMemo, useState } from 'react'
import { SearchParams, SearchUI } from '../component/search-ui/SearchUI'
import { SearchUIFiltersConfig } from '../component/search-ui/filters/SearchUIFilters'
import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIConditions,
} from '../component/search-ui/filters/types'
import { Meta, StoryObj } from '@storybook/react'
import { SearchUIProvider } from '../component/search-ui/SearchUIProvider'

type DataType = AbstractEntity

type HookWrapProps = {
    possibleCriteria?: CriterionTypeEnum[]
    predefinedCriteria?: CriterionTypeEnum[]
    config?: SearchUIFiltersConfig
    showVisaButton?: boolean
    initialSearchConditions?: Partial<SearchUIConditions>
}

const defaultPossibleCriteria: CriterionTypeEnum[] = [
    CriterionTypeEnum.ORDERS_SEARCH,
    CriterionTypeEnum.TRANSACTION_TYPES,
    CriterionTypeEnum.TRANSACTION_STATUS,
    CriterionTypeEnum.ERROR_CODE,
    CriterionTypeEnum.CARD_TYPES,
    CriterionTypeEnum.COUNTRIES,
    CriterionTypeEnum.STATUS,
    CriterionTypeEnum.DATE_RANGE_ORDERS,
    CriterionTypeEnum.PROJECT_CURRENCY,
    CriterionTypeEnum.GATE,
    CriterionTypeEnum.GROUPING,
    CriterionTypeEnum.DATE_RANGE,
]

const defaultPredefinedCriteria: CriterionTypeEnum[] = [
    CriterionTypeEnum.DATE_RANGE,
]

const defaultFiltersConfig: SearchUIFiltersConfig = {
    dateRange: {
        enableTimeSelection: true,
    },
    // hideShowFiltersButton: true,
    // hideTemplatesSelect: true,
}

const criterionToLinkedEntityMap: Partial<Record<CriterionTypeEnum, LinkedEntityTypeEnum>> = {
    [CriterionTypeEnum.PROJECT]: LinkedEntityTypeEnum.PROJECT,
    [CriterionTypeEnum.ENDPOINT]: LinkedEntityTypeEnum.ENDPOINT,
    [CriterionTypeEnum.GATE]: LinkedEntityTypeEnum.GATE,
    [CriterionTypeEnum.PROCESSOR]: LinkedEntityTypeEnum.PROCESSOR,
    [CriterionTypeEnum.COMPANY]: LinkedEntityTypeEnum.COMPANY,
    [CriterionTypeEnum.MANAGER]: LinkedEntityTypeEnum.MANAGER,
    [CriterionTypeEnum.MERCHANT]: LinkedEntityTypeEnum.MERCHANT,
    [CriterionTypeEnum.RESELLER]: LinkedEntityTypeEnum.RESELLER,
    [CriterionTypeEnum.DEALER]: LinkedEntityTypeEnum.DEALER,
}

const createInitialMultigetCriterion = (criterion: CriterionTypeEnum): MultigetCriterion | null => {
    const entityType = criterionToLinkedEntityMap[criterion]
    if (!entityType) {
        return null
    }

    return {
        entityType,
        filterType: MultichoiceFilterTypeEnum.NONE,
        searchString: '',
        selectedItems: '',
        selectedItemNames: '',
        deselectedItems: '',
        deselectedItemNames: '',
    }
}

const allFiltersStoryPredefinedCriteria: CriterionTypeEnum[] = [
    CriterionTypeEnum.EXACT,
    CriterionTypeEnum.ORDERS_SEARCH,
    CriterionTypeEnum.CURRENCY,
    CriterionTypeEnum.STATUS,
    CriterionTypeEnum.DATE_RANGE,
    CriterionTypeEnum.DATE_RANGE_ORDERS,
    CriterionTypeEnum.PROJECT_CURRENCY,
    CriterionTypeEnum.GROUPING,
    CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE,
    CriterionTypeEnum.ERROR_CODE,
    CriterionTypeEnum.TRANSACTION_SESSION_STATUS,
    CriterionTypeEnum.GATE,
]

const allFiltersStoryPossibleCriteria: CriterionTypeEnum[] = [
    ...allFiltersStoryPredefinedCriteria,
    CriterionTypeEnum.COUNTRIES,
]

const mockGateEntities: AbstractEntity[] = [
    { id: 1, displayName: '(1) name1' },
    { id: 2, displayName: '(2) name2' },
    { id: 3, displayName: '(3) name3asdasdasd asd asdasd a sasdasdasdasdasdasd' },
    { id: 4, displayName: '(4) name1' },
    { id: 5, displayName: '(5) name2' },
    { id: 6, displayName: '(6) name3' },
    { id: 7, displayName: '(7) name1' },
    { id: 8, displayName: '(8) name2' },
    { id: 9, displayName: '(9) name3' },
    { id: 10, displayName: '(10) name1' },
    { id: 11, displayName: '(11) name2' },
]

const allFiltersGateSelection = mockGateEntities.slice(0, 10)
const allFiltersGateSelectedIds = allFiltersGateSelection.map(item => item.id).join(',')
const allFiltersGateSelectedNames = allFiltersGateSelection.map(item => item.displayName).join(',')

const allFiltersInitialSearchConditions: Partial<SearchUIConditions> = {
    multigetCriteria: allFiltersStoryPredefinedCriteria
        .map(createInitialMultigetCriterion)
        .filter((criterion): criterion is MultigetCriterion => criterion !== null)
        .map(criterion => {
            if (criterion.entityType === LinkedEntityTypeEnum.GATE) {
                return {
                    ...criterion,
                    filterType: MultichoiceFilterTypeEnum.NONE,
                    selectedItems: allFiltersGateSelectedIds,
                    selectedItemNames: allFiltersGateSelectedNames,
                }
            }
            return criterion
        }),
    currencies: {
        all: false,
        entities: [
            { id: 1, displayName: 'USD' },
            { id: 2, displayName: 'RUB' },
        ],
    },
}

class Service {

    static async getList(searchParams: SearchParams): Promise<DataType[]> {
        console.log('getList call:\n' + JSON.stringify(searchParams, null, 4))
        let data: DataType[] = []
        for (let i = 1; i <= 999; i++) {
            data.push({ id: i, displayName: 'John ' + i })
        }
        await new Promise(resolve => setTimeout(resolve, 400))

        if (searchParams.multigetCriteria.length) {
            data = data.filter(item => {
                const ids = searchParams.multigetCriteria[0].selectedItems.split(',')
                return ids.some(some => +some === item.id)
            })
        }

        if (searchParams.exactSearchValue) {
            data = data.filter(item => {
                if (searchParams.exactSearchLabel === ExactCriterionSearchLabelEnum.ID) {
                    return item.id === +ensure(searchParams.exactSearchValue)
                } else if (searchParams.exactSearchLabel === ExactCriterionSearchLabelEnum.NAME) {
                    return item.displayName.includes(searchParams.exactSearchValue || '')
                } else {
                    return true
                }
            })
        }

        const dataSlice = data.slice(
            searchParams.startNum,
            searchParams.startNum + searchParams.rowCount,
        )
        return dataSlice
    }

}

const HookWrap = (props: HookWrapProps) => {

    const {
        possibleCriteria = defaultPossibleCriteria,
        predefinedCriteria = defaultPredefinedCriteria,
        config: storyConfig,
        showVisaButton = true,
        initialSearchConditions: initialSearchConditionsOverride,
    } = props

    const initialMultigetCriteria = useMemo<MultigetCriterion[]>(() => (
        predefinedCriteria
            .map(createInitialMultigetCriterion)
            .filter((criterion): criterion is MultigetCriterion => criterion !== null)
    ), [predefinedCriteria])

    const initialSearchConditions = useMemo(() => {
        const base = {
            multigetCriteria: initialMultigetCriteria.map(criterion => ({ ...criterion })),
        }

        if (!initialSearchConditionsOverride) {
            return base
        }

        const override: Partial<SearchUIConditions> = {
            ...initialSearchConditionsOverride,
        }

        if (override.multigetCriteria) {
            override.multigetCriteria = override.multigetCriteria.map(criterion => ({ ...criterion }))
        }

        if (override.currencies) {
            override.currencies = {
                all: override.currencies.all,
                entities: override.currencies.entities?.map(entity => ({ ...entity })),
            }
        }

        return {
            ...base,
            ...override,
        }
    }, [initialMultigetCriteria, initialSearchConditionsOverride])

    const [data, setData] = useState<DataType[]>([])
    const [searchConditions, setSearchConditions] = useState<Partial<SearchUIConditions>>({})

    const visaCardType = useMemo<AbstractEntity>(() => ({
        id: 1,
        displayName: 'VISA',
    }), [])

    const filtersConfig = useMemo<SearchUIFiltersConfig>(() => {
        const override: SearchUIFiltersConfig = storyConfig ?? {}
        return {
            ...defaultFiltersConfig,
            ...override,
            dateRange: {
                ...(defaultFiltersConfig.dateRange || {}),
                ...(override.dateRange || {}),
            },
        }
    }, [storyConfig])

    const onAddVisaCardType = () => {
        setSearchConditions({
            criteria: [CriterionTypeEnum.CARD_TYPES],
            cardTypes: {
                all: false,
                entities: [visaCardType],
            },
        })
    }

    return <SearchUIProvider
        defaults={{
            getDefaultCurrency: (): AbstractEntity => ({
                id: 99,
                displayName: 'BBB',
            }),
            getMatchLinkedItems: async () => {
                await new Promise(resolve => setTimeout(resolve, 400))

                return mockGateEntities
            },
            getCountries: async () => {
                return [
                    { id: 1, displayName: 'Russia', theCode: 'RU', theCode3: 'RUS' },
                    { id: 2, displayName: 'Not Russia', theCode: 'XX', theCode3: 'XXX' },
                ] satisfies Country[]
            },
            getCurrencies: async () => {
                return [
                    { id: 1, displayName: 'USD' },
                    { id: 2, displayName: 'RUB' },
                    { id: 99, displayName: 'BBB' },
                ]
            },
            getCardTypes: async () => {
                return [
                    visaCardType,
                    { id: 2, displayName: 'MASTERCARD' },
                    { id: 99, displayName: 'UNIONPAY' },
                ]
            },
            getProjectAvailableCurrencies: async () => {
                return [
                    { choiceId: 1, displayName: 'USD', description: '', status: 'E' },
                    { choiceId: 2, displayName: 'RUB', description: '', status: 'E' },
                    { choiceId: 99, displayName: 'BBB', description: '', status: 'E' },
                ] satisfies AutoCompleteChoiceWithStatus[]
            },
            showGatesCriterion: () => true,
            showProjectsCriterion: () => true,
            getProcessorLogEntryTypes: async () => {
                return [
                    { id: 1, displayName: 'One' },
                    { id: 2, displayName: 'Second' },
                    { id: 99, displayName: '33333' },
                ]
            },
            getTransactionTypes: async () => {
                return [
                    { id: 1, displayName: 'One' },
                    { id: 2, displayName: 'Second' },
                    { id: 99, displayName: '33333' },
                ]
            },
            getTransactionStatuses: async () => {
                return [
                    { id: 1, displayName: 'One' },
                    { id: 2, displayName: 'Second' },
                    { id: 99, displayName: '33333' },
                ]
            },
            getTransactionMarkerTypes: async () => {
                return [
                    { id: 1, displayName: 'Fraud alerts' },
                    { id: 2, displayName: 'Manual review' },
                    { id: 3, displayName: 'Auto' },
                ]
            },
            getRecurringPaymentTypes: async () => {
                return [
                    { id: 1, displayName: 'Subscription' },
                    { id: 2, displayName: 'Installment' },
                ]
            },
            getRecurringPaymentStatuses: async () => {
                return [
                    { id: 1, displayName: 'Active' },
                    { id: 2, displayName: 'Paused' },
                    { id: 3, displayName: 'Cancelled' },
                ]
            },
            getMFOTypes: async () => {
                return [
                    { id: 1, displayName: 'MFO type 1' },
                    { id: 2, displayName: 'MFO type 2' },
                ]
            },
            searchErrorCodes: async request => {
                return [
                    { choiceId: 1, displayName: 'Code 1', description: 'd' },
                    { choiceId: 2, displayName: 'Code 2', description: 'd' },
                    { choiceId: 99, displayName: 'Code 3', description: 'd' },
                ]
            },
            getTransactionSessionStatuses: async () => {
                return new Map<TransactionSessionGroup, string[]>([
                    ['ALL', [
                        'MOCK_ONE',
                        'MOCK_TWO',
                        'CLONE1',
                        'CLONE2',
                        'CLONE3',
                        'CLONE4',
                        'CLONE5',
                        'CLONE6',
                        'CLONE7',
                        'CLONE8',
                        'CLONE9',
                        'CLONE10',
                        'CLONE11',
                        'CLONE12',
                        'CLONE13',
                        'CLONE14',
                        'CLONE15',
                        'THREE',
                    ]],
                    ['APPROVED', ['MOCK_ONE', 'MOCK_TWO']],
                    ['PROCESSING', ['THREE']],
                ])
            },
        }}
    >
        {showVisaButton ? (
            <div style={{ marginBottom: 16 }}>
                <PneButton
                    variant={'contained'}
                    color={'primary'}
                    size={'small'}
                    onClick={onAddVisaCardType}
                >
                    {'Apply VISA card filter'}
                </PneButton>
            </div>
        ) : null}
        <SearchUI<DataType>
            tableParams={{
                duplicatePagination: true,
                rowsPerPageOptions: [1, 5, 8],
                displayOptions: {
                    pageSize: 5,
                    // sortAsc: true,
                    // sortColumnIndex: 1
                },
            }}
            settingsContextName={'context'}
            exactSearchLabels={[
                // ExactCriterionSearchLabelEnum.ALL,
                ExactCriterionSearchLabelEnum.ID,
                ExactCriterionSearchLabelEnum.NAME,
            ]}
            possibleCriteria={possibleCriteria}
            predefinedCriteria={predefinedCriteria}
            config={filtersConfig}
            searchData={(searchParams) => {
                console.log(JSON.stringify({
                    searchLabel: searchParams.exactSearchLabel,
                    searchString: searchParams.exactSearchValue,
                    orderDateType: searchParams.orderDateType,
                    processorLogEntryType: searchParams.processorLogEntryType,
                }, null, 4))
                return Service.getList(searchParams)
            }}
            dataUseState={[data, setData]}
            initialSearchConditions={initialSearchConditions}
            searchConditions={searchConditions}
            createTableHeader={(headerParams) =>
                <PneTableRow>
                    <PneHeaderTableCell>{'header1'}</PneHeaderTableCell>
                    <PneHeaderTableCell>{'header2'}</PneHeaderTableCell>
                </PneTableRow>
            }
            createTableRow={(item) =>
                <PneTableRow key={item.id}>
                    <PneTableCell>{item.id}</PneTableCell>
                    <PneTableCell>{item.displayName}</PneTableCell>
                </PneTableRow>
            }
        />
    </SearchUIProvider>
}

export default {
    title: 'pne-ui/SearchUI',
    component: HookWrap,
} as Meta<typeof HookWrap>

type Story = StoryObj<typeof HookWrap>

export const Default: Story = {
    args: {},
}

export const AllFilters: Story = {
    args: {
        possibleCriteria: allFiltersStoryPossibleCriteria,
        predefinedCriteria: allFiltersStoryPredefinedCriteria,
        config: {
            removablePredefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
        },
        showVisaButton: false,
        initialSearchConditions: allFiltersInitialSearchConditions,
    },
}
