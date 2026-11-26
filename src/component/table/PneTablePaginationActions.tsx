import React, {useLayoutEffect, useRef, useState} from 'react'
import Box from '@mui/material/Box'
import {Icon, IconButton, SxProps} from '@mui/material'
import {PaginatorProps} from './AbstractTable'
import PneFirstPageIcon from './PneFirstPageIcon'
import PnePreviousPageIcon from './PnePreviousPageIcon'
import PneNextPageIcon from './PneNextPageIcon'
import {createAutoTestAttributes} from '../AutoTestAttribute'
import {
    createTableControlCurrentStyle,
    createTableControlShellStyle,
    createTableControlTextButtonStyle,
} from './tableControlButtonStyle'
import {usePneTheme} from '../../usePneTheme'
import {PNE_LABEL_TRIM, PNE_LABEL_TRIM_SUPPORT} from '../../labelCentring'
import {resolvePneSemanticPalette} from '../../createTheme'
import {measureNaturalWidths} from './measureNaturalWidth'
import {TABLE_CONTROL_GAP, TABLE_CONTROL_SIZE} from './tableControlMetrics'

interface IPaginationActionsProps {
    count: number
    page: number
    rowsPerPage: number
    onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void
    paginator: PaginatorProps
    shouldRequestScroll: boolean
    toolbar?: React.ReactNode
    toolbarElementKey?: React.Key | null
    toolbarElementType?: unknown
}

