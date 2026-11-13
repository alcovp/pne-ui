import type {Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../../../createTheme'
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_COLUMNS,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout'

/*
 * The panel by the UI Kit Filter: one bordered box with a header strip, the criteria rows and a
 * footer strip. The layout is shared by the panel (`SearchUIFilters`) and its loading skeleton
 * (`SearchUIFiltersSkeleton`), so the skeleton takes exactly the place of the panel.
 */

type Sx = (theme: Theme) => SystemStyleObject<Theme>

/** The fill of the strips and the line of the shell: UI Kit Bg/Tabs and Tabs/Shell border. */
const shellOf = (theme: Theme) => resolvePneSemanticPalette(theme).table.band.tabs

// On phones the main button takes the rest of its line, alone or after the others.
export const searchButtonSx: SystemStyleObject<Theme> = {
    whiteSpace: 'nowrap',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        flexGrow: 1,
    },
}

// The shell: radius 8 inside a 1px line, 16px from the sides of the page as the table under it.
export const rootSx: Sx = theme => ({
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${shellOf(theme).ring}`,
    borderRadius: '8px',
    columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    display: 'grid',
    gridTemplateColumns: SEARCH_UI_FILTERS_COLUMNS,
    mx: '16px',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
})

// The header: a 32px strip on the tabs fill (33px with the line of the first row under it), the name
// and the count on the left, the saved sets and (folded) the actions on the right; folded, the strip
// is the whole panel and takes all four corners.
export const headerSx: Sx = theme => ({
    alignItems: 'center',
    backgroundColor: shellOf(theme).fill,
    borderRadius: '7px 7px 0 0',
    boxSizing: 'border-box',
    columnGap: '8px',
    display: 'flex',
    flexWrap: 'wrap',
    gridColumn: '1 / -1',
    justifyContent: 'space-between',
    minHeight: '32px',
    padding: '4px',
    rowGap: '4px',
    '&[data-pne-folded]': {
        borderRadius: '7px',
    },
})

export const headerGroupSx: SystemStyleObject<Theme> = {
    alignItems: 'center',
    columnGap: '4px',
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
    rowGap: '4px',
}

// The footer: a strip on the tabs fill that shares the columns of the rows, so Add filter starts
// where the values start; the search stands at the right edge.
export const footerSx: Sx = theme => ({
    alignItems: 'center',
    backgroundColor: shellOf(theme).fill,
    borderRadius: '0 0 7px 7px',
    borderTop: `1px solid ${shellOf(theme).ring}`,
    boxSizing: 'border-box',
    display: 'grid',
    gridColumn: '1 / -1',
    gridTemplateColumns: 'subgrid',
    padding: '6px 4px 6px 8px',
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
        columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'space-between',
    },
})

export const footerLeadSx: SystemStyleObject<Theme> = {
    gridColumn: 3,
    gridRow: 1,
    justifySelf: 'start',
    minWidth: 0,
}

export const footerTrailSx: SystemStyleObject<Theme> = {
    alignItems: 'center',
    columnGap: '4px',
    display: 'flex',
    gridColumn: 3,
    gridRow: 1,
    justifySelf: 'end',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
}
