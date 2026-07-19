import {
    AbstractEntity,
    AutoCompleteChoiceWithStatus,
    Country,
    ensure,
    ExactCriterionSearchLabelEnum,
    OverlayHost,
    PneButton,
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
    PneTableSelectionCell,
    PneTableSelectionControls,
    PneTableSelectionHeaderCell,
    TableSelectionModel,
    TransactionSessionGroup,
} from '../index'
import React, { useMemo, useState } from 'react'
import {
    SearchParams,
    SearchUI,
    SearchUIView,
} from '../component/search-ui/SearchUI'
import { SearchUIFiltersConfig } from '../component/search-ui/filters/SearchUIFilters'
import {
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchUIConditions,
    TransactionSessionStatus,
    TransactionSessionStatuses,
} from '../component/search-ui/filters/types'
import { Meta, StoryObj } from '@storybook/react-webpack5'
import { SearchUIProvider } from '../component/search-ui/SearchUIProvider'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, IconButton, Tooltip } from '@mui/material'

type DataType = AbstractEntity

type TransactionSessionStatusesScenario = 'record' | 'missingOverride'

type HookWrapProps = {
    possibleCriteria?: CriterionTypeEnum[]
    predefinedCriteria?: CriterionTypeEnum[]
    config?: SearchUIFiltersConfig
    showVisaButton?: boolean
    settingsContextName?: string
    initialSearchConditions?: Partial<SearchUIConditions>
    transactionSessionStatusesScenario?: TransactionSessionStatusesScenario
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
        // enableTimeSelection: true,
        // dateOnlyTimeZone: 'Europe/Moscow',
    },
    // hideShowFiltersButton: true,
    // hideTemplatesSelect: true,
}

