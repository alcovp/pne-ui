import type {PneBrandRamp} from './brandRamp'
import {readableBrandStep} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Dropdown list colours by UI Kit (Claude) role (Dropdown list: the panel under a Select,
 * Multiselect or Autocomplete field) and the chevron of the field that opens it. The check of the
 * picked row is the brand step that reads on the page (rule 1).
 */
export type PneDropdownPalette = {
    panel: {
        fill: string
        /** The 1px inner ring of the panel. */
        ring: string
        shadow: string
    }
    option: {
        text: string
        disabled: string
        /** Hover and the keyboard highlight. */
        hover: string
        /** The picked row of a single select. */
        selected: string
        /** The check at the end of the picked row. */
        check: string
    }
    chevron: {
        default: string
        disabled: string
    }
}

// UI Kit `--elevation-popover`, the same in both modes.
const POPOVER_SHADOW = '0 17px 36px rgba(0,0,0,0.07), 0 6.268px 22.16px rgba(0,0,0,0.0502), '
    + '0 2.104px 9.879px rgba(0,0,0,0.029), 0 0.566px 2.782px rgba(0,0,0,0.0108)'

const createLight = (ramp: PneBrandRamp): PneDropdownPalette => {
    const n = PNE_NEUTRAL_RAMP
    return {
        panel: {fill: n[0], ring: n[100], shadow: POPOVER_SHADOW},
        option: {
            text: n[900],
            disabled: n[400],
            hover: n[50],
            selected: ramp[50],
            check: ramp[readableBrandStep(ramp, 500, 'light')],
        },
        chevron: {default: n[900], disabled: n[400]},
    }
}

const createDark = (ramp: PneBrandRamp): PneDropdownPalette => {
    const d = PNE_DARK_COLORS
    return {
        panel: {fill: d.backgroundPaper, ring: d.borderDefault, shadow: POPOVER_SHADOW},
        option: {
            text: d.textPrimary,
            disabled: d.textDisabled,
            hover: d.surfaceRaised,
            selected: ramp[900],
            check: ramp[readableBrandStep(ramp, 500, 'dark')],
        },
        chevron: {default: d.textPrimary, disabled: d.textDisabled},
    }
}

export const createPneDropdownPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneDropdownPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
