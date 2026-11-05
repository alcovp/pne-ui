import {alpha, getContrastRatio} from '@mui/material/styles'
import {PNE_BRAND_RAMP_STEPS, type PneBrandRamp, type PneBrandRampStep} from './brandRamp'
import {
    PNE_DARK_COLORS,
    PNE_LIGHT_COLORS,
    PNE_NEUTRAL_RAMP,
    PNE_STATUS_COLORS,
    type PneColorMode,
    type PneStatusRamp,
} from './themeColors'

/**
 * Button colours by UI Kit (Claude) role: `btn-<variant>-<fill|border|text>-<state>`, built from
 * the brand ramp of the skin. The icon takes the text colour. Three rules keep any skin usable:
 * 1. brand as text or ring on the page: the first step that reads at 3:1, darker in the light
 *    theme and lighter in the dark one;
 * 2. a skin whose darker steps are not distinguishable (near black): hover and pressed go lighter;
 * 3. the label on a fill: white when it reads at 3:1, dark otherwise.
 */
export type PneButtonVariant = 'primary' | 'outline' | 'text' | 'soft' | 'destructive' | 'warning'

export type PneButtonState = 'default' | 'hover' | 'pressed' | 'disabled'

export type PneButtonStateColors = {
    fill: string
    /** The 1px inset ring; `transparent` means none. */
    border: string
    text: string
}

export type PneButtonVariantColors = Record<PneButtonState, PneButtonStateColors>

export type PneButtonPalette = Record<PneButtonVariant, PneButtonVariantColors>

const TRANSPARENT = 'transparent'
const MIN_UI_CONTRAST = 3
const DISTINCT_STEP_CONTRAST = 1.15

const LIGHT_SURFACES = ['#FFFFFF', PNE_LIGHT_COLORS.surfaceSubtle] as const
const DARK_SURFACES = [
    PNE_DARK_COLORS.backgroundDefault,
    PNE_DARK_COLORS.backgroundPaper,
    PNE_DARK_COLORS.surfaceSunken,
    PNE_DARK_COLORS.surfaceSubtle,
    PNE_DARK_COLORS.surfaceRaised,
] as const

const readsOn = (color: string, surfaces: readonly string[]): boolean =>
    surfaces.every(surface => getContrastRatio(color, surface) >= MIN_UI_CONTRAST)

/** Rule 1: the first step from `step` away from the page that reads at 3:1 on the page surfaces. */
export const readableBrandStep = (
    ramp: PneBrandRamp,
    step: PneBrandRampStep,
    mode: PneColorMode,
): PneBrandRampStep => {
    const order = mode === 'dark' ? [...PNE_BRAND_RAMP_STEPS].reverse() : [...PNE_BRAND_RAMP_STEPS]
    const surfaces = mode === 'dark' ? DARK_SURFACES : LIGHT_SURFACES
    const candidates = order.slice(Math.max(order.indexOf(step), 0))
    return candidates.find(candidate => readsOn(ramp[candidate], surfaces)) ?? candidates[candidates.length - 1]
}

/** The step at least as far from the page as `floor`: the darker one in light, the lighter in dark. */
const atLeast = (step: PneBrandRampStep, floor: PneBrandRampStep, mode: PneColorMode): PneBrandRampStep =>
    (mode === 'dark' ? Math.min(step, floor) : Math.max(step, floor)) as PneBrandRampStep

/** Rule 3: the label colour on a fill. */
export const labelOnFill = (fill: string, mode: PneColorMode): string => {
    if (mode === 'dark') {
        return getContrastRatio(fill, '#000000') >= getContrastRatio(fill, '#FFFFFF') ? '#000000' : '#FFFFFF'
    }
    return getContrastRatio(fill, '#FFFFFF') >= MIN_UI_CONTRAST ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)'
}

/** Rule 2: hover and pressed steps of a brand fill. */
const fillStateSteps = (ramp: PneBrandRamp, mode: PneColorMode): {hover: PneBrandRampStep, pressed: PneBrandRampStep} => {
    const darkerIsVisible = getContrastRatio(ramp[500], ramp[600]) >= DISTINCT_STEP_CONTRAST
    if (mode === 'dark') return {hover: 400, pressed: darkerIsVisible ? 600 : 300}
    return darkerIsVisible ? {hover: 600, pressed: 700} : {hover: 400, pressed: 300}
}

const filled = (fill: string, mode: PneColorMode, border = TRANSPARENT): PneButtonStateColors => ({
    fill,
    border,
    text: labelOnFill(fill, mode),
})

const createPrimary = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    const steps = fillStateSteps(ramp, mode)
    // In the dark theme a fill that does not read on the surfaces gets a ring that does.
    const ring = mode === 'dark' && !readsOn(ramp[500], DARK_SURFACES)
        ? ramp[readableBrandStep(ramp, 500, mode)]
        : TRANSPARENT
    return {
        default: filled(ramp[500], mode, ring),
        hover: filled(ramp[steps.hover], mode, ring),
        pressed: filled(ramp[steps.pressed], mode, ring),
        disabled: mode === 'dark'
            ? {fill: PNE_DARK_COLORS.actionDisabledBackground, border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled}
            : {fill: PNE_NEUTRAL_RAMP[400], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[0]},
    }
}