const ordersSearchAvailabilityConfig: SearchUIFiltersConfig = {
    manualSearch: true,
    criterionAvailabilityRules: [{
        criterion: CriterionTypeEnum.ORDERS_SEARCH,
        isAvailable: conditions => conditions.orderDateType === 'SESSION_STATUS_CHANGED',
    }],
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

const customerLevelMerchantCriterion: MultigetCriterion = {
    entityType: LinkedEntityTypeEnum.MERCHANT,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems: '42',
    selectedItemNames: 'Merchant 42',
    deselectedItems: '',
    deselectedItemNames: '',
}

const customerLevelStoryArgs = {
    possibleCriteria: [
        CriterionTypeEnum.CUSTOMER_LEVEL,
        CriterionTypeEnum.MERCHANT,
        CriterionTypeEnum.CURRENCY,
    ],
    predefinedCriteria: [CriterionTypeEnum.CUSTOMER_LEVEL],
    showVisaButton: false,
} satisfies HookWrapProps

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

const createTransactionSessionStatuses = (...displayNames: string[]): TransactionSessionStatus[] => (
    displayNames.map(displayName => ({
        displayName,
        selected: true,
    }))
)

const transactionSessionStatusesEntries: [TransactionSessionGroup, TransactionSessionStatus[]][] = [
    ['ALL', createTransactionSessionStatuses(
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
    )],
    ['APPROVED', createTransactionSessionStatuses('MOCK_ONE', 'MOCK_TWO')],
    ['PROCESSING', createTransactionSessionStatuses('THREE')],
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

type TableViewStoryId = 'summary' | 'operations' | 'risk'

type TableViewStoryRow = {
    id: string
    primary: string
    secondary: string
}

const tableViewStoryRows: Record<TableViewStoryId, TableViewStoryRow[]> = {
    summary: [
        {id: 'SUM-101', primary: 'Northwind', secondary: 'Ready'},
        {id: 'SUM-102', primary: 'Contoso', secondary: 'Review'},
    ],
    operations: [
        {id: 'OPS-201', primary: 'Settlement', secondary: 'Completed'},
        {id: 'OPS-202', primary: 'Payout', secondary: 'Processing'},
    ],
    risk: [
        {id: 'RSK-301', primary: 'Velocity alert', secondary: 'High'},
        {id: 'RSK-302', primary: 'Manual review', secondary: 'Medium'},
    ],
}

const createTableViewHeader = (primaryLabel: string, secondaryLabel: string) => () => (
    <PneTableRow>
        <PneHeaderTableCell>{'ID'}</PneHeaderTableCell>
        <PneHeaderTableCell>{primaryLabel}</PneHeaderTableCell>
        <PneHeaderTableCell>{secondaryLabel}</PneHeaderTableCell>
    </PneTableRow>
)

const createTableViewRow = (row: TableViewStoryRow) => (
    <PneTableRow key={row.id}>
        <PneTableCell>{row.id}</PneTableCell>
        <PneTableCell>{row.primary}</PneTableCell>
        <PneTableCell>{row.secondary}</PneTableCell>
    </PneTableRow>
)

const tableViewSettingsAction = <Tooltip title='View settings'>
    <IconButton
        aria-label='View settings'
        size='small'
        sx={{borderRadius: '4px', height: '40px', padding: '8px', width: '40px'}}
    >
        <SettingsOutlinedIcon sx={{height: '16px', width: '16px'}}/>
    </IconButton>
</Tooltip>

const tableViewStoryViews: readonly SearchUIView<TableViewStoryRow, TableViewStoryId>[] = [
    {
        id: 'summary',
        label: 'Summary',
        searchData: async () => tableViewStoryRows.summary,
        createTableHeader: createTableViewHeader('Account', 'State'),
        createTableRow: createTableViewRow,
        actions: tableViewSettingsAction,
        sortOnActivate: {sortColumnIndex: 1, sortAsc: true},
    },
    {
        id: 'operations',
        label: 'Operations',
        searchData: async () => tableViewStoryRows.operations,
        createTableHeader: createTableViewHeader('Operation', 'Status'),
        createTableRow: createTableViewRow,
        actions: tableViewSettingsAction,
        sortOnActivate: {sortColumnIndex: 2, sortAsc: false},
    },
    {
        id: 'risk',
        label: 'Risk',
        searchData: async () => tableViewStoryRows.risk,
        createTableHeader: createTableViewHeader('Signal', 'Severity'),
        createTableRow: createTableViewRow,
        actions: tableViewSettingsAction,
    },
]

const TableViewsWrap = ({duplicatePagination = true}: {duplicatePagination?: boolean}) => {
    const [value, setValue] = useState<TableViewStoryId>('summary')

    return <Box data-story-section='pne-ui-search-ui-table-views' sx={{backgroundColor: '#fff'}}>
        <SearchUI<TableViewStoryRow, TableViewStoryId>
            autoTestId='storybook-search-ui-table-views'
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
            }}
            possibleCriteria={[]}
            settingsContextName='storybook-search-ui-table-views'
            tableParams={{
                duplicatePagination,
                rowsPerPageOptions: [5, 10, 25],
                displayOptions: {pageSize: 5},
            }}
            tableViews={{
                'aria-label': 'Results view',
                onChange: setValue,
                value,
                views: tableViewStoryViews,
            }}
        />
    </Box>
}

const selectableTableViewStoryViews: readonly SearchUIView<
    TableViewStoryRow,
    TableViewStoryId,
    string
