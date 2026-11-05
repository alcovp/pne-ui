import type {PneBrandRamp} from './brandRamp'
import {brandFillSteps, deeperStep, readableBrandStep, readsOnDarkSurfaces} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Switch colours by UI Kit (Claude) role: `switch-track-*`, `switch-ring-*`, `switch-knob-*`,
 * with hover and pressed taken from the button roles the UI Kit Switch reuses. The same three
 * skin rules as for buttons keep any skin usable.
 */
export type PneSwitchState = 'default' | 'hover' | 'pressed' | 'disabled' | 'readOnly'

export type PneSwitchStateColors = {
    track: string
    /** The 1px inset ring of the track; `transparent` means none. */
    ring: string
    knob: string
}

export type PneSwitchValueColors = Record<PneSwitchState, PneSwitchStateColors>

export type PneSwitchPalette = {
    on: PneSwitchValueColors
    off: PneSwitchValueColors
    /** The spinner inside the knob while a change is pending. */
    spinner: {on: string, off: string}
    knobShadow: string
}

const TRANSPARENT = 'transparent'
const KNOB_SHADOW = '0 1px 4px rgba(0, 0, 0, 0.2)'

const createLight = (ramp: PneBrandRamp): PneSwitchPalette => {
    const base = readableBrandStep(ramp, 500, 'light')
    const steps = brandFillSteps(ramp, 'light')
    // The knob keeps at least the readable step unless rule 2 sends the skin lighter.
    const knobHover = steps.hover > 500 ? deeperStep(steps.hover, base, 'light') : steps.hover
    const knobPressed = steps.pressed > 500 ? deeperStep(steps.pressed, base, 'light') : steps.pressed
    const n = PNE_NEUTRAL_RAMP
    return {
        on: {
            default: {track: ramp[500], ring: TRANSPARENT, knob: n[0]},
            hover: {track: ramp[steps.hover], ring: TRANSPARENT, knob: n[0]},
            pressed: {track: ramp[steps.pressed], ring: TRANSPARENT, knob: n[0]},
            disabled: {track: n[400], ring: TRANSPARENT, knob: n[0]},
            readOnly: {track: n[500], ring: TRANSPARENT, knob: n[0]},
        },
        off: {
            default: {track: ramp[50], ring: n[200], knob: ramp[base]},
            hover: {track: ramp[100], ring: ramp[base], knob: ramp[knobHover]},
            pressed: {track: ramp[100], ring: ramp[deeperStep(700, base, 'light')], knob: ramp[knobPressed]},
            disabled: {track: n[100], ring: n[100], knob: n[400]},
            readOnly: {track: n[50], ring: n[200], knob: n[500]},
        },
        spinner: {on: ramp[500], off: n[0]},
        knobShadow: KNOB_SHADOW,
    }
}

const createDark = (ramp: PneBrandRamp): PneSwitchPalette => {
    const knob = readableBrandStep(ramp, 500, 'dark')
    const steps = brandFillSteps(ramp, 'dark')
    const onRing = readsOnDarkSurfaces(ramp[500]) ? TRANSPARENT : ramp[knob]
    const d = PNE_DARK_COLORS
    return {
        on: {
            default: {track: ramp[500], ring: onRing, knob: PNE_NEUTRAL_RAMP[0]},
            hover: {track: ramp[steps.hover], ring: onRing, knob: PNE_NEUTRAL_RAMP[0]},
            pressed: {track: ramp[steps.pressed], ring: onRing, knob: PNE_NEUTRAL_RAMP[0]},
            disabled: {track: d.borderControl, ring: TRANSPARENT, knob: PNE_NEUTRAL_RAMP[0]},
            readOnly: {track: d.textMuted, ring: TRANSPARENT, knob: PNE_NEUTRAL_RAMP[0]},
        },
        off: {
            default: {track: ramp[900], ring: d.borderControl, knob: ramp[knob]},
            hover: {track: ramp[900], ring: ramp[readableBrandStep(ramp, 400, 'dark')], knob: ramp[deeperStep(steps.hover, knob, 'dark')]},
            pressed: {track: ramp[900], ring: ramp[readableBrandStep(ramp, 300, 'dark')], knob: ramp[deeperStep(steps.pressed, knob, 'dark')]},
            disabled: {track: d.surfaceSubtle, ring: d.borderDefault, knob: d.textDisabled},
            readOnly: {track: d.surfaceRaised, ring: d.borderControl, knob: d.textMuted},
        },
        spinner: {on: ramp[500], off: PNE_NEUTRAL_RAMP[0]},
        knobShadow: KNOB_SHADOW,
    }
}

export const createPneSwitchPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneSwitchPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
