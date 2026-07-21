import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { SearchUIFiltersConfig, SearchUIFiltersContent } from './filters/SearchUIFilters'
import { CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions } from './filters/types'
import { Box, Divider, SxProps } from '@mui/material'
import { GetPagedOrderedSortedListRequest, Order } from '../../common'
import {
    PneTable,
    PneTableToolbar,
    PneTableViewOption,
    PneTableViewSelector,
    PneTableViewSelectorProps,
    ITableCreateHeaderParams,
    TableRowId,
    TableSelectionUpdate,
    TableDisplayOptions,
    UseTableSelectionParams,
    useTable,
    useTableSelection,
} from '../..'
import { UseTableParams } from '../table/useTable'
import { useSearchUIFiltersStore } from './filters/state/store'
import { SearchUIFiltersStoreProvider } from './filters/state/SearchUIFiltersStoreProvider'
import {
    createSearchUITableSelectionScopeKey,
    SearchUITableFactoryContext,
    SearchUITableSelectionConfig,
    SearchUITableSelectionController,
    SearchUITableSelectionScope,
} from './SearchUITableSelection'

const useSearchUISelectionLayoutEffect = typeof window === 'undefined'
    ? useEffect
    : useLayoutEffect

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
type SearchUICommonProps<
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
> = {
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
    /** Optional transient selection controller for the current applied result set. */
    tableSelection?: SearchUITableSelectionConfig<D, TKey, TViewId>
}

export type SearchUIDataSource<D extends object> = (searchParams: SearchParams) => Promise<D[]>

export type SearchUITableHeaderFactory<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = (
    headerParams: ITableCreateHeaderParams,
    /** Optional so previously exported factories remain directly callable with one argument. */
    context?: SearchUITableFactoryContext<D, TKey, TViewId>,
) => React.ReactElement

export type SearchUITableRowFactory<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = (
    rowData: D,
    index: number,
    data: D[],
    setData: Dispatch<SetStateAction<D[]>>,
    /** Optional so previously exported factories remain directly callable with four arguments. */
    context?: SearchUITableFactoryContext<D, TKey, TViewId>,
) => React.ReactElement

export type SearchUIViewSort = 'preserve' | {
    sortColumnIndex: number
    sortAsc: boolean
}

export type SearchUIView<
    D extends object,
    TViewId extends string = string,
    TKey extends TableRowId = TableRowId,