/** Between the navigation, the toolbar and the page sizes in one row; their rows stand closer. */
const GROUP_GAP = 8
/** `gap` of a box whose groups wrap: rows first, then the groups within a row. */
const WRAPPING_GAP = `${TABLE_CONTROL_GAP}px ${GROUP_GAP}px`
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
    const measuredContentRef = useRef<string | null>(null)

    useLayoutEffect(() => {
        const measure = (force: boolean) => {
            const toolbarContent = refs.toolbar.current?.firstElementChild as HTMLElement | null | undefined
            const parts = [refs.navigation.current, refs.pageSizes.current, toolbarContent]
            // The band renders often (loading, every page); its content changes seldom. The same text in the same
            // number of elements has the same natural width, and is not measured again: each measurement lays the
            // page out at once.
            const content = parts
                .map(part => (part ? `${part.querySelectorAll('*').length}:${part.textContent}` : '-'))
                .join('\u0001')
            if (!force && content === measuredContentRef.current) {
                return
            }
            measuredContentRef.current = content
            const naturalWidth = measureNaturalWidths(parts).reduce((sum, width) => sum + width, 0)
            const gaps = refs.toolbar.current ? gap * 2 : gap

            setThreshold(current => {
                const next = naturalWidth > 0 ? Math.ceil(naturalWidth + gaps) : 0

                return current === next ? current : next
            })
        }

        measure(false)

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
                measure(true)
            }
        })

        return () => {
            cancelled = true
        }
    })

    return threshold
}
const PneTablePaginationActions = (props: IPaginationActionsProps) => {
    const {
        // count,
        page,
        rowsPerPage,
        onPageChange,
        paginator,
        shouldRequestScroll,
        toolbar,
    } = props

    const {
        hasNext,
        disableActions,
        rowsPerPageOptions,
        onPageSizeChange,
        displayedRowsLabel,
        requestScrollToPagination,
        activeActionSx = {},
        controlRowBreakpoints,
    } = paginator

    const theme = usePneTheme()
    // UI Kit Paginations: Button Tertiary sm in the white shell of a button group; the page size in
    // force is Button Primary sm. The range is a label drawn as the buttons beside it.
    const controlStyle = createTableControlTextButtonStyle(theme)
    const controlColors = resolvePneSemanticPalette(theme).button.text
    const shellStyle = createTableControlShellStyle(theme, 'actions')
    const hoverStyle = {
        backgroundColor: controlColors.hover.fill,
        color: controlColors.hover.text,
        ...activeActionSx,
    }

    const buttonStyle = {
        ...controlStyle,
        flexShrink: 0,
        minWidth: `${TABLE_CONTROL_SIZE}px`,
        padding: 0,
        width: `${TABLE_CONTROL_SIZE}px`,
        '&:hover': hoverStyle,
    }

    const pageSizeButtonStyle = {
        ...controlStyle,
        flexShrink: 0,
        minWidth: `${TABLE_CONTROL_SIZE}px`,
        // A label, not a glyph: the button is as wide as its number, whatever box the theme gives an icon button.
        width: 'auto',
        '&:hover': hoverStyle,
    }

    const selectedButtonStyle = {
        ...pageSizeButtonStyle,
        ...createTableControlCurrentStyle(theme),
        ...activeActionSx,
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
        minWidth: `${TABLE_CONTROL_SIZE}px`,
        height: `${TABLE_CONTROL_SIZE}px`,
        overflow: 'hidden',
        borderRadius: '4px',
        background: controlColors.default.fill,
        // The range is text in an icon slot: without a font of its own it takes the font of the page.
        fontFamily: theme.typography.button.fontFamily,
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: controlColors.default.text,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...activeActionSx,
        // The range stands in the middle of its tile at every screen scale (labelCentring.ts).
        [PNE_LABEL_TRIM_SUPPORT]: {
            alignContent: 'center',
            display: 'block',
            // A trimmed line is lower than its letters: clipped along the line only, as the label of a chip.
            overflowX: 'clip',
            overflowY: 'visible',
            textAlign: 'center',
            ...PNE_LABEL_TRIM,
        },
    } as SxProps

    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, 0)
    }

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page - 1)
    }

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page + 1)
    }

    const handleChangePageSizeButtonClick = (size: number) => {
        onPageSizeChange(size)
    }

    const populateRowsPerPageOptions = () => {
        return rowsPerPageOptions.map(option => {
            let size: number
            let label: string
            if (typeof option === 'number') {
                size = option
                label = option.toString()
            } else {
                // size = option.value;
                // label = option.label;
                throw new Error('Uncomment RowsPerPageOption type to do like this')
            }
            const selected = rowsPerPage === size
            return (
                <IconButton
                    key={label}
                    sx={selected ? selectedButtonStyle : pageSizeButtonStyle}
                    onClick={() => handleChangePageSizeButtonClick(size)}
                    {...createAutoTestAttributes('page-size', label)}
                >
                    {label}
                </IconButton>
            )
        })
    }

    const hasToolbar = toolbar !== undefined && toolbar !== null && typeof toolbar !== 'boolean'
    const navigationRef = useRef<HTMLDivElement>(null)
    const pageSizesRef = useRef<HTMLDivElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)
    const measuredThreshold = useControlRowThreshold(
        {navigation: navigationRef, pageSizes: pageSizesRef, toolbar: toolbarRef},
        GROUP_GAP,
    )
    const toolbarRowBreakpoint = controlRowBreakpoints?.toolbar ?? measuredThreshold

    const navigationElement = (
        <Box
            {...createAutoTestAttributes('page-navigation')}
            key='page-navigation'
            ref={navigationRef}
            sx={{
                ...shellStyle,
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
                aria-label='first page'
                {...createAutoTestAttributes('first-page')}
            >
                <PneFirstPageIcon />
            </IconButton>
            <IconButton
                sx={buttonStyle}
                onClick={handleBackButtonClick}
                disabled={disableActions || page === 0}
                aria-label='previous page'
                {...createAutoTestAttributes('prev-page')}
            >
                <PnePreviousPageIcon />
            </IconButton>
            <Icon sx={displayedRowsStyle} {...createAutoTestAttributes('current-page')}>
                {displayedRowsLabel}
            </Icon>
            <IconButton
                sx={buttonStyle}
                onClick={handleNextButtonClick}
                disabled={disableActions || !hasNext}
                aria-label='next page'
                {...createAutoTestAttributes('next-page')}
            >
                <PneNextPageIcon />
            </IconButton>
        </Box>
    )

    const toolbarElement = hasToolbar ? (
        <Box
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
        </Box>
    ) : null

    const pageSizesElement = (
        <Box
            key='page-sizes'
            ref={pageSizesRef}
            sx={{
                ...shellStyle,
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
    )

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
    const paginationGroup = (
        <Box
            key='pagination-group'
            sx={{
                alignItems: 'center',
                display: 'contents',
                [`@container (width < ${toolbarRowBreakpoint}px)`]: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: WRAPPING_GAP,
                    gridArea: 'pagination',
                    justifyContent: 'flex-end',
                    minWidth: 0,
                },
            }}
        >
            {navigationElement}
            {pageSizesElement}
        </Box>
    )

    return (
        <Box
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
                    gap: WRAPPING_GAP,
                    gridTemplateAreas: hasToolbar ? '"navigation toolbar sizes"' : '"navigation sizes"',
                    gridTemplateColumns: hasToolbar ? 'auto minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto',
                    minWidth: 0,
                    width: '100%',
                    [`@container (width < ${toolbarRowBreakpoint}px)`]: {
                        gridTemplateAreas: hasToolbar ? '"toolbar" "pagination"' : '"pagination"',
                        gridTemplateColumns: 'minmax(0, 1fr)',
                    },
                }}
            >
                {toolbarElement}
                {paginationGroup}
            </Box>
        </Box>
    )
}

export default PneTablePaginationActions
