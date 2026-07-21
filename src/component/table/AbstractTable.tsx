import React, {useState, useEffect, useLayoutEffect, useRef, MutableRefObject} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {SxProps} from '@mui/material';
import type { TablePaginationActionsProps } from '@mui/material/TablePaginationActions';
import PneTableRow from './PneTableRow';
import PneTableCell from './PneTableCell';
import PneTablePagination from './PneTablePagination';
import PneTablePaginationActions from './PneTablePaginationActions';
import {Order} from "../../common/pne/type";
import {useTranslation} from "react-i18next";
import useDelayedLoading from "./useDelayedLoading";
import {createAutoTestAttributes} from '../AutoTestAttribute';

const TABLE_AUTOTEST_ID = 'table';
const TABLE_EMPTY_STATE_AUTOTEST_ID = 'empty-state';
const TABLE_PAGINATION_AUTOTEST_ID = 'pagination';
const TABLE_FEEDBACK_AUTOTEST_ID = 'table-feedback';
const TABLE_TOP_CONTROLS_AUTOTEST_ID = 'table-top-controls';
const TABLE_TOOLBAR_AUTOTEST_ID = 'table-toolbar';

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
    requestScrollToPagination?: () => void
    activeActionSx?: SxProps
    duplicatePagination?: boolean
}

