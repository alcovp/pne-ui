import type {SystemStyleObject} from '@mui/system'
import type {Theme} from '@mui/material/styles'
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout'
import {searchUIFocusRingSx} from './styled'

/*
 * The layout of one criterion row, shared by the real rows (`CriterionContainer`) and the loading
 * skeleton of the panel (`SearchUIFiltersSkeleton`), so a skeleton row is exactly as tall as a real one.
 */

const CRITERION_FOCUS_SELECTOR = [
    '& .MuiFilledInput-root.Mui-focused',
    '& .MuiPickersInputBase-root.Mui-focused',
    '& .MuiAutocomplete-root .MuiOutlinedInput-root.Mui-focused',
    '& .MuiChip-clickable.Mui-focusVisible',
    '& .MuiLink-root.MuiLink-button.Mui-focusVisible',
].join(', ')

// One row of the panel grid: a subgrid shares the root's name, icons and values columns. The
// separator is the table's row line, so dark mode gets its colour; without the PNE theme the light
// one stands in.
export const criterionSx: SystemStyleObject<Theme> = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    minHeight: '40px',
    borderTop: theme => `1px solid ${theme.palette.pne?.border.subtle ?? '#F1F5FA'}`,
    // One focus mark for the controls of every criterion: the pill inputs, the date fields, the
    // autocomplete fields, the clickable chips and the link triggers draw the panel's ring; MUI
    // draws no ring on the first three here (no underline, no border) and its own on the others.
    [CRITERION_FOCUS_SELECTOR]: searchUIFocusRingSx,
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
        columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gridTemplateAreas: `
            "left right"
            "content content"
        `,
        columnGap: '8px',
        rowGap: '8px',
        paddingTop: '8px',
        paddingBottom: '8px',
    },
}

export const criterionLeftWrapperSx: SystemStyleObject<Theme> = {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'left',
    },
}

export const criterionContentWrapperSx = {
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'content',
    },
}

// The icons column: a lone eraser keeps to the value side, the cross sits left of it.
export const criterionActionsWrapperSx: SystemStyleObject<Theme> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'right',
    },
}
