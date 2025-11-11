import React, { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { SearchUIFilters, SearchUIFiltersConfig } from './filters/SearchUIFilters'
import { CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions } from './filters/types'
import { Box, Divider, SxProps } from '@mui/material'
import { GetPagedOrderedSortedListRequest, Order } from '../../common'
import { PneTable, TableCreateHeaderType, TableDisplayOptions, useTable } from '../..'
import { useSearchUIStore } from './state/store'
import { UseTableParams } from '../table/useTable'

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
type Props<D extends object> = {
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
     * Функция загрузки данных по текущим параметрам поиска.
     */
    searchData: (searchParams: SearchParams) => Promise<D[]>
    /**
     * Фабрика заголовка таблицы.
     */
    createTableHeader: TableCreateHeaderType
    /**
     * Фабрика строки таблицы.
     * @param rowData Данные текущей строки.
     * @param index Индекс строки.
     * @param data Все текущие данные таблицы.
     * @param setData Сеттер для обновления данных таблицы.
     */
    createTableRow: (
        rowData: D,
        index: number,
        data: D[],
        setData: Dispatch<SetStateAction<D[]>>,
    ) => React.ReactElement
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

/**
 * Высокоуровневый компонент поискового UI, объединяющий фильтры и таблицу с результатами.
 * @template D Тип строки данных, отображаемых в таблице.
 * @param props Свойства компонента.
 */
export const SearchUI = <D extends object>(props: Props<D>): React.ReactElement => {
    const {
        settingsContextName,
        possibleCriteria,
        predefinedCriteria,
        exactSearchLabels,
        initialSearchConditions,
        searchConditions,
        searchData,
        createTableHeader,
        createTableRow,
        tableParams,
        dataUseState,
        config,
    } = props

    const {
        searchCriteria,
        setSearchCriteria,
    } = useSearchUIStore((store) => ({
        searchCriteria: store.searchCriteria,
        setSearchCriteria: store.setSearchCriteria,
    }))

    // const [criteria, setCriteria] = useSearchCriteria()
    const [displayOptions, setDisplayOptions] = useState<TableDisplayOptions>({
        ...initialDisplayOptions,
        ...tableParams?.displayOptions,
    })

    const fetchDataExtraDeps = useMemo(() => [searchCriteria], [searchCriteria])

    const {
        paginator,
        data, setData,
        sortIndex, setSortIndex,
        order, setOrder,
        onSortChange,
    } = useTable<D>({
        rowsPerPageOptions: tableParams?.rowsPerPageOptions,
        duplicatePagination: tableParams?.duplicatePagination,
        paginatorActiveActionSx: tableParams?.paginatorActiveActionSx,
        displayOptions: displayOptions,
        onDisplayOptionsChange: setDisplayOptions,
        settingsContextName: settingsContextName,
        dataUseState: dataUseState,
        fetchDataExtraDeps: fetchDataExtraDeps,
        fetchData: ({ page, pageSize, order, sortIndex }) => {
            if (!searchCriteria.initialized) {
                return Promise.resolve<D[]>([])
            }

            const searchParams = createSearchParams(searchCriteria, {
                page,
                pageSize,
                order,
                sortIndex,
            })

            return searchData(searchParams)
        },
    })

    return <>
        <SearchUIFilters
            settingsContextName={settingsContextName}
            possibleCriteria={possibleCriteria}
            predefinedCriteria={predefinedCriteria}
            exactSearchLabels={exactSearchLabels}
            initialSearchConditions={initialSearchConditions}
            searchConditions={searchConditions}
            onFiltersUpdate={setSearchCriteria}
            config={config}
        />
        <Divider/>
        <Box sx={tableBoxSx}>
            <PneTable
                data={data}
                createTableHeader={createTableHeader}
                sortOptions={{
                    order,
                    setOrder,
                    sortIndex,
                    setSortIndex,
                    onSortChange,
                }}
                createRow={(item, index, arr) => createTableRow(item, index, arr, setData)}
                paginator={paginator}
            />
        </Box>
    </>
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
    status: searchCriteria.status,
    threeD: searchCriteria.threeD,
    currencies: searchCriteria.currencies,
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
