import React, { Dispatch, SetStateAction, useState } from 'react'
import { SearchUIFilters, SearchUIFiltersConfig } from './filters/SearchUIFilters'
import { CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions } from './filters/types'
import { Box, Divider, SxProps } from '@mui/material'
import { GetPagedOrderedSortedListRequest } from '../../common'
import { PneTable, TableCreateHeaderType, TableDisplayOptions, useTable } from '../..'
import { useSearchUIStore } from './state/store'
import { UseTableParams } from '../table/useTable'

export type SearchParams = Omit<SearchCriteria & GetPagedOrderedSortedListRequest, 'initialized'>

type Props<D> = {
    settingsContextName: string
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria?: CriterionTypeEnum[]
    exactSearchLabels?: ExactCriterionSearchLabelEnum[]
    initialSearchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
    searchData: (searchParams: SearchParams) => Promise<D[]>
    createTableHeader: TableCreateHeaderType
    createTableRow: (
        rowData: D,
        index: number,
        data: D[],
        setData: Dispatch<SetStateAction<D[]>>,
    ) => React.ReactElement
    tableParams?: Pick<
        UseTableParams<D>,
        'rowsPerPageOptions' | 'duplicatePagination' | 'paginatorActiveActionSx' | 'displayOptions'
    >
    dataUseState?: [D[], Dispatch<SetStateAction<D[]>>]
    config?: SearchUIFiltersConfig
}

export const SearchUI = <D, >(props: Props<D>) => {
    const {
        settingsContextName,
        possibleCriteria,
        predefinedCriteria,
        exactSearchLabels,
        initialSearchConditions,
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
        fetchDataExtraDeps: [...Object.values(searchCriteria)],
        fetchData: ({ page, pageSize, order, sortIndex }) => {
            if (!searchCriteria.initialized) {
                return new Promise<D[]>(() => [])
            }

            const searchParams: SearchParams = {
                startNum: page * pageSize,
                rowCount: pageSize + 1,
                orderBy: sortIndex,
                sortOrder: order,

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
            }

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
