import type {PneBrandRamp} from './brandRamp'
import {createPneLinkColor} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Table colours by UI Kit (Claude) role (Cell, Table row): the text of a cell, the hairline under
 * a row and under the header, the fill of a row under the pointer and of a picked row, and the
 * sort sign of a header (the direction in force reads as a link, the other one is dimmed).
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
}

const createLight = (ramp: PneBrandRamp): PneTablePalette => {
    const n = PNE_NEUTRAL_RAMP
    return {
        text: n[900],
        line: n[200],
        row: {hover: n[100], selected: ramp[100]},
        header: {text: n[900]},
        sort: {active: createPneLinkColor(ramp, 'light'), inactive: n[400], idle: n[600]},
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
    }
}

export const createPneTablePalette = (ramp: PneBrandRamp, mode: PneColorMode): PneTablePalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
