import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import Box from "@mui/material/Box";
import {Icon, IconButton, SxProps} from "@mui/material";
import {PaginatorProps} from "./AbstractTable";
import PneFirstPageIcon from "./PneFirstPageIcon";
import PnePreviousPageIcon from "./PnePreviousPageIcon";
import PneNextPageIcon from "./PneNextPageIcon";
import {createAutoTestAttributes} from "../AutoTestAttribute";
import {
    TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
    TABLE_CONTROL_TEXT_COLOR,
} from "./tableControlColors";
import {usePneTheme} from "../../usePneTheme";
import {measureNaturalWidth} from "./measureNaturalWidth";

interface IPaginationActionsProps {
    count: number
    page: number
    rowsPerPage: number
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number
    ) => void
    paginator: PaginatorProps
    shouldRequestScroll: boolean
    toolbar?: React.ReactNode
    toolbarElementKey?: React.Key | null
    toolbarElementType?: unknown
}

const CONTROL_SIZE = 40
const CONTROL_GAP = 8
const DISPLAYED_ROWS_MAX_WIDTH = 120

/**
 * The band places its rows with a container query, whose threshold is the width
 * the controls need to share a single row. That width is measured from the
 * content - the natural widths of the toolbar, the navigation and the page
 * sizes - so it holds for whatever the consumer put in the toolbar and for
 * whatever the current locale makes of the labels. Across this library's own
 * fixtures it ranges from ~590px for a lone View selector to ~1330px for the
 * gates control band, which is why it cannot be a constant.
 *
 * Nothing here measures a rendered layout, so the threshold cannot move in
 * response to the layout it selects: a natural width is a property of the
 * content alone. The measurement therefore runs when the content changes, never
 * on resize, and `container-type: inline-size` keeps the container's width
 * independent of what the band renders into it.
 *
 * Until the first measurement lands the band stays on one row; consumers can
 * pin the threshold through `PaginatorProps.controlRowBreakpoints`.
 */
const useControlRowThreshold = (
    refs: {
        navigation: React.RefObject<HTMLDivElement | null>
        pageSizes: React.RefObject<HTMLDivElement | null>
        toolbar: React.RefObject<HTMLDivElement | null>
    },
    gap: number,
) => {
    const [threshold, setThreshold] = useState(0)

    useLayoutEffect(() => {
        const measure = () => {
            const toolbarContent = refs.toolbar.current?.firstElementChild
            const naturalWidth = measureNaturalWidth(refs.navigation.current)
                + measureNaturalWidth(refs.pageSizes.current)
                + measureNaturalWidth(toolbarContent as HTMLElement | null)
            const gaps = refs.toolbar.current ? gap * 2 : gap

            setThreshold(current => {
                const next = naturalWidth > 0 ? Math.ceil(naturalWidth + gaps) : 0

                return current === next ? current : next
            })
        }

        measure()

        /*
         * Web fonts land after the first layout and change every label width, so
         * the thresholds measured before they arrive are short.
         */
        const fonts = refs.navigation.current?.ownerDocument?.fonts

        if (!fonts || fonts.status === 'loaded') {
            return
        }

        let cancelled = false

        fonts.ready.then(() => {
            if (!cancelled) {
                measure()
            }
        })

        return () => {
            cancelled = true
        }
    })

    return threshold
}
const PAGINATION_ROWS_BREAKPOINT = 340