> = PneTableViewOption<TViewId> & {
    /** Data source used only while this view is selected. */
    searchData: SearchUIDataSource<D>
    /** Header rendered only while this view is selected. */
    createTableHeader: SearchUITableHeaderFactory<D, TKey, TViewId>
    /** Row renderer used only while this view is selected. */
    createTableRow: SearchUITableRowFactory<D, TKey, TViewId>
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

export type SearchUIViewsConfig<
    D extends object,
    TViewId extends string = string,
    TKey extends TableRowId = TableRowId,
> =
    SearchUIViewsBaseConfig<TViewId> & SearchUIViewsAccessibleName & {
    views: readonly SearchUIView<D, TViewId, TKey>[]
    /** Optional compatibility/layout wrapper around the library-owned selector. */
    renderViewSelector?: (selector: React.ReactElement) => React.ReactNode
}

type SearchUILegacyTableProps<
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
> = {
    tableViews?: never
    /** Function that loads rows for the current search and table state. */
    searchData: SearchUIDataSource<D>
    /** Table header factory. */
    createTableHeader: SearchUITableHeaderFactory<D, TKey, TViewId>
    /** Table row factory. */
    createTableRow: SearchUITableRowFactory<D, TKey, TViewId>
}

type SearchUIViewTableProps<
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
> = {
    /** Controlled generic table-view configuration. */
    tableViews: SearchUIViewsConfig<D, TViewId, TKey>
    searchData?: never
    createTableHeader?: never
    createTableRow?: never
}

export type SearchUIProps<
    D extends object,
    TViewId extends string = string,
    TKey extends TableRowId = TableRowId,
> = SearchUICommonProps<D, TViewId, TKey> & (
    SearchUILegacyTableProps<D, TViewId, TKey> | SearchUIViewTableProps<D, TViewId, TKey>
)

/**
 * Высокоуровневый компонент поискового UI, объединяющий фильтры и таблицу с результатами.
 * @template D Тип строки данных, отображаемых в таблице.
 * @param props Свойства компонента.
 */
export const SearchUI = <
    D extends object,
    TViewId extends string = string,
    TKey extends TableRowId = TableRowId,
>(
        props: SearchUIProps<D, TViewId, TKey>,
    ): React.ReactElement => {
    return <SearchUIFiltersStoreProvider
        key={props.settingsContextName}
        settingsContextName={props.settingsContextName}
    >
        <SearchUIContent {...props}/>
    </SearchUIFiltersStoreProvider>
}

const SearchUIContent = <
    D extends object,
    TViewId extends string = string,
    TKey extends TableRowId = TableRowId,
>(
        props: SearchUIProps<D, TViewId, TKey>,
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
        tableSelection,
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

    const renderTable = (
        selection: SearchUITableSelectionController<D, TKey, TViewId> | undefined,
        toolbar: React.ReactNode,
        feedback?: React.ReactNode,
    ) => {
        const factoryContext: SearchUITableFactoryContext<D, TKey, TViewId> = {
            appliedSearchCriteria: searchCriteria,
            selection,
            viewId: resolvedTable.viewId,
        }

        return <PneTable
            autoTestId={autoTestId}
            data={data}
            createTableHeader={headerParams => resolvedTable.createTableHeader(
                headerParams,
                factoryContext,
            )}
            sortOptions={{
                order,
                setOrder,
                sortIndex,
                setSortIndex,
                onSortChange,
            }}
            createRow={(item, index, arr) => resolvedTable.createTableRow(
                item,
                index,
                arr,
                setData,
                factoryContext,
            )}
            paginator={paginator}
            loading={loading}
            loadingKey={resolvedTable.viewId}
            toolbar={toolbar}
            feedback={feedback}
        />
    }

    const table = tableSelection
        ? <SearchUISelectableTable
            appliedSearchCriteria={searchCriteria}
            config={tableSelection}
            data={data}
            loading={loading}
            persistentControls={tableViewSelector}
            renderTable={renderTable}
            viewId={resolvedTable.viewId}
        />
        : renderTable(undefined, tableViewSelector)

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
            {table}
        </Box>
    </>
}

type SearchUISelectableTableProps<
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
> = {
    appliedSearchCriteria: SearchCriteria | null
    config: SearchUITableSelectionConfig<D, TKey, TViewId>
    data: D[]
    loading: boolean
    persistentControls?: React.ReactNode
    renderTable: (
        selection: SearchUITableSelectionController<D, TKey, TViewId>,
        toolbar: React.ReactNode,
        feedback?: React.ReactNode,
    ) => React.ReactElement
    viewId?: TViewId
}

const SearchUISelectableTable = <
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
>(props: SearchUISelectableTableProps<D, TViewId, TKey>) => {
    const {
        appliedSearchCriteria,
        config,
        data,
        loading,
        persistentControls,
        renderTable,
        viewId,
    } = props
    const scopeKey = createSearchUITableSelectionScopeKey(
        appliedSearchCriteria,
        viewId,
        config.preserveAcrossViews ?? false,
    )
    const scope = useMemo<SearchUITableSelectionScope<TViewId>>(() => ({
        appliedSearchCriteria,
        scopeKey,
        viewId,
    }), [appliedSearchCriteria, scopeKey, viewId])
    const [selectingAllMatching, setSelectingAllMatching] = useState(false)
    const requestSequenceRef = useRef(0)
    const requestPendingRef = useRef(false)
    const requestPromiseRef = useRef<Promise<TableSelectionUpdate<TKey>> | null>(null)
    const mountedRef = useRef(false)
    const previousScopeKeyRef = useRef(scopeKey)
    const previousMaxSelectedRef = useRef(config.maxSelected)
    const previousConfiguredDisabledRef = useRef(config.disabled ?? false)
    const previousResolverEnabledRef = useRef(config.resolveAllMatchingCount !== undefined)
    const resolverRef = useRef(config.resolveAllMatchingCount)
    const scopeOccurrenceRef = useRef(0)
    const [scopeOccurrence, setScopeOccurrence] = useState(0)
    const allMatchingAllowedRef = useRef(
        appliedSearchCriteria !== null && !config.disabled,
    )
    const selectionInteractionsAllowedRef = useRef(
        appliedSearchCriteria !== null && !config.disabled && !loading,
    )

    useSearchUISelectionLayoutEffect(() => {
        mountedRef.current = true

        return () => {
            mountedRef.current = false
            requestSequenceRef.current += 1
            requestPendingRef.current = false
            requestPromiseRef.current = null
        }
    }, [])

    useSearchUISelectionLayoutEffect(() => {
        allMatchingAllowedRef.current = appliedSearchCriteria !== null && !config.disabled
        selectionInteractionsAllowedRef.current = allMatchingAllowedRef.current && !loading
        resolverRef.current = config.resolveAllMatchingCount
    }, [appliedSearchCriteria, config.disabled, config.resolveAllMatchingCount, loading])

    useSearchUISelectionLayoutEffect(() => {
        if (Object.is(previousScopeKeyRef.current, scopeKey)) {
            return
        }

        previousScopeKeyRef.current = scopeKey
        const nextScopeOccurrence = scopeOccurrenceRef.current + 1
        scopeOccurrenceRef.current = nextScopeOccurrence
        setScopeOccurrence(nextScopeOccurrence)
        requestSequenceRef.current += 1
        requestPendingRef.current = false
        requestPromiseRef.current = null
        setSelectingAllMatching(false)
    }, [scopeKey])

    useSearchUISelectionLayoutEffect(() => {
        const configuredDisabled = config.disabled ?? false
        const maxSelectedChanged = !Object.is(
            previousMaxSelectedRef.current,
            config.maxSelected,
        )
        const becameDisabled = configuredDisabled && !previousConfiguredDisabledRef.current
        const resolverEnabled = config.resolveAllMatchingCount !== undefined
        const resolverRemoved = previousResolverEnabledRef.current && !resolverEnabled
        previousMaxSelectedRef.current = config.maxSelected
        previousConfiguredDisabledRef.current = configuredDisabled
        previousResolverEnabledRef.current = resolverEnabled

        if (!maxSelectedChanged && !becameDisabled && !resolverRemoved) {
            return
        }

        requestSequenceRef.current += 1
        requestPendingRef.current = false
        requestPromiseRef.current = null
        setSelectingAllMatching(false)
    }, [config.disabled, config.maxSelected, config.resolveAllMatchingCount])

    const selectionParams = createSearchUITableSelectionParams(
        config,
        data,
        scopeKey,
        appliedSearchCriteria === null,
    )
    const tableSelection = useTableSelection(selectionParams)
    const tableSelectionRef = useRef(tableSelection)

    useSearchUISelectionLayoutEffect(() => {
        tableSelectionRef.current = tableSelection
    }, [tableSelection])

    const createBlockedUpdate = useCallback((): TableSelectionUpdate<TKey> => ({
        selection: tableSelectionRef.current.selection,
        changed: false,
        limitExceeded: false,
    }), [])

    const selectAllMatchingResults = useCallback((): Promise<TableSelectionUpdate<TKey>> => {
        const resolver = resolverRef.current
        const currentSelection = tableSelectionRef.current
        if (!mountedRef.current
            || scopeOccurrenceRef.current !== scopeOccurrence
            || !resolver
            || !selectionInteractionsAllowedRef.current) {
            return Promise.resolve(createBlockedUpdate())
        }
        if (requestPendingRef.current && requestPromiseRef.current) {
            return requestPromiseRef.current
        }
        if (currentSelection.interactionDisabled) {
            return Promise.resolve(createBlockedUpdate())
        }

        const requestSequence = requestSequenceRef.current + 1
        requestSequenceRef.current = requestSequence
        requestPendingRef.current = true
        setSelectingAllMatching(true)
        const requestScope = scope
        const runRequest = async (): Promise<TableSelectionUpdate<TKey>> => {
            try {
                await Promise.resolve()
                if (!mountedRef.current
                    || requestSequenceRef.current !== requestSequence
                    || !allMatchingAllowedRef.current
                    || !resolverRef.current) {
                    return createBlockedUpdate()
                }

                const matchingCount = await resolver(requestScope)
                if (!mountedRef.current
                    || requestSequenceRef.current !== requestSequence
                    || !allMatchingAllowedRef.current
                    || !resolverRef.current) {
                    return createBlockedUpdate()
                }

                return tableSelectionRef.current.selectAllMatching(matchingCount)
            } catch (error) {
                if (!mountedRef.current || requestSequenceRef.current !== requestSequence) {
                    return createBlockedUpdate()
                }
                throw error
            } finally {
                if (mountedRef.current && requestSequenceRef.current === requestSequence) {
                    requestPendingRef.current = false
                    requestPromiseRef.current = null
                    setSelectingAllMatching(false)
                }
            }
        }

        const requestPromise = runRequest()
        requestPromiseRef.current = requestPromise
        return requestPromise
    }, [createBlockedUpdate, scope, scopeOccurrence])

    const selection: SearchUITableSelectionController<D, TKey, TViewId> = {
        ...tableSelection,
        clear: () => !mountedRef.current
            || requestPendingRef.current
            || scopeOccurrenceRef.current !== scopeOccurrence
            || !selectionInteractionsAllowedRef.current
            ? createBlockedUpdate()
            : tableSelectionRef.current.clear(),
        interactionDisabled: tableSelection.interactionDisabled || loading || selectingAllMatching,
        selectAllMatching: matchingCount => !mountedRef.current
            || requestPendingRef.current
            || scopeOccurrenceRef.current !== scopeOccurrence
            || !selectionInteractionsAllowedRef.current
            ? createBlockedUpdate()
            : tableSelectionRef.current.selectAllMatching(matchingCount),
        setPageSelected: selected => !mountedRef.current
            || requestPendingRef.current
            || scopeOccurrenceRef.current !== scopeOccurrence
            || !selectionInteractionsAllowedRef.current
            ? createBlockedUpdate()
            : tableSelectionRef.current.setPageSelected(selected),
        setRowSelected: (row, selected) => !mountedRef.current
            || requestPendingRef.current
            || scopeOccurrenceRef.current !== scopeOccurrence
            || !selectionInteractionsAllowedRef.current
            ? createBlockedUpdate()
            : tableSelectionRef.current.setRowSelected(row, selected),
        scope,
        selectingAllMatching,
        selectAllMatchingResults: config.resolveAllMatchingCount
            ? selectAllMatchingResults
            : undefined,
    }
    const renderContext = {
        appliedSearchCriteria,
        selection,
        viewId,
    }
    const contextualControls = config.renderControls(renderContext)
    const feedback = config.renderFeedback?.(renderContext)
    const toolbar = config.toolbarAriaLabel !== undefined
        ? <PneTableToolbar
            aria-label={config.toolbarAriaLabel}
            contextual={contextualControls}
            persistent={persistentControls}
        />
        : <PneTableToolbar
            aria-labelledby={config.toolbarAriaLabelledBy as string}
            contextual={contextualControls}
            persistent={persistentControls}
        />

    return renderTable(selection, toolbar, feedback)
}

const createSearchUITableSelectionParams = <
    D extends object,
    TKey extends TableRowId,
    TViewId extends string,
>(
        config: SearchUITableSelectionConfig<D, TKey, TViewId>,
        rows: D[],
        scopeKey: string,
        interactionsUnavailable: boolean,
    ): UseTableSelectionParams<D, TKey> => {
    const common = {
        disabled: config.disabled || interactionsUnavailable,
        getRowId: config.getRowId,
        isRowSelectable: config.isRowSelectable,
        maxSelected: config.maxSelected,
        rows,
        scopeKey,
    }

    if (config.selection !== undefined) {
        return {
            ...common,
            onSelectionChange: config.onSelectionChange,
            selection: config.selection,
        }
    }

    return {
        ...common,
        defaultSelection: config.defaultSelection,
        onSelectionChange: config.onSelectionChange,
    }
}

type ResolvedSearchUITable<
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
> = {
    searchData: SearchUIDataSource<D>
    createTableHeader: SearchUITableHeaderFactory<D, TKey, TViewId>
    createTableRow: SearchUITableRowFactory<D, TKey, TViewId>
    actions?: React.ReactNode
    sortOnActivate?: SearchUIViewSort
    viewId?: TViewId
}

const resolveSearchUITable = <
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
>(
        props: SearchUIProps<D, TViewId, TKey>,
    ): ResolvedSearchUITable<D, TViewId, TKey> => {
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

const createTableViewSelector = <
    D extends object,
    TViewId extends string,
    TKey extends TableRowId,
>(
        config: SearchUIViewsConfig<D, TViewId, TKey>,
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
