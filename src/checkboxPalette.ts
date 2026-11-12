import type {PneBrandRamp} from './brandRamp'
import {brandFillStep, brandFillSteps, deeperStep, labelOnFill, readableBrandStep, readsOnDarkSurfaces} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, PNE_STATUS_COLORS, type PneColorMode} from './themeColors'

/**
 * Checkbox colours by UI Kit (Claude) role: the box fill, its 1.5px ring and the check mark, for the
 * off and on values (indeterminate looks like on). Hover and pressed reuse the primary button
 * steps, so the same three skin rules keep any skin usable.
 */
export type PneCheckboxState = 'default' | 'hover' | 'pressed' | 'error' | 'disabled' | 'readOnly'

export type PneCheckboxStateColors = {
    fill: string
    /** The ring of the box; `transparent` on a filled box means the fill colour. */
    ring: string
    /** The check mark or the indeterminate bar; `transparent` when the box is off. */
    mark: string
}

export type PneCheckboxValueColors = Record<PneCheckboxState, PneCheckboxStateColors>

export type PneCheckboxPalette = {
    off: PneCheckboxValueColors
    on: PneCheckboxValueColors
    /** The text beside the box of a labelled checkbox: the label and the description under it. */
    text: {
        label: string
        helper: string
        /** The description of a checkbox in error. */
        error: string
        disabled: string
    }
    /** The Frame layout of a labelled checkbox: a card, tinted and ringed when picked. */
    card: {
        fill: string
        fillOn: string
        ringOn: string
        ringHover: string
        ringError: string
    }
}

const TRANSPARENT = 'transparent'
const WHITE = '#FFFFFF'

const off = (fill: string, ring: string): PneCheckboxStateColors => ({fill, ring, mark: TRANSPARENT})

const createLight = (ramp: PneBrandRamp): PneCheckboxPalette => {
    const ring = readableBrandStep(ramp, 600, 'light')
    const steps = brandFillSteps(ramp, 'light')
    const n = PNE_NEUTRAL_RAMP
    const error = PNE_STATUS_COLORS.error[600]
    // The UI Kit mark is the canvas colour; rule 3 makes it dark on a light skin fill.
    const on = (fill: string): PneCheckboxStateColors => {
        const label = labelOnFill(fill, 'light')
        return {fill, ring: TRANSPARENT, mark: label === WHITE ? n[50] : label}
    }
    const plain = (fill: string): PneCheckboxStateColors => ({fill, ring: TRANSPARENT, mark: n[50]})
    return {
        off: {
            default: off(n[50], n[400]),
            hover: off(n[50], ramp[ring]),
            pressed: off(ramp[100], ramp[deeperStep(800, ring, 'light')]),
            error: off(n[50], error),
            disabled: off(n[100], n[200]),
            readOnly: off(n[100], n[200]),
        },
        on: {
            default: on(ramp[brandFillStep('light')]),
            hover: on(ramp[steps.hover]),
            pressed: on(ramp[steps.pressed]),
            error: plain(error),
            disabled: plain(n[400]),
            readOnly: plain(n[500]),
        },
        text: {label: n[900], helper: n[600], error: PNE_STATUS_COLORS.error[700], disabled: n[400]},
        card: {fill: n[100], fillOn: ramp[100], ringOn: ramp[ring], ringHover: n[200], ringError: error},
    }
}

const createDark = (ramp: PneBrandRamp): PneCheckboxPalette => {
    const fill = ramp[brandFillStep('dark')]
    const steps = brandFillSteps(ramp, 'dark')
    // A fill that does not read on the dark surfaces gets a ring that does.
    const brandRing = readsOnDarkSurfaces(fill) ? TRANSPARENT : ramp[readableBrandStep(ramp, 500, 'dark')]
    const d = PNE_DARK_COLORS
    const error = PNE_STATUS_COLORS.error
    const on = (color: string): PneCheckboxStateColors => ({fill: color, ring: brandRing, mark: labelOnFill(color, 'dark')})
    // Error and neutral fills carry a page-coloured mark.
    const plain = (color: string): PneCheckboxStateColors => ({fill: color, ring: TRANSPARENT, mark: d.backgroundDefault})
    return {
        off: {
            default: off(TRANSPARENT, d.borderControl),
            hover: off(TRANSPARENT, ramp[readableBrandStep(ramp, 400, 'dark')]),
            pressed: off(ramp[900], ramp[readableBrandStep(ramp, 300, 'dark')]),
            error: off(TRANSPARENT, error[400]),
            disabled: off(d.surfaceSubtle, d.borderDefault),
            readOnly: off(d.surfaceRaised, d.borderControl),
        },
        on: {
            default: on(fill),
            hover: on(ramp[steps.hover]),
            pressed: on(ramp[steps.pressed]),
            error: plain(error[500]),
            disabled: plain(d.borderControl),
            readOnly: plain(d.textMuted),
        },
        text: {label: d.textPrimary, helper: d.textSecondary, error: error[300], disabled: d.textDisabled},
        card: {
            fill: d.surfaceSubtle,
            fillOn: ramp[900],
            ringOn: ramp[readableBrandStep(ramp, 400, 'dark')],
            ringHover: d.borderDefault,
            ringError: error[400],
        },
    }
}

export const createPneCheckboxPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneCheckboxPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
