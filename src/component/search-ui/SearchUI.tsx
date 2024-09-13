import React, {Dispatch, SetStateAction, useState} from 'react';
import {SearchUIFilters, SearchUIFiltersConfig} from './filters/SearchUIFilters';
import {CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions} from './filters/types';
import {useSearchCriteria} from './filters/hook';
import {Box, Divider, SxProps} from '@mui/material';
import {GetPagedOrderedSortedListRequest} from "../../common";
import {PneTable, TableCreateHeaderType, TableDisplayOptions, useTable} from '../..';

export type SearchParams = SearchCriteria & GetPagedOrderedSortedListRequest

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
        dataUseState,
        config,
    } = props
    const [criteria, setCriteria] = useSearchCriteria()
    const [displayOptions, setDisplayOptions] = useState<TableDisplayOptions>(initialDisplayOptions)

    const {
        paginator,
        data, setData,
        sortIndex, setSortIndex,
        order, setOrder,
        onSortChange,
    } = useTable<D>({
        displayOptions: displayOptions,
        onDisplayOptionsChange: setDisplayOptions,
        settingsContextName: settingsContextName,
        dataUseState: dataUseState,
        fetchDataExtraDeps: [criteria],
        fetchData: ({page, pageSize, order, sortIndex}) => {
            const searchParams: SearchParams = {
                startNum: page * pageSize,
                rowCount: pageSize + 1,
                orderBy: sortIndex,
                sortOrder: order,

                exactSearchLabel: criteria.exactSearchLabel,
                exactSearchValue: criteria.exactSearchValue,
                status: criteria.status,
                threeD: criteria.threeD,
                currencies: criteria.currencies,
                dateFrom: criteria.dateFrom,
                dateTo: criteria.dateTo,
                cardTypes: criteria.cardTypes,
                transactionTypes: criteria.transactionTypes,
                projectCurrencyId: criteria.projectCurrencyId,
                projectCurrencyConvert: criteria.projectCurrencyConvert,
                groupTypes: criteria.groupTypes,
                multigetCriteria: criteria.multigetCriteria,
                userDefined: criteria.userDefined, //TODO че за трэш?
                recurrenceTypes: criteria.recurrenceTypes,
                recurrenceStatuses: criteria.recurrenceStatuses,
                mfoConfigurationTypes: criteria.mfoConfigurationTypes,
                markerTypes: criteria.markerTypes,
                markerStatus: criteria.markerStatus,
            }

            return searchData(searchParams)
        }
    })

    return <>
        <SearchUIFilters
            settingsContextName={settingsContextName}
            possibleCriteria={possibleCriteria}
            predefinedCriteria={predefinedCriteria}
            exactSearchLabels={exactSearchLabels}
            initialSearchConditions={initialSearchConditions}
            onFiltersUpdate={setCriteria}
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
                    onSortChange
                }}
                createRow={(item, index, arr) => createTableRow(item, index, arr, setData)}
                paginator={paginator}
            />
        </Box>
    </>
}

const initialDisplayOptions: TableDisplayOptions = {
    pageSize: 10,
    sortColumnIndex: 1,
    sortAsc: true
}

const tableBoxSx: SxProps = {
    p: '16px 16px 0 16px',
}
