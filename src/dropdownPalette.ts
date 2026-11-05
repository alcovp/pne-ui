import {getContrastRatio} from '@mui/material/styles'
import {PNE_BRAND_RAMP_STEPS, type PneBrandRamp, type PneBrandRampStep} from './brandRamp'
import {readableBrandStep} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, PNE_STATUS_COLORS, type PneColorMode} from './themeColors'

/**
 * Dropdown list colours by UI Kit (Claude) role (Dropdown list: the panel under a Select,
 * Multiselect or Autocomplete field), the chevron of the field that opens it and the value chips of
 * a multiple field (Badge, tone surface). The check of the picked row is the brand step that reads
 * on the page (rule 1).
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
    /** The service rows: loading, nothing found, type more; a failed load reads as an error. */
    status: {
        text: string
        error: string
    }
    chevron: {
        default: string
        disabled: string
    }
    /** A picked value inside a multiple field. */
    chip: {
        fill: string
        ring: string
        text: string
        /** The remove cross. */
        remove: string
    }
}

// The check reads on the page (rule 1) and at 3:1 on the tint of the picked row too: from the readable
// step on, the first one far enough from the tint (lighter in dark, where the tint is a deep brand step).
const checkOnTint = (ramp: PneBrandRamp, tint: string, mode: PneColorMode): string => {
    const order: PneBrandRampStep[] = mode === 'dark' ? [...PNE_BRAND_RAMP_STEPS].reverse() : [...PNE_BRAND_RAMP_STEPS]
    const candidates = order.slice(Math.max(order.indexOf(readableBrandStep(ramp, 500, mode)), 0))
    const step = candidates.find(candidate => getContrastRatio(ramp[candidate], tint) >= 3) ?? candidates[candidates.length - 1]
    return ramp[step]
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
            check: checkOnTint(ramp, ramp[50], 'light'),
        },
        status: {text: n[600], error: PNE_STATUS_COLORS.error[650]},
        chevron: {default: n[900], disabled: n[400]},
        chip: {fill: n[0], ring: n[200], text: n[900], remove: n[600]},
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
            check: checkOnTint(ramp, ramp[900], 'dark'),
        },
        status: {text: d.textMuted, error: PNE_STATUS_COLORS.error[300]},
        chevron: {default: d.textPrimary, disabled: d.textDisabled},
        chip: {fill: d.surfaceSubtle, ring: d.borderDefault, text: d.textPrimary, remove: d.textSecondary},
    }
}

export const createPneDropdownPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneDropdownPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
