import type {Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_COLUMNS,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout'

/*
 * The panel grid and its actions row, shared by the panel (`SearchUIFilters`) and its loading skeleton
 * (`SearchUIFiltersSkeleton`), so the skeleton takes exactly the place of the panel.
 */

// On phones the main button takes the rest of its line, alone or after the others.
export const searchButtonSx: SystemStyleObject<Theme> = {
    whiteSpace: 'nowrap',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        flexGrow: 1,
    },
}

export const rootSx: SystemStyleObject<Theme> = {
    px: '16px',
    display: 'grid',
    gridTemplateColumns: SEARCH_UI_FILTERS_COLUMNS,
    columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    alignItems: 'center',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
}

// Phones: one flow from the chevron to the last action, wrapped as the width allows; the lead and
// actions boxes dissolve into it.
const phoneActionsRowSx: SystemStyleObject<Theme> = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
}

export const actionsRowSx: SystemStyleObject<Theme> = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    py: '6px',
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
        columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: phoneActionsRowSx,
}

// Collapsed rows, or none at all: the actions go right after the chevron and the count.
export const compactActionsRowSx: SystemStyleObject<Theme> = {
    gridColumn: '1 / -1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '16px',
    rowGap: '8px',
    py: '6px',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: phoneActionsRowSx,
}

export const actionsLeadSx: SystemStyleObject<Theme> = {
    gridColumn: 1,
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        display: 'contents',
    },
}

export const actionsSx: SystemStyleObject<Theme> = {
    gridColumn: 3,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        display: 'contents',
    },
}
