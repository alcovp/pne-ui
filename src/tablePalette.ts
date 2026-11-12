import type {PneBrandRamp} from './brandRamp'
import {createPneLinkColor} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Table colours by UI Kit (Claude) role (Cell, Table row): the text of a cell, the hairline under
 * a row and under the header, the fill of a row under the pointer and of a picked row, the sort
 * sign of a header (the direction in force reads as a link, the other one is dimmed), the shells of
 * the control bands and the sign of an empty table. The buttons of the bands take the colours of
 * `button.text` (UI Kit Tertiary) and, for the current page size, of `button.primary`.
 */
export type PneTablePalette = {
    /** The text of a body cell. */
    text: string
    /** The 1px line under each row and under the header. */
    line: string
    row: {
        hover: string
        selected: string
    }
    header: {
        text: string
    }
    sort: {
        /** The direction the column is sorted in. */
        active: string
        /** The other direction of a sorted column. */
        inactive: string
        /** Both arrows of a column that is not sorted. */
        idle: string
    }
    /** The bands of controls over and under a table. */
    band: {
        /** The white shell of a group of actions: the pagination, the page sizes (UI Kit Button group). */
        shell: {fill: string, ring: string}
        /** The grey shell of the views (UI Kit Tabs); the picked view is a white button on it. */
        tabs: {fill: string, ring: string}
    }
    /** A bar that stands for a line of text while the rows load (UI Kit Skeleton/Line). */
    skeleton: string
    /** The sign of an empty table (UI Kit Empty state): a glyph in a round fill. */
    empty: {
        fill: string
        icon: string
    }
}

const createLight = (ramp: PneBrandRamp): PneTablePalette => {
    const n = PNE_NEUTRAL_RAMP
    return {
        text: n[900],
        line: n[200],
        row: {hover: n[100], selected: ramp[100]},
        header: {text: n[900]},
        sort: {active: createPneLinkColor(ramp, 'light'), inactive: n[400], idle: n[600]},
        band: {
            shell: {fill: n[0], ring: n[200]},
            tabs: {fill: n[100], ring: n[200]},
        },
        skeleton: n[100],
        empty: {fill: n[100], icon: n[700]},
    }
}

const createDark = (ramp: PneBrandRamp): PneTablePalette => {
    const d = PNE_DARK_COLORS
    return {
        text: d.textPrimary,
        line: d.borderDefault,
        row: {hover: d.surfaceRaised, selected: ramp[900]},
        header: {text: d.textPrimary},
        sort: {active: createPneLinkColor(ramp, 'dark'), inactive: d.textDisabled, idle: d.textMuted},
        band: {
            shell: {fill: d.backgroundPaper, ring: d.borderDefault},
            tabs: {fill: d.surfaceSubtle, ring: d.borderDefault},
        },
        skeleton: d.surfaceSubtle,
        empty: {fill: d.surfaceSubtle, icon: d.textSecondary},
    }
}

export const createPneTablePalette = (ramp: PneBrandRamp, mode: PneColorMode): PneTablePalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
