import type {PneBrandRamp} from './brandRamp'
import {brandFillStep, brandFillSteps, markOnFill, readableBrandStep, readsOnDarkSurfaces} from './buttonPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Switch colours by UI Kit (Claude) role: `switch-track-*` and `switch-knob-*`. Off is a neutral
 * track with a white knob, on is the brand fill; the track that is pressed while off already takes
 * the colour of on. The knob has no shadow and no ring. The same three skin rules as for buttons
 * keep any skin usable: on a light fill the knob is dark.
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
}

const TRANSPARENT = 'transparent'

const createLight = (ramp: PneBrandRamp): PneSwitchPalette => {
    const fill = ramp[brandFillStep('light')]
    const steps = brandFillSteps(ramp, 'light')
    const knob = markOnFill(fill)
    const n = PNE_NEUTRAL_RAMP
    // The spinner turns inside the knob: the brand step that reads on white, or white in a dark knob.
    const spinner = knob === n[0] ? ramp[readableBrandStep(ramp, 600, 'light')] : n[0]
    return {
        on: {
            default: {track: fill, ring: TRANSPARENT, knob},
            hover: {track: ramp[steps.hover], ring: TRANSPARENT, knob},
            pressed: {track: ramp[steps.pressed], ring: TRANSPARENT, knob},
            disabled: {track: n[300], ring: TRANSPARENT, knob: n[400]},
            readOnly: {track: n[600], ring: TRANSPARENT, knob: n[0]},
        },
        off: {
            default: {track: n[300], ring: TRANSPARENT, knob: n[0]},
            hover: {track: n[400], ring: TRANSPARENT, knob: n[0]},
            pressed: {track: fill, ring: TRANSPARENT, knob},
            disabled: {track: n[300], ring: TRANSPARENT, knob: n[400]},
            readOnly: {track: n[200], ring: TRANSPARENT, knob: n[600]},
        },
        spinner: {on: spinner, off: ramp[readableBrandStep(ramp, 600, 'light')]},
    }
}

const createDark = (ramp: PneBrandRamp): PneSwitchPalette => {
    const fill = ramp[brandFillStep('dark')]
    const steps = brandFillSteps(ramp, 'dark')
    // A fill that does not read on the dark surfaces gets a ring that does.
    const onRing = readsOnDarkSurfaces(fill) ? TRANSPARENT : ramp[readableBrandStep(ramp, 500, 'dark')]
    const knob = markOnFill(fill)
    const d = PNE_DARK_COLORS
    const n = PNE_NEUTRAL_RAMP
    const spinner = knob === n[0] ? ramp[readableBrandStep(ramp, 600, 'light')] : n[0]
    return {
        on: {
            default: {track: fill, ring: onRing, knob},
            hover: {track: ramp[steps.hover], ring: onRing, knob},
            pressed: {track: ramp[steps.pressed], ring: onRing, knob},
            disabled: {track: n[700], ring: TRANSPARENT, knob: n[600]},
            readOnly: {track: n[500], ring: TRANSPARENT, knob: n[0]},
        },
        off: {
            default: {track: d.borderControl, ring: TRANSPARENT, knob: n[0]},
            hover: {track: n[500], ring: TRANSPARENT, knob: n[0]},
            pressed: {track: fill, ring: onRing, knob},
            disabled: {track: n[700], ring: TRANSPARENT, knob: n[600]},
            readOnly: {track: n[800], ring: TRANSPARENT, knob: n[500]},
        },
        spinner: {on: spinner, off: ramp[readableBrandStep(ramp, 600, 'light')]},
    }
}

export const createPneSwitchPalette = (ramp: PneBrandRamp, mode: PneColorMode): PneSwitchPalette =>
    mode === 'dark' ? createDark(ramp) : createLight(ramp)