>[] = [
    {
        id: 'summary',
        label: 'Summary',
        searchData: async () => tableViewStoryRows.summary,
        createTableHeader: (_params, {selection} = {appliedSearchCriteria: null}) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!selection
                    || selection.interactionDisabled
                    || selection.pageSelectableCount === 0}
                onChange={checked => selection?.setPageSelected(checked)}
                state={selection?.pageState ?? 'none'}
            />
            <PneHeaderTableCell>ID</PneHeaderTableCell>
            <PneHeaderTableCell>Account</PneHeaderTableCell>
            <PneHeaderTableCell>State</PneHeaderTableCell>
        </PneTableRow>,
        createTableRow: (row, _index, _data, _setData, {selection} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow
            aria-selected={selection?.isRowSelected(row) ?? false}
            key={row.id}
            selected={selection?.isRowSelected(row) ?? false}
        >
            <PneTableSelectionCell
                aria-label={`Select ${row.id}`}
                autoTestValue={row.id}
                checked={selection?.isRowSelected(row) ?? false}
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setRowSelected(row, checked)}
            />
            <PneTableCell>{row.id}</PneTableCell>
            <PneTableCell>{row.primary}</PneTableCell>
            <PneTableCell>{row.secondary}</PneTableCell>
        </PneTableRow>,
        actions: tableViewSettingsAction,
        sortOnActivate: {sortColumnIndex: 1, sortAsc: true},
    },
    {
        id: 'operations',
        label: 'Operations',
        searchData: async () => tableViewStoryRows.operations,
        createTableHeader: (_params, {selection} = {appliedSearchCriteria: null}) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!selection
                    || selection.interactionDisabled
                    || selection.pageSelectableCount === 0}
                onChange={checked => selection?.setPageSelected(checked)}
                state={selection?.pageState ?? 'none'}
            />
            <PneHeaderTableCell>ID</PneHeaderTableCell>
            <PneHeaderTableCell>Operation</PneHeaderTableCell>
            <PneHeaderTableCell>Status</PneHeaderTableCell>
        </PneTableRow>,
        createTableRow: (row, _index, _data, _setData, {selection} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow
            aria-selected={selection?.isRowSelected(row) ?? false}
            key={row.id}
            selected={selection?.isRowSelected(row) ?? false}
        >
            <PneTableSelectionCell
                aria-label={`Select ${row.id}`}
                autoTestValue={row.id}
                checked={selection?.isRowSelected(row) ?? false}
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setRowSelected(row, checked)}
            />
            <PneTableCell>{row.id}</PneTableCell>
            <PneTableCell>{row.primary}</PneTableCell>
            <PneTableCell>{row.secondary}</PneTableCell>
        </PneTableRow>,
        actions: tableViewSettingsAction,
        sortOnActivate: {sortColumnIndex: 2, sortAsc: false},
    },
    {
        id: 'risk',
        label: 'Risk',
        searchData: async () => tableViewStoryRows.risk,
        createTableHeader: (_params, {selection} = {appliedSearchCriteria: null}) => <PneTableRow>
            <PneTableSelectionHeaderCell
                aria-label='Select current page'
                disabled={!selection
                    || selection.interactionDisabled
                    || selection.pageSelectableCount === 0}
                onChange={checked => selection?.setPageSelected(checked)}
                state={selection?.pageState ?? 'none'}
            />
            <PneHeaderTableCell>ID</PneHeaderTableCell>
            <PneHeaderTableCell>Signal</PneHeaderTableCell>
            <PneHeaderTableCell>Severity</PneHeaderTableCell>
        </PneTableRow>,
        createTableRow: (row, _index, _data, _setData, {selection} = {
            appliedSearchCriteria: null,
        }) => <PneTableRow
            aria-selected={selection?.isRowSelected(row) ?? false}
            key={row.id}
            selected={selection?.isRowSelected(row) ?? false}
        >
            <PneTableSelectionCell
                aria-label={`Select ${row.id}`}
                autoTestValue={row.id}
                checked={selection?.isRowSelected(row) ?? false}
                disabled={!selection || selection.interactionDisabled}
                onChange={checked => selection?.setRowSelected(row, checked)}
            />
            <PneTableCell>{row.id}</PneTableCell>
            <PneTableCell>{row.primary}</PneTableCell>
            <PneTableCell>{row.secondary}</PneTableCell>
        </PneTableRow>,
        actions: tableViewSettingsAction,
    },
]

