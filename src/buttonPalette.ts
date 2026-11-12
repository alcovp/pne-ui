import {alpha} from '@mui/material/styles'
import {
    PNE_BRAND_RAMP_STEPS,
    PNE_LABEL_CONTRAST,
    type PneBrandRamp,
    type PneBrandRampStep,
} from './brandRamp'
import {contrastRatio} from './color'
import {
    PNE_DARK_COLORS,
    PNE_NEUTRAL_RAMP,
    PNE_STATUS_COLORS,
    type PneColorMode,
    type PneStatusRamp,
} from './themeColors'

/**
 * Button colours by UI Kit (Claude) role: `btn-<variant>-<fill|border|text>-<state>`, built from
 * the brand ramp of the skin. The icon takes the text colour. Three rules keep any skin usable:
 * 1. brand as text or ring on the page: the first step that reads there, at 4.5:1 for text and at
 *    3:1 for a ring, darker in the light theme and lighter in the dark one;
 * 2. a skin whose darker steps are not distinguishable (near black): hover and pressed go lighter;
 * 3. the label on a fill: white when it reads at 4.5:1, otherwise the stronger of dark and white.
 */
export type PneButtonVariant =
    | 'primary'
    | 'outline'
    | 'text'
    | 'textDanger'
    | 'textSuccess'
    | 'soft'
    | 'destructive'
    | 'warning'

/** `focus` is also the look of a button that waits for its request. */
export type PneButtonState = 'default' | 'hover' | 'pressed' | 'focus' | 'disabled'

export type PneButtonStateColors = {
    fill: string
    /** The 1px inset ring; `transparent` means none. */
    border: string
    text: string
    /** The outer shadow that lifts the button; only Active has one. */
    shadow?: string
}

export type PneButtonVariantColors = Record<PneButtonState, PneButtonStateColors> & {
    /** The picked item of a set, such as a tab or the current page; `text` only. */
    active?: PneButtonStateColors
    /** The one-way result of an activation, a status rather than an action; `textSuccess` only. */
    activated?: PneButtonStateColors
}

export type PneButtonPalette = Record<PneButtonVariant, PneButtonVariantColors>

const TRANSPARENT = 'transparent'
const WHITE = '#FFFFFF'
const BLACK = '#000000'
const DARK_LABEL = 'rgba(0, 0, 0, 0.87)'
const MIN_UI_CONTRAST = 3
const DISTINCT_STEP_CONTRAST = 1.15
// UI Kit `--elevation-item-active`.
const ACTIVE_SHADOW = '0px 0px 4px 0px rgba(0,0,0,0.04), 0px 4px 8px 0px rgba(0,0,0,0.06)'

const LIGHT_SURFACES = [WHITE, PNE_NEUTRAL_RAMP[100]] as const
const DARK_SURFACES = [
    PNE_DARK_COLORS.backgroundDefault,
    PNE_DARK_COLORS.backgroundPaper,
    PNE_DARK_COLORS.surfaceSunken,
    PNE_DARK_COLORS.surfaceSubtle,
    PNE_DARK_COLORS.surfaceRaised,
] as const

const readsOn = (color: string, surfaces: readonly string[], minimum = MIN_UI_CONTRAST): boolean =>
    surfaces.every(surface => contrastRatio(color, surface) >= minimum)

/** Whether a fill is distinguishable (3:1) from every dark-theme surface. */
export const readsOnDarkSurfaces = (color: string): boolean => readsOn(color, DARK_SURFACES)

/**
 * Rule 1: the first step from `step` away from the page that reads on the page surfaces, at 3:1
 * for a ring or a mark and at 4.5:1 (`PNE_LABEL_CONTRAST`) for text.
 */
export const readableBrandStep = (
    ramp: PneBrandRamp,
    step: PneBrandRampStep,
    mode: PneColorMode,
    minimum = MIN_UI_CONTRAST,
): PneBrandRampStep => {
    const order = mode === 'dark' ? [...PNE_BRAND_RAMP_STEPS].reverse() : [...PNE_BRAND_RAMP_STEPS]
    const surfaces = mode === 'dark' ? DARK_SURFACES : LIGHT_SURFACES
    const candidates = order.slice(Math.max(order.indexOf(step), 0))
    return candidates.find(candidate => readsOn(ramp[candidate], surfaces, minimum)) ?? candidates[candidates.length - 1]
}

/** The step at least as far from the page as `floor`: the darker one in light, the lighter in dark. */
export const deeperStep = (step: PneBrandRampStep, floor: PneBrandRampStep, mode: PneColorMode): PneBrandRampStep =>
    (mode === 'dark' ? Math.min(step, floor) : Math.max(step, floor)) as PneBrandRampStep

/** Rule 3: the label colour on a fill. */
export const labelOnFill = (fill: string, mode: PneColorMode): string => {
    const whiteContrast = contrastRatio(fill, WHITE)
    const darkIsStronger = contrastRatio(fill, BLACK) >= whiteContrast
    if (mode === 'dark') return darkIsStronger ? BLACK : WHITE
    if (whiteContrast >= PNE_LABEL_CONTRAST) return WHITE
    return darkIsStronger ? DARK_LABEL : WHITE
}

