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
// import {usePneTheme} from "../../usePneTheme";

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
}

export type PneTablePaginationActionsLayout =
    | 'inline'
    | 'toolbar-stacked'
    | 'pagination-stacked'

type ResolvePaginationActionsLayoutParams = {
    availableWidth: number
    hasToolbar: boolean
    navigationMinimumWidth: number
    navigationPreferredWidth: number
    pageSizesWidth: number
    toolbarPreferredWidth: number
}

const CONTROL_SIZE = 40
const CONTROL_GAP = 8
const DISPLAYED_ROWS_MAX_WIDTH = 120
const FIXED_NAVIGATION_CONTROLS = 3

const measurePreferredWidth = (element: HTMLElement, ownerDocument: Document): number => {
    const renderedWidth = Math.max(
        element.scrollWidth,
        element.getBoundingClientRect().width,
    )
    const clone = element.cloneNode(true) as HTMLElement
    Object.assign(clone.style, {
        height: 'auto',
        left: '-100000px',
        maxWidth: 'none',
        minWidth: '0',
        pointerEvents: 'none',
        position: 'fixed',
        top: '0',
        visibility: 'hidden',
        width: 'max-content',
    })
    clone.setAttribute('aria-hidden', 'true')
    ownerDocument.body.appendChild(clone)

    try {
        return Math.max(
            renderedWidth,
            clone.scrollWidth,
            clone.getBoundingClientRect().width,
        )
    } finally {
        clone.remove()
    }
}

/**
 * Chooses the smallest layout that keeps each control group on an intentional row.
 * Widths are measured from the rendered content, so consumers are not tied to a
 * viewport breakpoint or to a particular set of view labels/page sizes.
 */
export const resolvePneTablePaginationActionsLayout = ({
    availableWidth,
    hasToolbar,
    navigationMinimumWidth,
    navigationPreferredWidth,
    pageSizesWidth,
    toolbarPreferredWidth,
}: ResolvePaginationActionsLayoutParams): PneTablePaginationActionsLayout => {
    if (availableWidth <= 0) {
        return 'inline'
    }

    const paginationFits = navigationMinimumWidth + CONTROL_GAP + pageSizesWidth
        <= availableWidth

    if (!hasToolbar) {
        return paginationFits ? 'inline' : 'pagination-stacked'
    }

    const allControlsFit = navigationPreferredWidth
        + CONTROL_GAP
        + toolbarPreferredWidth
        + CONTROL_GAP
        + pageSizesWidth
        <= availableWidth

    if (allControlsFit) {
        return 'inline'
    }

    return paginationFits ? 'toolbar-stacked' : 'pagination-stacked'
}

const useResponsiveLayoutEffect = typeof window === 'undefined'
    ? useEffect
    : useLayoutEffect