const TableSelectionViewsWrap = () => {
    const [value, setValue] = useState<TableViewStoryId>('summary')
    const [selection, setSelection] = useState<TableSelectionModel<string>>({
        mode: 'explicit',
        selectedIds: new Set(),
    })

    return <Box
        data-story-section='pne-ui-search-ui-selection-views'
        sx={{backgroundColor: '#fff'}}
    >
        <SearchUI<TableViewStoryRow, TableViewStoryId, string>
            autoTestId='storybook-search-ui-selection-views'
            config={{
                hideShowFiltersButton: true,
                hideTemplatesSelect: true,
            }}
            possibleCriteria={[]}
            settingsContextName='storybook-search-ui-selection-views'
            tableParams={{
                duplicatePagination: true,
                rowsPerPageOptions: [5, 10, 25],
                displayOptions: {pageSize: 5},
            }}
            tableSelection={{
                getRowId: row => row.id,
                maxSelected: 10,
                onSelectionChange: setSelection,
                renderControls: ({selection: controller}) => (
                    <PneTableSelectionControls
                        actions={<>
                            <PneButton
                                disabled={controller.interactionDisabled}
                                onClick={() => {
                                    void controller.selectAllMatchingResults?.()
                                }}
                                pneStyle='text'
                                sx={{minHeight: '40px'}}
                            >
                                Выбрать все
                            </PneButton>
                            <PneButton
                                disabled={controller.interactionDisabled
                                    || controller.selectedCount === 0}
                                onClick={controller.clear}
                                pneStyle='text'
                                sx={{minHeight: '40px'}}
                            >
                                Отменить выбор
                            </PneButton>
                            <Box sx={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1}}>
                                <Box>Операции с выбранным</Box>
                                <PneButton pneStyle='outlined' sx={{minHeight: '40px'}}>
                                    Действия
                                </PneButton>
                            </Box>
                        </>}
                        status={controller.selectingAllMatching ? 'Selecting all results…' : undefined}
                        summary={`Выбрано шлюзов: ${controller.selectedCount}`}
                    />
                ),
                resolveAllMatchingCount: async ({viewId}) => (
                    viewId ? tableViewStoryRows[viewId].length : 0
                ),
                selection,
                toolbarAriaLabel: 'Result table controls',
            }}
            tableViews={{
                'aria-label': 'Results view',
                onChange: setValue,
                value,
                views: selectableTableViewStoryViews,
            }}
        />
    </Box>
}