/**
 * The knob of a switch or another solid mark on a fill: white, as in the UI Kit, while it reads
 * at 3:1, dark on a light fill.
 */
export const markOnFill = (fill: string): string =>
    contrastRatio(fill, WHITE) >= MIN_UI_CONTRAST ? WHITE : DARK_LABEL

/** The step a brand fill takes: 600 in the light theme, the lighter 500 on the dark surfaces. */
export const brandFillStep = (mode: PneColorMode): PneBrandRampStep => mode === 'dark' ? 500 : 600

/** Rule 2: hover and pressed steps of a brand fill. */
export const brandFillSteps = (ramp: PneBrandRamp, mode: PneColorMode): {hover: PneBrandRampStep, pressed: PneBrandRampStep} => {
    if (mode === 'dark') {
        const darkerIsVisible = contrastRatio(ramp[500], ramp[600]) >= DISTINCT_STEP_CONTRAST
        return {hover: 400, pressed: darkerIsVisible ? 600 : 300}
    }
    const darkerIsVisible = contrastRatio(ramp[600], ramp[700]) >= DISTINCT_STEP_CONTRAST
    return darkerIsVisible ? {hover: 700, pressed: 800} : {hover: 500, pressed: 400}
}

/** The brand text of the light theme: UI Kit step 700, pressed 800, moved by rule 1. */
const lightBrandText = (ramp: PneBrandRamp): {text: string, pressed: string} => {
    const step = readableBrandStep(ramp, 700, 'light', PNE_LABEL_CONTRAST)
    return {text: ramp[step], pressed: ramp[deeperStep(800, step, 'light')]}
}

/** The brand text of the dark theme: step 300, pressed 200, moved by rule 1. */
const darkBrandText = (ramp: PneBrandRamp): {text: string, pressed: string} => {
    const step = readableBrandStep(ramp, 300, 'dark', PNE_LABEL_CONTRAST)
    return {text: ramp[step], pressed: ramp[deeperStep(200, step, 'dark')]}
}

const filled = (fill: string, mode: PneColorMode, border = TRANSPARENT): PneButtonStateColors => ({
    fill,
    border,
    text: labelOnFill(fill, mode),
})

const createPrimary = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    const fill = ramp[brandFillStep(mode)]
    const steps = brandFillSteps(ramp, mode)
    // In the dark theme a fill that does not read on the surfaces gets a ring that does.
    const ring = mode === 'dark' && !readsOn(fill, DARK_SURFACES)
        ? ramp[readableBrandStep(ramp, 500, mode)]
        : TRANSPARENT
    return {
        default: filled(fill, mode, ring),
        hover: filled(ramp[steps.hover], mode, ring),
        pressed: filled(ramp[steps.pressed], mode, ring),
        focus: filled(fill, mode, ring),
        disabled: mode === 'dark'
            ? {fill: PNE_DARK_COLORS.actionDisabledBackground, border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled}
            : {fill: PNE_NEUTRAL_RAMP[400], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[0]},
    }
}

// Secondary: a brand ring; the fill tints under the pointer in the light theme.
const createOutline = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    if (mode === 'dark') {
        const border = readableBrandStep(ramp, 400, mode)
        const {text, pressed} = darkBrandText(ramp)
        const resting = {fill: TRANSPARENT, border: ramp[border], text}
        return {
            default: resting,
            hover: {fill: TRANSPARENT, border: ramp[deeperStep(300, border, mode)], text},
            pressed: {fill: TRANSPARENT, border: ramp[deeperStep(300, border, mode)], text: pressed},
            focus: resting,
            disabled: {fill: TRANSPARENT, border: PNE_DARK_COLORS.textDisabled, text: PNE_DARK_COLORS.textDisabled},
        }
    }
    const border = readableBrandStep(ramp, 600, mode)
    const borderHover = ramp[deeperStep(700, border, mode)]
    const {text, pressed} = lightBrandText(ramp)
    return {
        default: {fill: TRANSPARENT, border: ramp[border], text},
        hover: {fill: ramp[100], border: borderHover, text},
        pressed: {fill: ramp[200], border: borderHover, text: pressed},
        focus: {fill: PNE_NEUTRAL_RAMP[50], border: ramp[border], text},
        disabled: {fill: PNE_NEUTRAL_RAMP[50], border: PNE_NEUTRAL_RAMP[400], text: PNE_NEUTRAL_RAMP[400]},
    }
}

type TertiaryTone = {text: string, pressed: string, hoverFill: string}

