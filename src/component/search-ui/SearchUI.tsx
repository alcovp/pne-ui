import React, { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { SearchUIFiltersConfig, SearchUIFiltersContent } from './filters/SearchUIFilters'
import { CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions } from './filters/types'
import { Box, Divider, SxProps } from '@mui/material'
import { GetPagedOrderedSortedListRequest, Order } from '../../common'
import {
    PneTable,
    PneTableViewOption,
    PneTableViewSelector,
    PneTableViewSelectorProps,
    TableCreateHeaderType,
    TableDisplayOptions,
    useTable,
} from '../..'
import { UseTableParams } from '../table/useTable'
import { useSearchUIFiltersStore } from './filters/state/store'
import { SearchUIFiltersStoreProvider } from './filters/state/SearchUIFiltersStoreProvider'

/**
 * Параметры запроса поиска, отправляемые в обработчик данных таблицы.
 * Тип формируется на основе SearchCriteria без служебного флага `initialized`
 * и стандартных параметров пагинации/сортировки списка.
 */
export type SearchParams = Omit<SearchCriteria & GetPagedOrderedSortedListRequest, 'initialized'>

/**
 * Свойства компонента {@link SearchUI}.
 * @template D Тип строки данных, возвращаемых запросом поиска и отображаемых в таблице.
 */
type SearchUICommonProps<D extends object> = {
    /**
     * Stable non-secret Selenium scope shared by the filters and results table.
     * Defaults to settingsContextName; set it explicitly when multiple instances may render together.
     */
    autoTestId?: string
    /**
     * Имя контекста настроек, под которым таблица и фильтры сохраняют состояние пользователя.
     */
    settingsContextName: string
    /**
     * Полный список критериев, доступных пользователю для выбора.
     */
    possibleCriteria: CriterionTypeEnum[]
    /**
     * Критерии, которые должны быть активированы при первой загрузке фильтра.
     */
    predefinedCriteria?: CriterionTypeEnum[]
    /**
     * Допустимые точные метки поиска, отображаемые в выпадающем списке.
     */
    exactSearchLabels?: ExactCriterionSearchLabelEnum[]
    /**
     * Начальные значения условий фильтрации, кроме списка критериев.
     */
    initialSearchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
    /**
     * Внешнее управление состоянием фильтров. При изменении значения происходит синхронизация стора.
     */
    searchConditions?: Partial<SearchUIConditions>
    /**
     * Кастомизация поведения таблицы (пагинация, отображение, дублирование пагинатора).
     */
    tableParams?: Pick<
        UseTableParams<D>,
        'rowsPerPageOptions' | 'duplicatePagination' | 'paginatorActiveActionSx' | 'displayOptions'
    >
    /**
     * Внешнее управление данными таблицы через React.useState.
     */
    dataUseState?: [D[], Dispatch<SetStateAction<D[]>>]
    /**
     * Конфигурация виджета фильтров.
     */
    config?: SearchUIFiltersConfig
}

export type SearchUIDataSource<D extends object> = (searchParams: SearchParams) => Promise<D[]>

export type SearchUITableRowFactory<D extends object> = (
    rowData: D,
    index: number,
    data: D[],
    setData: Dispatch<SetStateAction<D[]>>,
) => React.ReactElement

export type SearchUIViewSort = 'preserve' | {
    sortColumnIndex: number
    sortAsc: boolean
}

export type SearchUIView<D extends object, TViewId extends string = string> = PneTableViewOption<TViewId> & {
    /** Data source used only while this view is selected. */
    searchData: SearchUIDataSource<D>
    /** Header rendered only while this view is selected. */
    createTableHeader: TableCreateHeaderType
    /** Row renderer used only while this view is selected. */
    createTableRow: SearchUITableRowFactory<D>
    /** Optional consumer-owned actions rendered while this view is selected. */
    actions?: React.ReactNode
    /** Defaults to the common safe sort; preserving another view's sort must be explicit. */
    sortOnActivate?: SearchUIViewSort
}

type SearchUIViewsAccessibleName = {
    'aria-label': string
    'aria-labelledby'?: never
} | {
    'aria-label'?: never
    'aria-labelledby': string
}

type SearchUIViewsBaseConfig<TViewId extends string> = Omit<
    PneTableViewSelectorProps<TViewId>,
    'actions' | 'aria-label' | 'aria-labelledby' | 'views'
>

export type SearchUIViewsConfig<D extends object, TViewId extends string = string> =
    SearchUIViewsBaseConfig<TViewId> & SearchUIViewsAccessibleName & {
    views: readonly SearchUIView<D, TViewId>[]
    /** Optional compatibility/layout wrapper around the library-owned selector. */
    renderViewSelector?: (selector: React.ReactElement) => React.ReactNode
}

type SearchUILegacyTableProps<D extends object> = {
    tableViews?: never
    /** Function that loads rows for the current search and table state. */
    searchData: SearchUIDataSource<D>
    /** Table header factory. */
    createTableHeader: TableCreateHeaderType
    /** Table row factory. */
    createTableRow: SearchUITableRowFactory<D>
}

type SearchUIViewTableProps<D extends object, TViewId extends string> = {
    /** Controlled generic table-view configuration. */
    tableViews: SearchUIViewsConfig<D, TViewId>
    searchData?: never
    createTableHeader?: never
    createTableRow?: never
}

export type SearchUIProps<
    D extends object,
    TViewId extends string = string,
> = SearchUICommonProps<D> & (
    SearchUILegacyTableProps<D> | SearchUIViewTableProps<D, TViewId>
)

/**
 * Высокоуровневый компонент поискового UI, объединяющий фильтры и таблицу с результатами.
 * @template D Тип строки данных, отображаемых в таблице.
 * @param props Свойства компонента.
 */
export const SearchUI = <D extends object, TViewId extends string = string>(
    props: SearchUIProps<D, TViewId>,
): React.ReactElement => {
    return <SearchUIFiltersStoreProvider
        key={props.settingsContextName}
        settingsContextName={props.settingsContextName}
    >
        <SearchUIContent {...props}/>
    </SearchUIFiltersStoreProvider>
}

const SearchUIContent = <D extends object, TViewId extends string = string>(
    props: SearchUIProps<D, TViewId>,
): React.ReactElement => {
    const {
        autoTestId = props.settingsContextName,
        settingsContextName,
        possibleCriteria,
        predefinedCriteria,
        exactSearchLabels,
        initialSearchConditions,
        searchConditions,
        tableParams,
        dataUseState,
        config,
    } = props
    const resolvedTable = resolveSearchUITable(props)

    const searchCriteria = useSearchUIFiltersStore(store => store.appliedSearchCriteria)
    const filtersSettingsContextName = useSearchUIFiltersStore(store => store.settingsContextName)
    const filtersContextReady = filtersSettingsContextName === settingsContextName

    // const [criteria, setCriteria] = useSearchCriteria()
    const defaultDisplayOptions: TableDisplayOptions = {
        ...initialDisplayOptions,
        ...tableParams?.displayOptions,
    }
    const [displayOptions, setDisplayOptions] = useState<TableDisplayOptions>(defaultDisplayOptions)
    const resolvedDisplayOptions = resolvedTable.viewId === undefined
        || resolvedTable.sortOnActivate === 'preserve'
        ? displayOptions
        : {
            ...defaultDisplayOptions,
            pageSize: displayOptions.pageSize,
            ...resolvedTable.sortOnActivate,
        }

    const fetchDataExtraDeps = useMemo(
        () => [searchCriteria, filtersContextReady, resolvedTable.viewId],
        [searchCriteria, filtersContextReady, resolvedTable.viewId],
    )

    const {
        loading,
        paginator,
        data, setData,
        sortIndex, setSortIndex,
        order, setOrder,
        onSortChange,
    } = useTable<D>({
        rowsPerPageOptions: tableParams?.rowsPerPageOptions,
        duplicatePagination: tableParams?.duplicatePagination,
        paginatorActiveActionSx: tableParams?.paginatorActiveActionSx,
        displayOptions: resolvedDisplayOptions,
        onDisplayOptionsChange: setDisplayOptions,
        settingsContextName: settingsContextName,
        dataUseState: dataUseState,
        fetchDataExtraDeps: fetchDataExtraDeps,
        resetDisplayOptions: resolvedTable.viewId === undefined
            ? undefined
            : resolvedTable.sortOnActivate === 'preserve'
                ? 'preserve'
                : {
                    sortColumnIndex: resolvedDisplayOptions.sortColumnIndex,
                    sortAsc: resolvedDisplayOptions.sortAsc,
                },
        resetKey: resolvedTable.viewId,
        fetchData: ({ page, pageSize, order, sortIndex }) => {
            if (!searchCriteria?.initialized || !filtersContextReady) {
                return Promise.resolve<D[]>([])
            }

            const searchParams = createSearchParams(searchCriteria, {
                page,
                pageSize,
                order,
                sortIndex,
            })

            return resolvedTable.searchData(searchParams)
        },
    })

    const tableViewSelector = props.tableViews
        ? createTableViewSelector(
            props.tableViews,
            resolvedTable.viewId as TViewId,
            resolvedTable.actions,
            autoTestId,
        )
        : undefined

    return <>
        <SearchUIFiltersContent
            autoTestId={autoTestId}
            settingsContextName={settingsContextName}
            possibleCriteria={possibleCriteria}
            predefinedCriteria={predefinedCriteria}
            exactSearchLabels={exactSearchLabels}
            initialSearchConditions={initialSearchConditions}
            searchConditions={searchConditions}
            onFiltersUpdate={ignoreAppliedSearchCriteria}
            config={config}
            searchLoading={loading}
        />
        <Divider/>
        <Box sx={tableBoxSx}>
            <PneTable
                autoTestId={autoTestId}
                data={data}
                createTableHeader={resolvedTable.createTableHeader}
                sortOptions={{
                    order,
                    setOrder,
                    sortIndex,
                    setSortIndex,
                    onSortChange,
                }}
                createRow={(item, index, arr) => resolvedTable.createTableRow(item, index, arr, setData)}
                paginator={paginator}
                loading={loading}
                loadingKey={resolvedTable.viewId}
                toolbar={tableViewSelector}
            />
        </Box>
    </>
}

type ResolvedSearchUITable<D extends object, TViewId extends string> = {
    searchData: SearchUIDataSource<D>
    createTableHeader: TableCreateHeaderType
    createTableRow: SearchUITableRowFactory<D>
    actions?: React.ReactNode
    sortOnActivate?: SearchUIViewSort
    viewId?: TViewId
}

const resolveSearchUITable = <D extends object, TViewId extends string>(
    props: SearchUIProps<D, TViewId>,
): ResolvedSearchUITable<D, TViewId> => {
    if (!props.tableViews) {
        return {
            searchData: props.searchData,
            createTableHeader: props.createTableHeader,
            createTableRow: props.createTableRow,
        }
    }

    if (props.tableViews.views.length === 0) {
        throw new Error('SearchUI: table views must not be empty')
    }

    const seenIds = new Set<TViewId>()
    for (const view of props.tableViews.views) {
        if (seenIds.has(view.id)) {
            throw new Error(`SearchUI: duplicate table view ID "${view.id}"`)
        }
        seenIds.add(view.id)
    }

    let activeView = props.tableViews.views.find(view => view.id === props.tableViews.value)
    if (!activeView) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(`SearchUI: selected table view "${props.tableViews.value}" is not configured`)
        }
        activeView = props.tableViews.views[0]
    }

    return {
        searchData: activeView.searchData,
        createTableHeader: activeView.createTableHeader,
        createTableRow: activeView.createTableRow,
        actions: activeView.actions,
        sortOnActivate: activeView.sortOnActivate,
        viewId: activeView.id,
    }
}