const PneTablePaginationActions = (props: IPaginationActionsProps) => {
    const {
        // count,
        page,
        rowsPerPage,
        onPageChange,
        paginator,
        shouldRequestScroll,
        toolbar,
        toolbarElementKey,
        toolbarElementType,
    } = props;

    const {
        hasNext,
        disableActions,
        rowsPerPageOptions,
        onPageSizeChange,
        displayedRowsLabel,
        requestScrollToPagination,
        activeActionSx = {},
        controlRowBreakpoints,
    } = paginator;

    const theme = usePneTheme()
    const controlTextColor = theme.palette.mode === 'dark'
        ? theme.palette.text.secondary
        : TABLE_CONTROL_TEXT_COLOR
    const activeBackgroundColor = theme.palette.mode === 'dark'
        ? theme.palette.pne.surface.subtle
        : TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR

    const buttonStyle = {
        width: `${CONTROL_SIZE}px`,
        height: `${CONTROL_SIZE}px`,
        flexShrink: 0,
        borderRadius: '4px',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: controlTextColor,
        '&:hover': {
            background: activeBackgroundColor,
            ...activeActionSx
        },
    }

    const selectedButtonStyle = {
        ...buttonStyle,
        background: activeBackgroundColor,
        ...activeActionSx
    }

    const displayedRowsStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8px',
        boxSizing: 'border-box',
        flex: '0 1 auto',
        width: 'auto',
        maxWidth: `${DISPLAYED_ROWS_MAX_WIDTH}px`,
        minWidth: `${CONTROL_SIZE}px`,
        height: `${CONTROL_SIZE}px`,
        overflow: 'hidden',
        borderRadius: '4px',
        background: activeBackgroundColor,
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: controlTextColor,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...activeActionSx
    } as SxProps

    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page + 1);
    };

    const handleChangePageSizeButtonClick = (size: number) => {
        onPageSizeChange(size);
    };

    const populateRowsPerPageOptions = () => {
        return rowsPerPageOptions.map((option, index) => {
            let size: number;
            let label: string;
            if (typeof option === 'number') {
                size = option;
                label = option.toString();
            } else {
                // size = option.value;
                // label = option.label;
                throw new Error('Uncomment RowsPerPageOption type to do like this');
            }
            const selected = rowsPerPage === size;
            return <IconButton
                key={label}
                sx={selected ? selectedButtonStyle : buttonStyle}
                onClick={() => handleChangePageSizeButtonClick(size)}
                {...createAutoTestAttributes('page-size', label)}
            >
                {label}
            </IconButton>
        })
    }

    const hasToolbar = toolbar !== undefined
        && toolbar !== null
        && typeof toolbar !== 'boolean'
    const navigationRef = useRef<HTMLDivElement>(null)
    const pageSizesRef = useRef<HTMLDivElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)
    const measuredThreshold = useControlRowThreshold(
        {navigation: navigationRef, pageSizes: pageSizesRef, toolbar: toolbarRef},
        CONTROL_GAP,
    )
    const toolbarRowBreakpoint = controlRowBreakpoints?.toolbar ?? measuredThreshold

    const navigationElement = <Box
        {...createAutoTestAttributes('page-navigation')}
        key='page-navigation'
        ref={navigationRef}
        sx={{
            display: 'flex',
            gridArea: 'navigation',
            justifySelf: 'start',
            /* Holds the start of the row when the pagination group wraps. */
            marginRight: 'auto',
            minWidth: 0,
        }}
    >
        <IconButton
            sx={buttonStyle}
            onClick={handleFirstPageButtonClick}
            disabled={disableActions || page === 0}
            aria-label="first page"
            {...createAutoTestAttributes('first-page')}
        >
            <PneFirstPageIcon disabled={disableActions || page === 0}/>
        </IconButton>
        <IconButton
            sx={buttonStyle}
            onClick={handleBackButtonClick}
            disabled={disableActions || page === 0}
            aria-label="previous page"
            {...createAutoTestAttributes('prev-page')}
        >
            <PnePreviousPageIcon disabled={disableActions || page === 0}/>
        </IconButton>
        <Icon
            sx={displayedRowsStyle}
            {...createAutoTestAttributes('current-page')}
        >
            {displayedRowsLabel}
        </Icon>
        <IconButton
            sx={buttonStyle}
            onClick={handleNextButtonClick}
            disabled={disableActions || !hasNext}
            aria-label="next page"
            {...createAutoTestAttributes('next-page')}
        >
            <PneNextPageIcon disabled={disableActions || !hasNext}/>
        </IconButton>
    </Box>

    const toolbarElement = hasToolbar ? <Box
        {...createAutoTestAttributes('pagination-toolbar')}
        key='pagination-toolbar'
        ref={toolbarRef}
        sx={{
            alignItems: 'center',
            display: 'flex',
            gridArea: 'toolbar',
            justifyContent: 'flex-end',
            justifySelf: 'stretch',
            minWidth: 0,
        }}
    >
        {toolbar}
    </Box> : null

    const pageSizesElement = <Box
        key='page-sizes'
        ref={pageSizesRef}
        sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gridArea: 'sizes',
            justifyContent: 'flex-end',
            justifySelf: 'end',
            minWidth: 0,
        }}
        {...createAutoTestAttributes('page-sizes', rowsPerPage)}
    >
        {populateRowsPerPageOptions()}
    </Box>

    /*
     * The two halves of the pagination are one group, so the toolbar can never
     * come between them. Above the threshold the group is transparent and its
     * halves take the outer grid areas with the toolbar in the middle; below it
     * the group becomes a row of its own that wraps by content - the page sizes
     * drop under the navigation exactly when they stop fitting beside it, at
     * whatever width that is for the current locale and page label.
     *
     * DOM order is toolbar first, which is the visual order of every wrapped
     * layout. Only the single-row layout reads navigation-toolbar-sizes, and
     * there all three sit side by side.
     */
    const paginationGroup = <Box
        key='pagination-group'
        sx={{
            alignItems: 'center',
            display: 'contents',
            [`@container (width < ${toolbarRowBreakpoint}px)`]: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${CONTROL_GAP}px`,
                gridArea: 'pagination',
                justifyContent: 'flex-end',
                minWidth: 0,
            },
        }}
    >
        {navigationElement}
        {pageSizesElement}
    </Box>

    return <Box
        sx={{
            /*
             * Establishes the query container. It has to be an ancestor of the
             * band: `@container` rules apply to descendants, not to the container
             * element itself.
             */
            containerType: 'inline-size',
            minWidth: 0,
            width: '100%',
        }}
    >
        <Box
            {...createAutoTestAttributes('pagination-actions')}
            sx={{
                alignItems: 'center',
                display: 'grid',
                gap: `${CONTROL_GAP}px`,
                gridTemplateAreas: hasToolbar
                    ? '"navigation toolbar sizes"'
                    : '"navigation sizes"',
                gridTemplateColumns: hasToolbar
                    ? 'auto minmax(0, 1fr) auto'
                    : 'minmax(0, 1fr) auto',
                minWidth: 0,
                width: '100%',
                [`@container (width < ${toolbarRowBreakpoint}px)`]: {
                    gridTemplateAreas: hasToolbar
                        ? '"toolbar" "pagination"'
                        : '"pagination"',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                },
            }}
        >
            {toolbarElement}
            {paginationGroup}
        </Box>
    </Box>
}

export default PneTablePaginationActions;