// Tertiary: one sunken fill at rest, under the pointer and disabled; the label carries the state.
// Active is the picked item of a set. A tone colours the label and tints the fill under the pointer.
const createText = (
    mode: PneColorMode,
    resting: string,
    tone: TertiaryTone,
): PneButtonVariantColors => {
    if (mode === 'dark') {
        const d = PNE_DARK_COLORS
        const base = {fill: d.surfaceSubtle, border: TRANSPARENT, text: resting}
        return {
            default: base,
            hover: {fill: tone.hoverFill, border: TRANSPARENT, text: tone.text},
            pressed: {fill: d.surfacePressed, border: TRANSPARENT, text: tone.pressed},
            focus: base,
            disabled: {fill: d.surfaceSubtle, border: TRANSPARENT, text: d.textDisabled},
        }
    }
    const n = PNE_NEUTRAL_RAMP
    const base = {fill: n[100], border: TRANSPARENT, text: resting}
    return {
        default: base,
        hover: {fill: tone.hoverFill, border: TRANSPARENT, text: tone.text},
        pressed: {fill: n[200], border: TRANSPARENT, text: tone.pressed},
        focus: base,
        disabled: {fill: n[100], border: TRANSPARENT, text: n[400]},
    }
}

const createTertiary = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    if (mode === 'dark') {
        const d = PNE_DARK_COLORS
        return {
            ...createText(mode, d.textSecondary, {text: d.textPrimary, pressed: d.textPrimary, hoverFill: d.surfaceRaised}),
            active: {fill: d.surfacePressed, border: TRANSPARENT, text: d.textPrimary, shadow: ACTIVE_SHADOW},
        }
    }
    const n = PNE_NEUTRAL_RAMP
    const {text, pressed} = lightBrandText(ramp)
    return {
        ...createText(mode, n[700], {text, pressed, hoverFill: n[100]}),
        active: {fill: n[0], border: TRANSPARENT, text: n[700], shadow: ACTIVE_SHADOW},
    }
}

const createTonedTertiary = (ramp: PneBrandRamp, colors: PneStatusRamp, mode: PneColorMode): PneButtonVariantColors => {
    const text = colors[mode === 'dark' ? 300 : 700]
    const hoverFill = mode === 'dark' ? PNE_DARK_COLORS.surfaceRaised : ramp[100]
    return createText(mode, text, {text, pressed: text, hoverFill})
}

const createActivated = (mode: PneColorMode): PneButtonStateColors => {
    const colors = PNE_STATUS_COLORS.success
    return mode === 'dark'
        ? {fill: colors[900], border: colors[700], text: colors[300]}
        : {fill: colors[100], border: colors[300], text: colors[700]}
}

// Soft: a brand label on the sunken fill; the fill tints under the pointer.
const createSoft = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonVariantColors => {
    if (mode === 'dark') {
        const {text, pressed} = darkBrandText(ramp)
        const resting = {fill: TRANSPARENT, border: TRANSPARENT, text}
        return {
            default: resting,
            hover: {fill: alpha(text, 0.10), border: TRANSPARENT, text},
            pressed: {fill: alpha(text, 0.16), border: TRANSPARENT, text: pressed},
            focus: resting,
            disabled: {fill: TRANSPARENT, border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled},
        }
    }
    const n = PNE_NEUTRAL_RAMP
    const {text, pressed} = lightBrandText(ramp)
    const resting = {fill: n[100], border: TRANSPARENT, text}
    return {
        default: resting,
        hover: {fill: ramp[100], border: TRANSPARENT, text},
        pressed: {fill: ramp[200], border: TRANSPARENT, text: pressed},
        focus: resting,
        disabled: {fill: n[100], border: TRANSPARENT, text: n[400]},
    }
}

const createStatus = (colors: PneStatusRamp, mode: PneColorMode): PneButtonVariantColors => mode === 'dark'
    ? {
        default: filled(colors[600], mode),
        hover: filled(colors[500], mode),
        pressed: filled(colors[700], mode),
        focus: filled(colors[600], mode),
        disabled: {fill: colors[900], border: TRANSPARENT, text: PNE_DARK_COLORS.textDisabled},
    }
    : {
        default: filled(colors[600], mode),
        hover: filled(colors[700], mode),
        pressed: filled(colors[800], mode),
        focus: filled(colors[600], mode),
        disabled: {fill: colors[300], border: TRANSPARENT, text: PNE_NEUTRAL_RAMP[0]},
    }

export const createPneButtonPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneButtonPalette => ({
    primary: createPrimary(ramp, mode),
    outline: createOutline(ramp, mode),
    text: createTertiary(ramp, mode),
    textDanger: createTonedTertiary(ramp, PNE_STATUS_COLORS.error, mode),
    textSuccess: {
        ...createTonedTertiary(ramp, PNE_STATUS_COLORS.success, mode),
        activated: createActivated(mode),
    },
    soft: createSoft(ramp, mode),
    destructive: createStatus(PNE_STATUS_COLORS.error, mode),
    warning: createStatus(PNE_STATUS_COLORS.warning, mode),
})

/** The outer 2px of the keyboard focus ring (UI Kit Focus/Ring: brand 600 light, 300 dark). */
export const createPneFocusRing = (ramp: PneBrandRamp, mode: PneColorMode): string =>
    ramp[readableBrandStep(ramp, mode === 'dark' ? 300 : 600, mode)]

/** Link text (UI Kit Tx/Link: brand 700 light, 200 dark). */
export const createPneLinkColor = (ramp: PneBrandRamp, mode: PneColorMode): string =>
    ramp[readableBrandStep(ramp, mode === 'dark' ? 200 : 700, mode, PNE_LABEL_CONTRAST)]
