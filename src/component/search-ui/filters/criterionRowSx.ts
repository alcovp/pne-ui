import type {SystemStyleObject} from '@mui/system'
import type {Theme} from '@mui/material/styles'
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout'
import {searchUIFocusRingSx} from './styled'
import {resolvePneSemanticPalette} from '../../../createTheme'
import {createTableControlActiveStyle, createTableControlShellStyle} from '../../table/tableControlButtonStyle'

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

/*
 * UI Kit Filter row values, 32px each, 4px apart. A dropdown is a field-chip: a box on the tabs fill
 * with a chevron. A picked value is the badge of a multiple field (the autocomplete draws its own by
 * the same palette); a group of values is a neutral badge with no ring. One choice out of a few
 * (`data-pne-tabs`) is a tabs group: 24px buttons on the tabs shell, the picked one white.
 */
const VALUE_CHIP = '& .MuiChip-root:not(.MuiAutocomplete-tag)'
const FIELD_CHIP = `${VALUE_CHIP}.MuiChip-deletable`
const VALUE_BADGE = `${VALUE_CHIP}:not(.MuiChip-deletable):not(.MuiChip-clickable)`

const valuesLookSx = (theme: Theme): SystemStyleObject<Theme> => {
    const pne = resolvePneSemanticPalette(theme)
    const shell = pne.table.band.tabs
    const badge = pne.dropdown.chip
    return {
        [VALUE_CHIP]: {
            backgroundColor: shell.fill,
            borderRadius: '4px',
            color: pne.table.text,
            fontSize: '14px',
            height: '32px',
            lineHeight: '20px',
        },
        [`${VALUE_CHIP} .MuiChip-label`]: {
            paddingLeft: '8px',
            paddingRight: '8px',
        },
        // A field-chip: 4px between the text and the chevron, 4px from the chevron to the edge.
        [`${FIELD_CHIP} .MuiChip-label`]: {
            paddingRight: '4px',
        },
        [`${FIELD_CHIP} .MuiChip-deleteIcon`]: {
            marginLeft: 0,
            marginRight: '4px',
        },
        [VALUE_BADGE]: {
            backgroundColor: badge.fill,
            boxShadow: `inset 0 0 0 1px ${badge.ring}`,
            color: badge.text,
        },
        [`${VALUE_BADGE} .MuiChip-label`]: {
            paddingLeft: '10px',
            paddingRight: '10px',
        },
        [`${VALUE_BADGE}[data-pne-tone="neutral"]`]: {
            backgroundColor: shell.fill,
            boxShadow: 'none',
        },
        '& [data-pne-tabs]': {
            ...createTableControlShellStyle(theme, 'tabs'),
            display: 'inline-flex',
        },
        '& [data-pne-tabs] .MuiChip-root': {
            backgroundColor: 'transparent',
            color: pne.button.text.default.text,
            fontSize: '12px',
            fontWeight: 500,
            height: '24px',
            lineHeight: '16px',
        },
        '& [data-pne-tabs] .MuiChip-root:hover': {
            backgroundColor: 'transparent',
            color: pne.button.text.hover.text,
        },
        '& [data-pne-tabs] .MuiChip-root[aria-pressed="true"]': createTableControlActiveStyle(theme),
    }
}

// One row of the panel grid: a subgrid shares the root's name, icons and values columns. The
// separator is the table's row line, so dark mode gets its colour; without the PNE theme the light
// one stands in.
export const criterionSx: SystemStyleObject<Theme> = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    // UI Kit Filter row: 32px controls with 6px over and under them; a value that wraps keeps the 6px.
    // The line over the row is a part of its box: 1 + 6 + 32 + 6.
    boxSizing: 'border-box',
    minHeight: '45px',
    paddingTop: '6px',
    paddingBottom: '6px',
    // UI Kit Filter row: the content keeps 8px from the left edge of the shell and 4px from the right;
    // the line over the row runs the whole width.
    paddingLeft: '8px',
    paddingRight: '4px',
    // The hairline of the shell over every row; over the first one it closes the header strip.
    borderTop: theme => `1px solid ${resolvePneSemanticPalette(theme).table.band.tabs.ring}`,
    // The look of the values is one for every criterion.
    '&': valuesLookSx,
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
        // The name leads on a phone, the icons stand at the right edge, the value takes a line of its own.
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

// The icons column, first in the row: the reset, then the cross; a row with no cross keeps its place empty.
export const criterionActionsWrapperSx: SystemStyleObject<Theme> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'right',
    },
}
