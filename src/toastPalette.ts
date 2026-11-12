import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, PNE_STATUS_COLORS, type PneColorMode} from './themeColors'

/**
 * Notification colours by UI Kit (Claude) role (Toast, and Banner for an error with details). A toast
 * is filled with the colour of its tone (`Tags/Status/<tone>/Border`) and writes its description,
 * its timer and its close cross in the text colour of the tone; the title reads as a value. A banner
 * is the pale fill of the tone inside a ring of the toast fill. The tones are the same for every skin.
 */
export type PneToastTone = 'info' | 'success' | 'warning' | 'error'

export type PneToastToneColors = {
    /** The fill of a toast and the ring of a banner. */
    fill: string
    /** The description, the timer bar, the close cross and the sign of a banner. */
    text: string
    /** The fill of a banner. */
    bannerFill: string
}

export type PneToastPalette = Record<PneToastTone, PneToastToneColors> & {
    /** The title of a toast and the text of a banner. */
    title: string
    shadow: string
}

// The UI Kit blue of the Info tone: a fixed ramp, not the brand ramp of the skin.
const INFO = {100: '#EBF3FF', 300: '#B3D4FF', 700: '#005EB9', 900: '#003670'} as const

// UI Kit `--elevation-toast` (Figma effect style NW).
const TOAST_SHADOW = '0 -1px 12px rgba(0,0,0,0.03), 0 3px 3px rgba(2,0,107,0.02), 0 7px 6px rgba(0,11,70,0.03), '
    + '0 12px 10px rgba(0,0,98,0.03), 0 22px 18px rgba(0,15,44,0.04), 0 40px 33px rgba(0,10,255,0.05), '
    + '0 100px 80px rgba(0,0,0,0.07)'

type ToneRamp = Readonly<Record<100 | 300 | 700 | 900, string>>

const RAMPS: Record<PneToastTone, ToneRamp> = {
    info: INFO,
    success: PNE_STATUS_COLORS.success,
    warning: PNE_STATUS_COLORS.warning,
    error: PNE_STATUS_COLORS.error,
}

const TONES = Object.keys(RAMPS) as PneToastTone[]

const tones = (pick: (ramp: ToneRamp) => PneToastToneColors): Record<PneToastTone, PneToastToneColors> =>
    Object.fromEntries(TONES.map(tone => [tone, pick(RAMPS[tone])])) as Record<PneToastTone, PneToastToneColors>

export const createPneToastPalette = (mode: PneColorMode): PneToastPalette => mode === 'dark'
    ? {
        ...tones(ramp => ({fill: ramp[700], text: ramp[300], bannerFill: ramp[900]})),
        title: PNE_DARK_COLORS.textPrimary,
        shadow: TOAST_SHADOW,
    }
    : {
        ...tones(ramp => ({fill: ramp[300], text: ramp[700], bannerFill: ramp[100]})),
        title: PNE_NEUTRAL_RAMP[900],
        shadow: TOAST_SHADOW,
    }