const HookWrap = (props: HookWrapProps) => {

    const {
        possibleCriteria = defaultPossibleCriteria,
        predefinedCriteria = defaultPredefinedCriteria,
        config: storyConfig,
        showVisaButton = true,
        settingsContextName = 'context',
        initialSearchConditions: initialSearchConditionsOverride,
        transactionSessionStatusesScenario = 'record',
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

    const transactionSessionStatusesDefaults = useMemo(() => {
        if (transactionSessionStatusesScenario === 'missingOverride') {
            return {}
        }

        return {
            getTransactionSessionStatuses: async () => (
                Object.fromEntries(
                    transactionSessionStatusesEntries.map(([group, statuses]) => [
                        group,
                        statuses.map(status => ({ ...status })),
                    ]),
                ) as TransactionSessionStatuses
            ),
        }
    }, [transactionSessionStatusesScenario])

    return <OverlayHost>
        <SearchUIProvider
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
                getCustomerLevels: async ({ merchantId, currencyIds }) => {
                    const levels = [
                        {
                            level: { id: 1, displayName: `Regular (merchant ${merchantId})` },
                            currencyIds: [1, 2],
                        },
                        {
                            level: { id: 2, displayName: `VIP (merchant ${merchantId})` },
                            currencyIds: [1],
                        },
                    ]

                    return levels
                        .filter(item => currencyIds.length === 0
                            || item.currencyIds.some(currencyId => currencyIds.includes(currencyId)))
                        .map(item => item.level)
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
                        { choiceId: 1, displayName: 'Timeout', description: 'External code: 05' },
                        { choiceId: 2, displayName: 'Timeout', description: 'External code: 51' },
                        { choiceId: 99, displayName: 'Timeout', description: 'External code: 54' },
                    ]
                },
                ...transactionSessionStatusesDefaults,
            }}
        >
            {showVisaButton ? (
                <div style={{ marginBottom: 16 }}>
                    <PneButton
                        pneStyle='contained'
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
                settingsContextName={settingsContextName}
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
    </OverlayHost>
}

export default {
    title: 'pne-ui/SearchUI',
    component: HookWrap,
} as Meta<typeof HookWrap>

type Story = StoryObj<typeof HookWrap>

export const Default: Story = {
    args: {},
}

export const TableViews: Story = {
    render: () => <TableViewsWrap/>,
}

export const TableViewsBottomPaginationOnly: Story = {
    render: () => <TableViewsWrap duplicatePagination={false}/>,
}

export const TableSelectionAndViewsMobile360: Story = {
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
    play: ({canvasElement}) => {
        const topControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-top-controls"]',
        )
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )
        const paginationToolbar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-toolbar"]',
        )
        const tableControlBar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-control-bar"]',
        )
        const contextual = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-contextual-controls"]',
        )
        const persistent = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-persistent-controls"]',
        )
        const selectionControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="selection-controls"]',
        )
        const viewSelector = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-views"]',
        )
        const navigation = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-navigation"]',
        )
        const pageSizes = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-sizes"]',
        )

        if (!topControls
            || !actionBand
            || !paginationToolbar
            || !tableControlBar
            || !contextual
            || !persistent
            || !selectionControls
            || !viewSelector
            || !navigation
            || !pageSizes) {
            throw new Error('SearchUI Selection and View controls are missing at 360px')
        }

        for (const [name, element] of [
            ['top controls', topControls],
            ['pagination actions', actionBand],
            ['table control bar', tableControlBar],
            ['selection controls', selectionControls],
            ['view selector', viewSelector],
        ] as const) {
            if (element.scrollWidth > element.clientWidth) {
                throw new Error(`${name} overflow at the supported 360px viewport`)
            }
        }

        if (actionBand.dataset.autotestValue !== 'toolbar-stacked') {
            throw new Error('SearchUI table controls must sit above pagination at 360px')
        }
        if (tableControlBar.dataset.autotestValue !== 'stacked') {
            throw new Error('SearchUI Selection and View must use separate rows at 360px')
        }
        if (
            actionBand.children[0] !== paginationToolbar
            || actionBand.children[1] !== navigation
            || actionBand.children[2] !== pageSizes
        ) {
            throw new Error('SearchUI pagination DOM order must follow the mobile rows')
        }
        if (
            tableControlBar.children[0] !== contextual
            || tableControlBar.children[1] !== persistent
        ) {
            throw new Error('SearchUI Selection must precede View in DOM and keyboard order')
        }

        const contextualRect = contextual.getBoundingClientRect()
        const persistentRect = persistent.getBoundingClientRect()
        const navigationRect = navigation.getBoundingClientRect()
        if (contextualRect.top >= persistentRect.top || persistentRect.top >= navigationRect.top) {
            throw new Error('SearchUI mobile rows are not Selection, View, Pagination')
        }
    },
    render: () => <TableSelectionViewsWrap/>,
}

export const TableViewsMobile360: Story = {
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
    play: ({canvasElement}) => {
        const topControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-top-controls"]',
        )
        const viewSelector = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-views"]',
        )
        const topPagination = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination"][data-autotest-value="top"]',
        )
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )
        const navigation = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-navigation"]',
        )
        const paginationToolbar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-toolbar"]',
        )
        const pageSizes = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-sizes"]',
        )
        const settingsAction = canvasElement.querySelector<HTMLElement>(
            'button[aria-label="View settings"]',
        )

        if (
            !topControls
            || !topPagination
            || !actionBand
            || !navigation
            || !paginationToolbar
            || !pageSizes
            || !viewSelector
            || !settingsAction
        ) {
            throw new Error('Responsive table controls are missing from the 360px story')
        }

        for (const [name, element] of [
            ['top controls', topControls],
            ['top pagination', topPagination],
            ['pagination actions', actionBand],
            ['view selector', viewSelector],
        ] as const) {
            if (element.scrollWidth > element.clientWidth) {
                throw new Error(`${name} overflow at the supported 360px viewport`)
            }
        }

        if (actionBand.dataset.autotestValue !== 'toolbar-stacked') {
            throw new Error('The 360px layout must keep View above one pagination row')
        }

        if (
            actionBand.children[0] !== paginationToolbar
            || actionBand.children[1] !== navigation
            || actionBand.children[2] !== pageSizes
        ) {
            throw new Error('DOM and keyboard order must follow the two visual rows at 360px')
        }

        const actionBandRect = actionBand.getBoundingClientRect()
        const navigationRect = navigation.getBoundingClientRect()
        const toolbarRect = paginationToolbar.getBoundingClientRect()
        const pageSizesRect = pageSizes.getBoundingClientRect()

        if (toolbarRect.top >= navigationRect.top) {
            throw new Error('View controls must occupy the first row at 360px')
        }

        if (Math.abs(toolbarRect.right - actionBandRect.right) > 1) {
            throw new Error('View controls must be right-aligned at 360px')
        }

        if (Math.abs(navigationRect.top - pageSizesRect.top) > 1) {
            throw new Error('Navigation and page sizes must share the second row at 360px')
        }

        if (navigationRect.right > pageSizesRect.left) {
            throw new Error('Pagination groups must not overlap at 360px')
        }

        const settingsRect = settingsAction.getBoundingClientRect()
        if (settingsRect.width !== 40 || settingsRect.height !== 40) {
            throw new Error('View settings must match the 40x40px pagination controls at 360px')
        }
    },
    render: () => <TableViewsWrap/>,
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