const createTableViewSelector = <D extends object, TViewId extends string>(
    config: SearchUIViewsConfig<D, TViewId>,
    value: TViewId,
    actions: React.ReactNode,
    searchUIAutoTestId: string,
): React.ReactElement => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        autoTestId = searchUIAutoTestId,
        renderViewSelector,
        value: _configuredValue,
        views,
        ...selectorProps
    } = config
    const options: readonly PneTableViewOption<TViewId>[] = views.map(view => ({
        id: view.id,
        label: view.label,
        disabled: view.disabled,
    }))

    let selector: React.ReactElement
    if (ariaLabel !== undefined) {
        selector = <PneTableViewSelector
            {...selectorProps}
            aria-label={ariaLabel}
            actions={actions}
            autoTestId={autoTestId}
            value={value}
            views={options}
        />
    } else {
        selector = <PneTableViewSelector
            {...selectorProps}
            aria-labelledby={ariaLabelledBy as string}
            actions={actions}
            autoTestId={autoTestId}
            value={value}
            views={options}
        />
    }

    return renderViewSelector ? <>{renderViewSelector(selector)}</> : selector
}

const ignoreAppliedSearchCriteria = (): void => {
    // SearchUI reads the applied criteria from its instance-scoped filter store.
}

const initialDisplayOptions: TableDisplayOptions = {
    pageSize: 50,
    sortColumnIndex: 1,
    sortAsc: true,
}