export type TableProps<D> = {
    /** Stable, non-secret instance identifier; required for unambiguous multiple-table scopes. */
    autoTestId?: string
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
    /** Identity that makes a structural loading transition visible immediately without remounting controls. */
    loadingKey?: string | number
    stickyHeader?: boolean
    showNothingIsFoundRow?: boolean
    /** Accessible name forwarded to the semantic table independently from autoTestId. */
    tableAriaLabel?: string
    /** ID reference used to name the semantic table independently from autoTestId. */
    tableAriaLabelledBy?: string
    tableSx?: SxProps
    boxSx?: SxProps
    noRowsMessage?: string
    skeletonRowHeight?: number
    /** Optional controls rendered in the responsive top band, before page-size controls when top pagination exists. */
    toolbar?: React.ReactNode
    toolbarSx?: SxProps
    /** Optional full-width feedback rendered above, and independently from, the responsive top controls. */
    feedback?: React.ReactNode
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
        autoTestId,
        createTableHeader,
        sortOptions,
        createRow,
        lastRow = null,
        paginator,
        loading = false,
        loadingKey,
        stickyHeader = false,
        showNothingIsFoundRow = true,
        tableAriaLabel,
        tableAriaLabelledBy,
        tableSx = {},
        boxSx = {},
        noRowsMessage,
        skeletonRowHeight,
        toolbar,
        toolbarSx,
        feedback,
    } = props

    const {t} = useTranslation()

    const showSkeleton = useDelayedLoading(loading, loadingKey);

    const containerRef = useRef<HTMLElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const lastRowHeightRef = useRef<number | undefined>(undefined);
    const lastHeaderHeightRef = useRef<number>(0);
    const lastColumnWidthsRef = useRef<number[]>([]);
    const [columnCount, setColumnCount] = useState(5);

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

    const getPneTablePagination = (
        position: 'top' | 'bottom',
        topToolbar?: React.ReactNode,
    ) => {
        if (!paginator) {
            return null
        }

        return <PneTablePagination
            {...createAutoTestAttributes(TABLE_PAGINATION_AUTOTEST_ID, position)}
            ref={position === 'bottom' ? paginator.paginationRef : undefined}
            count={-1}
            /*
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore */
            component={'div'}
            labelDisplayedRows={() => null}
            labelRowsPerPage={null}
            rowsPerPageOptions={paginator.rowsPerPageOptions}
            rowsPerPage={paginator.rowsPerPage}
            page={paginator.page}
            onPageChange={paginator.onPageChange}
            ActionsComponent={(props: TablePaginationActionsProps) => <PneTablePaginationActions
                {...props}
                paginator={paginator}
                shouldRequestScroll={position === 'bottom'}
                toolbar={position === 'top' ? topToolbar : undefined}
            />}
        />;
    }
    const skeletonRowCount = paginator?.rowsPerPage || 10;
    const cellPadding = 16; // 8px top + 8px bottom
    const cellBorderHeight = 2; // 1px top + 1px bottom from PneTableRow
    const actualSkeletonRowHeight = lastRowHeightRef.current ?? skeletonRowHeight;
    const skeletonRowSx: SxProps | undefined = actualSkeletonRowHeight
        ? {
            height: actualSkeletonRowHeight,
            maxHeight: actualSkeletonRowHeight,
        }
        : undefined;
    const skeletonCellSx: SxProps | undefined = actualSkeletonRowHeight
        ? {
            '&&': {
                boxSizing: 'border-box',
                height: actualSkeletonRowHeight,
                maxHeight: actualSkeletonRowHeight,
                overflow: 'hidden',
            },
        }
        : undefined;
    const skeletonItemHeight = actualSkeletonRowHeight
        ? Math.max(16, actualSkeletonRowHeight - cellPadding - cellBorderHeight)
        : undefined;
    const skeletonTableHeight = showSkeleton && actualSkeletonRowHeight && lastHeaderHeightRef.current > 0
        ? lastHeaderHeightRef.current + actualSkeletonRowHeight * skeletonRowCount
        : undefined;
    const hasToolbar = toolbar !== undefined
        && toolbar !== null
        && typeof toolbar !== 'boolean'
    const hasFeedback = feedback !== undefined
        && feedback !== null
        && typeof feedback !== 'boolean'
    const createTableToolbar = (insidePagination: boolean) => {
        const toolbarContent = React.isValidElement(toolbar)
            && toolbar.type !== React.Fragment
            ? toolbar
            : <Box
                sx={{
                    alignItems: 'center',
                    display: 'flex',
                    maxWidth: '100%',
                    minWidth: 0,
                    width: 'max-content',
                }}
            >
                {toolbar}
            </Box>

        return <Box
            {...createAutoTestAttributes(TABLE_TOOLBAR_AUTOTEST_ID)}
            sx={[
                {
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    maxWidth: '100%',
                    minWidth: 0,
                    width: '100%',
                },
                insidePagination
                    ? {flex: '1 1 auto'}
                    : {marginBottom: '6px', marginTop: '6px', minHeight: '40px'},
                ...(Array.isArray(toolbarSx) ? toolbarSx : [toolbarSx]),
            ]}
        >
            {toolbarContent}
        </Box>
    }
    const hasTopPagination = Boolean(paginator?.duplicatePagination)
    const hasTopControls = hasToolbar || hasTopPagination

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

    return <Box
        {...createAutoTestAttributes(TABLE_AUTOTEST_ID, autoTestId)}
        sx={{...boxSx}}
        ref={containerRef}
    >
        {hasFeedback ? <Box
            {...createAutoTestAttributes(TABLE_FEEDBACK_AUTOTEST_ID)}
            sx={{
                boxSizing: 'border-box',
                marginBottom: '8px',
                maxWidth: '100%',
                minWidth: 0,
                overflowWrap: 'anywhere',
                width: '100%',
            }}
        >
            {feedback}
        </Box> : null}
        {hasTopControls ? <Box
            {...createAutoTestAttributes(TABLE_TOP_CONTROLS_AUTOTEST_ID)}
            sx={{minWidth: 0, width: '100%'}}
        >
            {hasTopPagination
                ? getPneTablePagination('top', hasToolbar ? createTableToolbar(true) : undefined)
                : hasToolbar ? createTableToolbar(false) : null}
        </Box> : null}
        <TableContainer ref={tableContainerRef}>
            <Table
                aria-busy={showSkeleton}
                aria-label={tableAriaLabel}
                aria-labelledby={tableAriaLabelledBy}
                stickyHeader={stickyHeader}
                sx={{...tableSx, ...(skeletonTableHeight ? {height: skeletonTableHeight} : {})}}
            >
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
                            <PneTableRow
                                key={`skeleton-${rowIndex}`}
                                hover={false}
                                sx={skeletonRowSx}
                            >
                                {Array.from({length: columnCount}).map((_, colIndex) => (
                                    <PneTableCell
                                        key={`skeleton-${rowIndex}-${colIndex}`}
                                        sx={skeletonCellSx}
                                    >
                                        {skeletonCellContent(rowIndex, colIndex)}
                                    </PneTableCell>
                                ))}
                            </PneTableRow>
                        ))
                    ) : (
                        <>
                            {visibleRows.map(createRow)}
                            {visibleRows.length === 0 && showNothingIsFoundRow && (
                                <PneTableRow
                                    {...createAutoTestAttributes(TABLE_EMPTY_STATE_AUTOTEST_ID)}
                                    hover={false}
                                >
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
