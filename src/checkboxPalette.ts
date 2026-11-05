import type {PneBrandRamp} from './brandRamp'
import {brandFillSteps, deeperStep, labelOnFill, readableBrandStep, readsOnDarkSurfaces} from './buttonPalette'
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
}

const TRANSPARENT = 'transparent'

const off = (fill: string, ring: string): PneCheckboxStateColors => ({fill, ring, mark: TRANSPARENT})

const createLight = (ramp: PneBrandRamp): PneCheckboxPalette => {
    const base = readableBrandStep(ramp, 500, 'light')
    const steps = brandFillSteps(ramp, 'light')
    const n = PNE_NEUTRAL_RAMP
    const error = PNE_STATUS_COLORS.error[500]
    const on = (fill: string): PneCheckboxStateColors => ({fill, ring: TRANSPARENT, mark: labelOnFill(fill, 'light')})
    // Error and neutral fills keep the UI Kit white mark; rule 3 is for skin fills.
    const plain = (fill: string): PneCheckboxStateColors => ({fill, ring: TRANSPARENT, mark: n[0]})
    return {
        off: {
            default: off(n[0], n[400]),
            hover: off(n[0], ramp[base]),
            pressed: off(ramp[50], ramp[deeperStep(700, base, 'light')]),
            error: off(n[0], error),
            disabled: off(n[100], n[200]),
            readOnly: off(n[50], n[200]),
        },
        on: {
            default: on(ramp[500]),
            hover: on(ramp[steps.hover]),
            pressed: on(ramp[steps.pressed]),
            error: plain(error),
            disabled: plain(n[400]),
            readOnly: plain(n[500]),
        },
    }
}

const createDark = (ramp: PneBrandRamp): PneCheckboxPalette => {
    const base = readableBrandStep(ramp, 500, 'dark')
    const steps = brandFillSteps(ramp, 'dark')
    // A fill that does not read on the dark surfaces gets a ring that does.
    const brandRing = readsOnDarkSurfaces(ramp[500]) ? TRANSPARENT : ramp[base]
    const d = PNE_DARK_COLORS
    const error = PNE_STATUS_COLORS.error[500]
    const on = (fill: string): PneCheckboxStateColors => ({fill, ring: brandRing, mark: labelOnFill(fill, 'dark')})
    // Error and neutral fills carry a page-coloured mark, as in the UI Kit dark theme.
    const plain = (fill: string): PneCheckboxStateColors => ({fill, ring: TRANSPARENT, mark: d.backgroundDefault})
    return {
        off: {
            default: off(TRANSPARENT, d.borderControl),
            hover: off(TRANSPARENT, ramp[readableBrandStep(ramp, 400, 'dark')]),
            pressed: off(ramp[900], ramp[readableBrandStep(ramp, 300, 'dark')]),
            error: off(TRANSPARENT, error),
            disabled: off(d.surfaceSubtle, d.borderDefault),
            readOnly: off(d.surfaceRaised, d.borderControl),
        },
        on: {
            default: on(ramp[500]),
            hover: on(ramp[steps.hover]),
            pressed: on(ramp[steps.pressed]),
            error: plain(error),
            disabled: plain(d.borderControl),
            readOnly: plain(d.textMuted),
        },
    }
}

export const createPneCheckboxPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneCheckboxPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