const tableBoxSx: SxProps = {
    p: '16px 16px 0 16px',
}

/**
 * Преобразует внутреннее состояние фильтров и таблицы в параметры запроса для загрузки данных.
 * @param searchCriteria Текущее состояние критериев поиска.
 * @param options Параметры пагинации и сортировки таблицы.
 * @returns Объект параметров, совместимый с обработчиком `searchData`.
 */
export const createSearchParams = (
    searchCriteria: SearchCriteria,
    options: { page: number; pageSize: number; order?: Order; sortIndex: number },
): SearchParams => ({
    startNum: options.page * options.pageSize,
    rowCount: options.pageSize + 1,
    orderBy: options.sortIndex,
    sortOrder: options.order,

    exactSearchLabel: searchCriteria.exactSearchLabel,
    exactSearchValue: searchCriteria.exactSearchValue,
    ordersSearchLabel: searchCriteria.ordersSearchLabel,
    ordersSearchValue: searchCriteria.ordersSearchValue,
    customerLevelId: searchCriteria.customerLevelId,
    status: searchCriteria.status,
    threeD: searchCriteria.threeD,
    currencies: searchCriteria.currencies,
    countries: searchCriteria.countries,
    dateFrom: searchCriteria.dateFrom,
    dateTo: searchCriteria.dateTo,
    orderDateType: searchCriteria.orderDateType,
    cardTypes: searchCriteria.cardTypes,
    transactionTypes: searchCriteria.transactionTypes,
    transactionStatuses: searchCriteria.transactionStatuses,
    transactionSessionStatuses: searchCriteria.transactionSessionStatuses,
    projectCurrencyId: searchCriteria.projectCurrencyId,
    projectCurrencyConvert: searchCriteria.projectCurrencyConvert,
    groupTypes: searchCriteria.groupTypes,
    multigetCriteria: searchCriteria.multigetCriteria,
    recurrenceTypes: searchCriteria.recurrenceTypes,
    recurrenceStatuses: searchCriteria.recurrenceStatuses,
    mfoConfigurationTypes: searchCriteria.mfoConfigurationTypes,
    markerTypes: searchCriteria.markerTypes,
    markerStatus: searchCriteria.markerStatus,
    processorLogEntryType: searchCriteria.processorLogEntryType,
    errorCode: searchCriteria.errorCode,
})