const PneTablePaginationActions = (props: IPaginationActionsProps) => {
    const {
        // count,
        page,
        rowsPerPage,
        onPageChange,
        paginator,
        shouldRequestScroll,
        toolbar,
    } = props;

    const {
        hasNext,
        disableActions,
        rowsPerPageOptions,
        onPageSizeChange,
        displayedRowsLabel,
        requestScrollToPagination,
        activeActionSx = {},
    } = paginator;

    const rootRef = useRef<HTMLDivElement>(null)
    const navigationRef = useRef<HTMLDivElement>(null)
    const currentPageRef = useRef<HTMLElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)
    const pageSizesRef = useRef<HTMLDivElement>(null)
    const [layout, setLayout] = useState<PneTablePaginationActionsLayout>('inline')

    // const theme = usePneTheme()

    const buttonStyle = {
        width: `${CONTROL_SIZE}px`,
        height: `${CONTROL_SIZE}px`,
        flexShrink: 0,
        borderRadius: '4px',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: TABLE_CONTROL_TEXT_COLOR,
        '&:hover': {
            background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
            ...activeActionSx
        },
    }

    const selectedButtonStyle = {
        ...buttonStyle,
        background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
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
        background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: TABLE_CONTROL_TEXT_COLOR,
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
    const toolbarElementType = React.isValidElement(toolbar)
        ? toolbar.type
        : typeof toolbar
    const toolbarElementKey = React.isValidElement(toolbar)
        ? toolbar.key
        : null

    useResponsiveLayoutEffect(() => {
        const root = rootRef.current

        if (!root) {
            return
        }

        const ownerWindow = root.ownerDocument?.defaultView

        if (!ownerWindow) {
            return
        }

        const measureLayout = () => {
            const availableWidth = root.clientWidth || root.getBoundingClientRect().width

            if (availableWidth <= 0) {
                return
            }

            const currentPage = currentPageRef.current
            const currentPageStyle = currentPage
                ? ownerWindow.getComputedStyle(currentPage)
                : null
            const parsedCurrentPageMaxWidth = Number.parseFloat(
                currentPageStyle?.maxWidth ?? '',
            )
            const currentPageMinimumWidth = Math.max(
                CONTROL_SIZE,
                Number.parseFloat(currentPageStyle?.minWidth ?? '') || 0,
            )
            const currentPageNaturalWidth = currentPage
                ? Math.max(
                    currentPageMinimumWidth,
                    currentPage.scrollWidth,
                    currentPage.getBoundingClientRect().width,
                )
                : currentPageMinimumWidth
            const currentPagePreferredWidth = Number.isFinite(parsedCurrentPageMaxWidth)
                ? Math.min(parsedCurrentPageMaxWidth, currentPageNaturalWidth)
                : currentPageNaturalWidth
            const navigationButtons = navigationRef.current
                ? Array.from(navigationRef.current.querySelectorAll('button'))
                : []
            const fixedNavigationWidth = navigationButtons.length
                ? navigationButtons.reduce((width, button) => (
                    width + Math.max(CONTROL_SIZE, button.getBoundingClientRect().width)
                ), 0)
                : FIXED_NAVIGATION_CONTROLS * CONTROL_SIZE
            const navigationMinimumWidth = fixedNavigationWidth + currentPageMinimumWidth
            const navigationPreferredWidth = fixedNavigationWidth + currentPagePreferredWidth
            const pageSizesElement = pageSizesRef.current
            const pageSizesWidth = Math.max(
                rowsPerPageOptions.length * CONTROL_SIZE,
                pageSizesElement?.scrollWidth ?? 0,
                pageSizesElement?.getBoundingClientRect().width ?? 0,
            )
            const toolbarElement = toolbarRef.current
            const toolbarContent = toolbarElement?.firstElementChild as HTMLElement | null
            const toolbarControlContents = toolbarContent
                ? Array.from(toolbarContent.children) as HTMLElement[]
                : []
            const toolbarPreferredWidth = toolbarControlContents.length > 0
                ? toolbarControlContents.reduce((width, element) => (
                    width + measurePreferredWidth(element, root.ownerDocument)
                ), 0)
                : 0
            const nextLayout = resolvePneTablePaginationActionsLayout({
                availableWidth,
                hasToolbar,
                navigationMinimumWidth,
                navigationPreferredWidth,
                pageSizesWidth,
                toolbarPreferredWidth,
            })

            setLayout(currentLayout => currentLayout === nextLayout
                ? currentLayout
                : nextLayout)
        }

        measureLayout()

        const ResizeObserverCtor = ownerWindow.ResizeObserver

        if (ResizeObserverCtor) {
            const resizeObserver = new ResizeObserverCtor(measureLayout)
            const observedElements = [
                root,
                navigationRef.current,
                currentPageRef.current,
                toolbarRef.current,
                toolbarRef.current?.firstElementChild,
                ...Array.from(toolbarRef.current?.firstElementChild?.children ?? []),
                pageSizesRef.current,
            ]

            observedElements.forEach(element => {
                if (element) {
                    resizeObserver.observe(element)
                }
            })

            return () => resizeObserver.disconnect()
        }

        ownerWindow.addEventListener('resize', measureLayout)
        return () => ownerWindow.removeEventListener('resize', measureLayout)
    }, [hasToolbar, rowsPerPageOptions.length, toolbarElementKey, toolbarElementType])

    const rootGridStyle = layout === 'inline'
        ? {
            gridTemplateColumns: hasToolbar
                ? 'max-content minmax(0, 1fr) max-content'
                : 'minmax(0, 1fr) max-content',
            gridTemplateRows: 'auto',
        }
        : layout === 'toolbar-stacked'
            ? {
                gridTemplateColumns: 'minmax(0, 1fr) max-content',
                gridTemplateRows: 'auto auto',
            }
            : {
                gridTemplateColumns: 'minmax(0, 1fr)',
                gridTemplateRows: hasToolbar ? 'auto auto auto' : 'auto auto',
            }

    const navigationGridStyle = layout === 'inline'
        ? {gridColumn: '1', gridRow: '1'}
        : layout === 'toolbar-stacked'
            ? {gridColumn: '1', gridRow: '2'}
            : {gridColumn: '1', gridRow: hasToolbar ? '2' : '1'}

    const toolbarGridStyle = layout === 'inline'
        ? {gridColumn: '2', gridRow: '1', justifySelf: 'stretch', width: '100%'}
        : {gridColumn: '1 / -1', gridRow: '1', justifySelf: 'stretch', width: '100%'}

    const pageSizesGridStyle = layout === 'inline'
        ? {gridColumn: hasToolbar ? '3' : '2', gridRow: '1'}
        : layout === 'toolbar-stacked'
            ? {gridColumn: '2', gridRow: '2'}
            : {gridColumn: '1', gridRow: hasToolbar ? '3' : '2'}

    const navigationElement = <Box
        {...createAutoTestAttributes('page-navigation')}
        key='page-navigation'
        ref={navigationRef}
        sx={{
            display: 'flex',
            maxWidth: '100%',
            minWidth: 0,
            width: 'max-content',
            ...navigationGridStyle,
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
            ref={currentPageRef}
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
            justifyContent: 'flex-end',
            maxWidth: '100%',
            minWidth: 0,
            ...toolbarGridStyle,
        }}
    >
        {toolbar}
    </Box> : null

    const pageSizesElement = <Box
        key='page-sizes'
        ref={pageSizesRef}
        sx={{
            display: 'flex',
            flexShrink: 0,
            flexWrap: layout === 'pagination-stacked' ? 'wrap' : 'nowrap',
            justifyContent: 'flex-end',
            justifySelf: 'end',
            maxWidth: '100%',
            width: 'max-content',
            ...pageSizesGridStyle,
        }}
        {...createAutoTestAttributes('page-sizes', rowsPerPage)}
    >
        {populateRowsPerPageOptions()}
    </Box>

    const orderedElements = (layout === 'inline'
        ? [navigationElement, toolbarElement, pageSizesElement]
        : [toolbarElement, navigationElement, pageSizesElement]
    ).filter((element): element is React.ReactElement => element !== null)

    return <Box
        {...createAutoTestAttributes('pagination-actions', layout)}
        ref={rootRef}
        sx={{
            alignItems: 'center',
            columnGap: '8px',
            display: 'grid',
            rowGap: '8px',
            width: '100%',
            ...rootGridStyle,
        }}
    >
        {orderedElements}
    </Box>
}

export default PneTablePaginationActions;
