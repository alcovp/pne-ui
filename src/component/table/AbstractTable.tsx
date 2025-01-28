import React, {useState, useEffect, useRef, MutableRefObject} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Box from '@mui/material/Box';
import {SxProps} from '@mui/material';
import PneTableRow from './PneTableRow';
import PneTableCell from './PneTableCell';
import PneTablePagination from './PneTablePagination';
import PneTablePaginationActions from './PneTablePaginationActions';
import {Order} from "../../common/pne/type";
import {useTranslation} from "react-i18next";

export type RowsPerPageOption = number //| { label: string, value: number };

export type PaginatorProps = {
    rowsPerPageOptions: RowsPerPageOption[]
    rowsPerPage: number
    page: number
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement> | null,
        page: number
    ) => void
    onPageSizeChange: (pageSize: number) => void
    hasNext: boolean
    disableActions: boolean
    displayedRowsLabel: string
    paginationRef: MutableRefObject<HTMLDivElement | null>
    activeActionSx?: SxProps
    duplicatePagination?: boolean
}

export type TableProps<D> = {
    data: D[]
    createRow: (
        rowData: D,
        index: number,
        arr: D[]
    ) => React.ReactElement
    createTableHeader: TableCreateHeaderType
    sortOptions?: TableSortOptions
    lastRow?: React.ReactElement
    paginator?: PaginatorProps
    loading?: boolean
    stickyHeader?: boolean
    showNothingIsFoundRow?: boolean
    tableSx?: SxProps
    boxSx?: SxProps
    noRowsMessage?: string
}

export type TableSortOptions = {
    order: Order
    setOrder: (order: Order) => void
    sortIndex: number
    setSortIndex: (index: number) => void
    onSortChange: (sortIndex: number, sortOrder: Order) => void
}

export interface ITableCreateHeaderParams {
    sortOptions?: TableSortOptions
}

export type TableCreateHeaderType = (headerParams: ITableCreateHeaderParams) => React.ReactElement

const AbstractTable = <D, >(
    props: React.PropsWithChildren<TableProps<D>>
) => {
    const {
        data,
        createTableHeader,
        sortOptions,
        createRow,
        lastRow = null,
        paginator,
        stickyHeader = false,
        showNothingIsFoundRow = true,
        tableSx = {},
        boxSx = {},
        noRowsMessage,
    } = props

    const {t} = useTranslation()

    const containerRef = useRef<HTMLElement>(null);
    const [nothingRowColSpan, setNothingRowColSpan] = useState(100);

    const visibleRows = React.useMemo(
        () => data,
        [data, sortOptions?.order, sortOptions?.sortIndex],
    );

    useEffect(() => {
        if (visibleRows.length === 0 && showNothingIsFoundRow) {
            if (containerRef?.current) {
                const header = containerRef.current.querySelector('table thead tr');
                if (header) {
                    setNothingRowColSpan(header.childElementCount);
                }
            }
        }
    }, [visibleRows.length, showNothingIsFoundRow]);

    const getPneTablePagination = () => {
        if (!paginator) {
            return null
        }

        return <PneTablePagination
            ref={paginator.paginationRef}
            count={-1}
            /*
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore */
            component={'div'}
            labelDisplayedRows={() => null}
            labelRowsPerPage={null}
            nextIconButtonProps={{
                disabled: !paginator.hasNext,
            }}
            rowsPerPageOptions={paginator.rowsPerPageOptions}
            rowsPerPage={paginator.rowsPerPage}
            page={paginator.page}
            onPageChange={paginator.onPageChange}
            ActionsComponent={(props) => <PneTablePaginationActions
                {...props}
                paginator={paginator}
            />}
        />;
    }
    return <Box sx={{...boxSx}} ref={containerRef}>
        {paginator && paginator.duplicatePagination && getPneTablePagination()}
        <TableContainer>
            <Table stickyHeader={stickyHeader} sx={{...tableSx}}>
                <TableHead>
                    {createTableHeader({
                        sortOptions: sortOptions
                    })}
                </TableHead>
                <TableBody>
                    {visibleRows.map(createRow)}
                    {visibleRows.length === 0 && showNothingIsFoundRow && (
                        <PneTableRow hover={false}>
                            <PneTableCell colSpan={nothingRowColSpan}>
                                {noRowsMessage || t('advancedSearch.noRows')}
                            </PneTableCell>
                        </PneTableRow>
                    )}
                    {lastRow}
                </TableBody>
            </Table>
        </TableContainer>
        {paginator && getPneTablePagination()}
    </Box>
}

export default AbstractTable;