export const ManualSearch: Story = {
    args: {
        possibleCriteria: defaultPossibleCriteria,
        predefinedCriteria: defaultPredefinedCriteria,
        config: {
            manualSearch: true,
            removablePredefinedCriteria: [CriterionTypeEnum.DATE_RANGE],
        },
        showVisaButton: false,
    },
}

export const ConditionalOrdersSearch: Story = {
    args: {
        possibleCriteria: [
            CriterionTypeEnum.CARD_TYPES,
            CriterionTypeEnum.CURRENCY,
            CriterionTypeEnum.TRANSACTION_TYPES,
        ],
        predefinedCriteria: [
            CriterionTypeEnum.DATE_RANGE_ORDERS,
            CriterionTypeEnum.ORDERS_SEARCH,
        ],
        config: ordersSearchAvailabilityConfig,
        showVisaButton: false,
        initialSearchConditions: {
            ordersSearchValue: 'invoice-1',
        },
    },
}

export const CustomerLevel: Story = {
    args: {
        ...customerLevelStoryArgs,
        settingsContextName: 'storybook-customer-level-select-merchant',
    },
    parameters: {
        docs: {
            description: {
                story: 'Customer Level stays disabled until exactly one merchant is selected.',
            },
        },
    },
}

export const CustomerLevelWithOptions: Story = {
    args: {
        ...customerLevelStoryArgs,
        settingsContextName: 'storybook-customer-level-with-options',
        initialSearchConditions: {
            multigetCriteria: [customerLevelMerchantCriterion],
            currencies: {
                all: false,
                entities: [{ id: 1, displayName: 'USD' }],
            },
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Merchant 42 and USD load the Regular and VIP customer levels.',
            },
        },
    },
}

export const CustomerLevelWithoutOptions: Story = {
    args: {
        ...customerLevelStoryArgs,
        settingsContextName: 'storybook-customer-level-without-options',
        initialSearchConditions: {
            multigetCriteria: [customerLevelMerchantCriterion],
            currencies: {
                all: false,
                entities: [{ id: 99, displayName: 'BBB' }],
            },
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Merchant 42 has no customer levels for BBB, so the empty-state placeholder is shown.',
            },
        },
    },
}

export const TransactionSessionStatusRecord: Story = {
    args: {
        possibleCriteria: [CriterionTypeEnum.TRANSACTION_SESSION_STATUS],
        predefinedCriteria: [],
        showVisaButton: false,
        transactionSessionStatusesScenario: 'record',
    },
}

export const TransactionSessionStatusMissingOverride: Story = {
    args: {
        possibleCriteria: [CriterionTypeEnum.TRANSACTION_SESSION_STATUS],
        predefinedCriteria: [],
        showVisaButton: false,
        transactionSessionStatusesScenario: 'missingOverride',
    },
}
