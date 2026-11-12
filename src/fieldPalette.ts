import type {PneBrandRamp} from './brandRamp'
import {readableBrandStep} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, PNE_STATUS_COLORS, type PneColorMode} from './themeColors'

/**
 * Text field colours by UI Kit (Claude) role: `inputs-fill-*` and `inputs-border-*` per state for
 * the Fill variant (grey box) and the Outlined one (no fill, ring only), plus the value,
 * placeholder and helper text. Only the pointer lightens the fill; focus and error are told by the
 * ring. The focus ring is the brand step that reads on the page (rule 1).
 */
export type PneFieldState = 'default' | 'hover' | 'focus' | 'error' | 'disabled'

export type PneFieldStateColors = {
    fill: string
    /** The 1px ring of the box. */
    ring: string
}

export type PneFieldVariantColors = Record<PneFieldState, PneFieldStateColors>

export type PneFieldPalette = {
    fill: PneFieldVariantColors
    outlined: PneFieldVariantColors
    text: {
        value: string
        placeholder: string
        disabled: string
        /** The label above the field (PneField); it keeps this colour in error, as in the UI Kit. */
        label: string
        /** A label beside the field or inside it reads as the value does. */
        mark: string
    }
    helper: {
        text: string
        error: string
    }
}

const TRANSPARENT = 'transparent'

const createLight = (ramp: PneBrandRamp): PneFieldPalette => {
    const n = PNE_NEUTRAL_RAMP
    const focus = ramp[readableBrandStep(ramp, 600, 'light')]
    const error = PNE_STATUS_COLORS.error
    return {
        fill: {
            default: {fill: n[100], ring: n[100]},
            hover: {fill: n[50], ring: n[200]},
            focus: {fill: n[100], ring: focus},
            error: {fill: n[100], ring: error[600]},
            disabled: {fill: n[100], ring: n[100]},
        },
        outlined: {
            default: {fill: n[0], ring: n[200]},
            hover: {fill: n[0], ring: n[500]},
            focus: {fill: n[0], ring: focus},
            error: {fill: n[0], ring: error[600]},
            disabled: {fill: n[0], ring: n[100]},
        },
        text: {
            value: n[900],
            placeholder: n[500],
            disabled: n[400],
            label: n[700],
            mark: n[900],
        },
        helper: {
            text: n[700],
            error: error[700],
        },
    }
}

const createDark = (ramp: PneBrandRamp): PneFieldPalette => {
    const d = PNE_DARK_COLORS
    const focus = ramp[readableBrandStep(ramp, 400, 'dark')]
    const error = PNE_STATUS_COLORS.error
    return {
        fill: {
            default: {fill: d.surfaceRaised, ring: d.surfaceRaised},
            hover: {fill: d.surfaceRaised, ring: d.borderDefault},
            focus: {fill: d.surfaceSunken, ring: focus},
            error: {fill: d.surfaceSunken, ring: error[400]},
            disabled: {fill: d.surfaceSubtle, ring: d.surfaceSubtle},
        },
        outlined: {
            default: {fill: TRANSPARENT, ring: d.borderDefault},
            hover: {fill: TRANSPARENT, ring: d.borderControl},
            focus: {fill: TRANSPARENT, ring: focus},
            error: {fill: TRANSPARENT, ring: error[400]},
            disabled: {fill: TRANSPARENT, ring: d.surfaceRaised},
        },
        text: {
            value: d.textPrimary,
            placeholder: d.textMuted,
            disabled: d.textDisabled,
            label: d.textSecondary,
            mark: d.textPrimary,
        },
        helper: {
            text: d.textSecondary,
            error: error[300],
        },
    }
}

export const createPneFieldPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneFieldPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
