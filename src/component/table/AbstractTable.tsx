import React, {useState, useEffect, useLayoutEffect, useRef, MutableRefObject} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {SxProps} from '@mui/material';
import PneTableRow from './PneTableRow';
import PneTableCell from './PneTableCell';
import PneTablePagination from './PneTablePagination';
import PneTablePaginationActions from './PneTablePaginationActions';
import {Order} from "../../common/pne/type";
import {useTranslation} from "react-i18next";
import useDelayedLoading from "./useDelayedLoading";

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
        loading = false,
        stickyHeader = false,
        showNothingIsFoundRow = true,
        tableSx = {},
        boxSx = {},
        noRowsMessage,
    } = props

    const {t} = useTranslation()

    const showSkeleton = useDelayedLoading(loading);

    const containerRef = useRef<HTMLElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const lastRowHeightRef = useRef<number | undefined>(undefined);
    const lastHeaderHeightRef = useRef<number>(0);
    const lastColumnWidthsRef = useRef<number[]>([]);
    const [columnCount, setColumnCount] = useState(100);

    const visibleRows = React.useMemo(
        () => data,
        [data, sortOptions?.order, sortOptions?.sortIndex],
    );

    useEffect(() => {
        if (containerRef?.current) {
            const header = containerRef.current.querySelector('table thead tr');
            if (header) {
                setColumnCount(header.childElementCount);
            }
        }
    });

    useLayoutEffect(() => {
        if (!showSkeleton && tableContainerRef.current && visibleRows.length > 0) {
            const containerHeight = tableContainerRef.current.offsetHeight;
            const thead = containerRef.current?.querySelector('table thead');
            const headerHeight = thead ? thead.getBoundingClientRect().height : 0;
            lastHeaderHeightRef.current = headerHeight;
            lastRowHeightRef.current = (containerHeight - headerHeight) / visibleRows.length;

            const headerCells = containerRef.current?.querySelectorAll('table thead tr th');
            if (headerCells && headerCells.length > 0) {
                lastColumnWidthsRef.current = Array.from(headerCells).map(
                    cell => cell.getBoundingClientRect().width
                );
            }
        }
    });

    const getPneTablePagination = (position: 'top' | 'bottom') => {
        if (!paginator) {
            return null
        }

        return <PneTablePagination
            ref={position === 'bottom' ? paginator.paginationRef : undefined}
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
                shouldRequestScroll={position === 'bottom'}
            />}
        />;
    }
    const skeletonRowCount = paginator?.rowsPerPage || 10;
    const cellPadding = 16; // 8px top + 8px bottom
    const skeletonItemHeight = lastRowHeightRef.current
        ? Math.max(16, lastRowHeightRef.current - cellPadding)
        : undefined;
    const skeletonTableHeight = showSkeleton && lastRowHeightRef.current
        ? lastHeaderHeightRef.current + lastRowHeightRef.current * skeletonRowCount
        : undefined;

    const SKELETON_COL_HIDDEN = 30;
    const SKELETON_COL_NARROW = 120;

    const skeletonCellContent = (row: number, col: number) => {
        const colWidth = lastColumnWidthsRef.current[col];
        if (colWidth !== undefined && colWidth < SKELETON_COL_HIDDEN) {
            return null;
        }
        const width = colWidth !== undefined && colWidth < SKELETON_COL_NARROW
            ? '100%'
            : `${40 + Math.floor((Math.sin(row * 127.1 + col * 311.7) * 43758.5453 % 1 + 1) % 1 * 40)}%`;
        return <Skeleton variant="rounded" width={width} height={skeletonItemHeight} />;
    };

    return <Box sx={{...boxSx}} ref={containerRef}>
        {paginator && paginator.duplicatePagination && getPneTablePagination('top')}
        <TableContainer ref={tableContainerRef}>
            <Table stickyHeader={stickyHeader} sx={{...tableSx, ...(skeletonTableHeight ? {height: skeletonTableHeight} : {})}}>
                {showSkeleton && lastColumnWidthsRef.current.length > 0 && (
                    <colgroup>
                        {lastColumnWidthsRef.current.map((width, i) => (
                            <col key={i} style={{width}} />
                        ))}
                    </colgroup>
                )}
                <TableHead>
                    {createTableHeader({
                        sortOptions: sortOptions
                    })}
                </TableHead>
                <TableBody>
                    {showSkeleton ? (
                        Array.from({length: skeletonRowCount}).map((_, rowIndex) => (
                            <PneTableRow key={`skeleton-${rowIndex}`} hover={false}>
                                {Array.from({length: columnCount}).map((_, colIndex) => (
                                    <PneTableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                                        {skeletonCellContent(rowIndex, colIndex)}
                                    </PneTableCell>
                                ))}
                            </PneTableRow>
                        ))
                    ) : (
                        <>
                            {visibleRows.map(createRow)}
                            {visibleRows.length === 0 && showNothingIsFoundRow && (
                                <PneTableRow hover={false}>
                                    <PneTableCell colSpan={columnCount}>
                                        {noRowsMessage || t('advancedSearch.noRows')}
                                    </PneTableCell>
                                </PneTableRow>
                            )}
                            {lastRow}
                        </>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
        {paginator && getPneTablePagination('bottom')}
    </Box>
}

export default AbstractTable;