const createOutline = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    if (mode === 'dark') {
        const border = readableBrandStep(ramp, 400, mode)
        const text = readableBrandStep(ramp, 300, mode)
        return {
            default: {fill: TRANSPARENT, border: ramp[border], text: ramp[text]},
            hover: {fill: TRANSPARENT, border: ramp[atLeast(300, border, mode)], text: ramp[text]},
            pressed: {fill: TRANSPARENT, border: ramp[atLeast(300, border, mode)], text: ramp[atLeast(200, text, mode)]},
            disabled: {fill: TRANSPARENT, border: PNE_DARK_COLORS.textDisabled, text: PNE_DARK_COLORS.textDisabled},
        }
    }
    const base = readableBrandStep(ramp, 500, mode)
    const pressed = atLeast(700, base, mode)
    return {
        default: {fill: TRANSPARENT, border: ramp[base], text: ramp[base]},
        hover: {fill: TRANSPARENT, border: ramp[pressed], text: ramp[base]},
        pressed: {fill: TRANSPARENT, border: ramp[pressed], text: ramp[pressed]},
        disabled: {fill: TRANSPARENT, border: PNE_NEUTRAL_RAMP[400], text: PNE_NEUTRAL_RAMP[400]},
    }
}

// Tertiary: the light tab group without its Active state; neutral, so every skin reads the same.
const createText = (mode: PneColorMode): PneButtonVariantColors => mode === 'dark'
    ? {
        default: {fill: PNE_DARK_COLORS.surfaceSubtle, border: TRANSPARENT, text: PNE_DARK_COLORS.textSecondary},
        hover: {fill: PNE_DARK_COLORS.surfaceRaised, border: TRANSPARENT, text: PNE_DARK_COLORS.textPrimary},
        pressed: {fill: PNE_DARK_COLORS.surfacePressed, border: TRANSPARENT, text: PNE_DARK_COLORS.textPrimary},
        disabled: {fill: TRANSPARENT, border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled},
    }
    : {
        default: {fill: PNE_NEUTRAL_RAMP[50], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[800]},
        hover: {fill: PNE_NEUTRAL_RAMP[100], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[900]},
        pressed: {fill: PNE_NEUTRAL_RAMP[200], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[800]},
        disabled: {fill: TRANSPARENT, border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[400]},
    }

const createSoft = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    if (mode === 'dark') {
        const text = ramp[readableBrandStep(ramp, 300, mode)]
        const pressedText = ramp[atLeast(200, readableBrandStep(ramp, 300, mode), mode)]
        return {
            default: {fill: TRANSPARENT, border: TRANSPARENT, text},
            hover: {fill: alpha(text, 0.10), border: TRANSPARENT, text},
            pressed: {fill: alpha(text, 0.16), border: TRANSPARENT, text: pressedText},
            disabled: {fill: TRANSPARENT, border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled},
        }
    }
    const base = readableBrandStep(ramp, 500, mode)
    return {
        default: {fill: TRANSPARENT, border: TRANSPARENT, text: ramp[base]},
        hover: {fill: ramp[50], border: TRANSPARENT, text: ramp[base]},
        pressed: {fill: ramp[100], border: TRANSPARENT, text: ramp[atLeast(700, base, mode)]},
        disabled: {fill: TRANSPARENT, border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[400]},
    }
}

const createStatus = (colors: PneStatusRamp, mode: PneColorMode): PneButtonVariantColors => mode === 'dark'
    ? {
        default: filled(colors[650], mode),
        hover: filled(colors[500], mode),
        pressed: filled(colors[750], mode),
        disabled: filled(colors[700], mode),
    }
    : {
        default: filled(colors[650], mode),
        hover: filled(colors[750], mode),
        pressed: filled(colors[850], mode),
        disabled: {fill: colors[300], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[0]},
    }

export const createPneButtonPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonPalette => ({
    primary: createPrimary(ramp, mode),
    outline: createOutline(ramp, mode),
    text: createText(mode),
    soft: createSoft(ramp, mode),
    destructive: createStatus(PNE_STATUS_COLORS.error, mode),
    warning: createStatus(PNE_STATUS_COLORS.warning, mode),
})

/** The outer 2px of the keyboard focus ring (UI Kit Focus/Ring: brand 600 light, 300 dark). */
export const createPneFocusRing = (ramp: PneBrandRamp, mode: PneColorMode): string =>
    ramp[readableBrandStep(ramp, mode === 'dark' ? 300 : 600, mode)]

/** Link text (UI Kit Tx/Link: brand 400 light, 200 dark). */
export const createPneLinkColor = (ramp: PneBrandRamp, mode: PneColorMode): string =>
    ramp[readableBrandStep(ramp, mode === 'dark' ? 200 : 400, mode)]
