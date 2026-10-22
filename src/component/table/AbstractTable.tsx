import React, {useState, useLayoutEffect, useRef, MutableRefObject} from 'react';
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
import {
    countRowColumns,
    isSameSkeletonColumns,
    measureColumnWidths,
    measureSkeletonColumns,
    SkeletonColumn,
    SkeletonGeometry,
} from './tableSkeleton';

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
    /**
     * Overrides the band width in px at which the toolbar stops sharing the
     * pagination row. Normally there is nothing to set: the threshold is
     * measured from the content, so it already fits whatever this table put in
     * the toolbar and whatever the current locale makes of the labels.
     *
     * The band is a container query, so this is the width of the band itself,
     * not of the viewport - a table inside a narrow column behaves like a narrow
     * screen. The pagination needs no threshold at all: its two halves wrap by
     * content.
     */
    controlRowBreakpoints?: {
        /** Below this width the toolbar takes a row of its own. */
        toolbar?: number
    }
}

type PaginationActionsContextValue = {
    paginator: PaginatorProps
    shouldRequestScroll: boolean
    toolbar?: React.ReactNode
    toolbarElementKey?: React.Key | null
    toolbarElementType?: unknown
}

const PaginationActionsContext = React.createContext<PaginationActionsContextValue | null>(null)

const StablePaginationActions = (props: TablePaginationActionsProps) => {
    const context = React.useContext(PaginationActionsContext)

    if (!context) {
        throw new Error('StablePaginationActions must be rendered inside PaginationActionsContext')
    }

    return <PneTablePaginationActions
        {...props}
        {...context}
    />
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
    /**
     * Identity that makes a structural loading transition visible immediately without remounting controls.
     * The skeleton remembers the geometry of real rows per identity, so one view never lends its columns to another.
     */
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
    /** Skeleton row height until the current column structure has been shown with real rows. */
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
    const tableRef = useRef<HTMLTableElement>(null);
    const skeletonGeometryRef = useRef(new Map<string | number | undefined, SkeletonGeometry>());
    const [columnCount, setColumnCount] = useState(5);
    const [skeletonColumns, setSkeletonColumns] = useState<SkeletonColumn[]>([]);

    const visibleRows = React.useMemo(
        () => data,
        [data, sortOptions?.order, sortOptions?.sortIndex],
    );

    // The header decides the columns. Measured before paint, so that a switched view
    // never shows a frame with the previous view's column count.
    useLayoutEffect(() => {
        const headerRow = tableRef.current?.tHead?.rows[0];
        if (!headerRow) {
            return;
        }

        setColumnCount(countRowColumns(headerRow));
        if (showSkeleton) {
            const columns = measureSkeletonColumns(headerRow);
            setSkeletonColumns(current => isSameSkeletonColumns(current, columns) ? current : columns);
        }
    });

    useLayoutEffect(() => {
        const table = tableRef.current;
        const headerRow = table?.tHead?.rows[0];
        if (showSkeleton || !table || !headerRow || !tableContainerRef.current || visibleRows.length === 0) {
            return;
        }

        const tableWidth = table.getBoundingClientRect().width;
        if (tableWidth === 0) {
            // Not laid out (a hidden table): nothing to learn, keep what was measured before.
            return;
        }

        const headerHeight = table.tHead?.getBoundingClientRect().height ?? 0;
        const rowHeight = (tableContainerRef.current.offsetHeight - headerHeight) / visibleRows.length;
        const headerColumnCount = countRowColumns(headerRow);
        const columnWidths = measureColumnWidths(table, headerColumnCount);

        skeletonGeometryRef.current.set(loadingKey, {
            columnCount: headerColumnCount,
            columnPercents: columnWidths?.map(width => width * 100 / tableWidth),
            rowHeight: rowHeight > 0 ? rowHeight : undefined,
            headerHeight,
        });
    });

    const getPneTablePagination = (
        position: 'top' | 'bottom',
        topToolbar?: React.ReactNode,
    ) => {
        if (!paginator) {
            return null
        }

        const observedToolbar = position === 'top' ? toolbar : undefined

        return <PaginationActionsContext.Provider
            value={{
                paginator,
                shouldRequestScroll: position === 'bottom',
                toolbar: position === 'top' ? topToolbar : undefined,
                toolbarElementKey: React.isValidElement(observedToolbar)
                    ? observedToolbar.key
                    : null,
                toolbarElementType: React.isValidElement(observedToolbar)
                    ? observedToolbar.type
                    : typeof observedToolbar,
            }}
        >
            <PneTablePagination
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
                ActionsComponent={StablePaginationActions}
            />
        </PaginationActionsContext.Provider>;
    }
    const skeletonRowCount = paginator?.rowsPerPage || 10;
    const cellPadding = 16; // 8px top + 8px bottom
    const cellBorderHeight = 2; // 1px top + 1px bottom from PneTableRow
    const rememberedGeometry = skeletonGeometryRef.current.get(loadingKey);
    const skeletonGeometry = rememberedGeometry?.columnCount === columnCount
        ? rememberedGeometry
        : undefined;
    const actualSkeletonRowHeight = skeletonGeometry?.rowHeight ?? skeletonRowHeight;
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
    const skeletonTableHeight = showSkeleton && skeletonGeometry?.rowHeight && skeletonGeometry.headerHeight > 0
        ? skeletonGeometry.headerHeight + skeletonGeometry.rowHeight * skeletonRowCount
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

    const skeletonCellContent = (row: number, col: number) => {
        const column = skeletonColumns[col];
        if (column?.hidden) {
            return null;
        }
        const variation = (Math.sin(row * 127.1 + col * 311.7) * 43758.5453 % 1 + 1) % 1;
        // Narrow columns keep bars long enough to read as text, yet short enough to show their alignment.
        const width = column?.narrow
            ? `${60 + Math.floor(variation * 30)}%`
            : `${40 + Math.floor(variation * 40)}%`;
        const style: React.CSSProperties | undefined = column?.align === 'right'
            ? {marginLeft: 'auto'}
            : column?.align === 'center'
                ? {marginLeft: 'auto', marginRight: 'auto'}
                : undefined;
        return <Skeleton variant="rounded" width={width} height={skeletonItemHeight} style={style} />;
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
                ref={tableRef}
                aria-busy={showSkeleton}
                aria-label={tableAriaLabel}
                aria-labelledby={tableAriaLabelledBy}
                stickyHeader={stickyHeader}
                sx={{...tableSx, ...(skeletonTableHeight ? {height: skeletonTableHeight} : {})}}
            >
                {showSkeleton && skeletonGeometry?.columnPercents && (
                    <colgroup>
                        {skeletonGeometry.columnPercents.map((percent, i) => (
                            <col key={i} style={{width: `${percent}%`}} />
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
