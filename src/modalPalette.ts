import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, type PneColorMode} from './themeColors'

/**
 * Modal colours by UI Kit (Claude) role (Modal): the window on its ring and shadow, the title, the
 * subtitle, the body text and the hairlines that part the header and the buttons from the body.
 * The close cross is a tertiary button and takes the colours of `button.text`.
 */
export type PneModalPalette = {
    fill: string
    /** The 1px border of the window. */
    ring: string
    shadow: string
    /** The hairlines under the header and over the buttons. */
    divider: string
    title: string
    subtitle: string
    /** The text of the body. */
    text: string
}

const createLight = (): PneModalPalette => {
    const n = PNE_NEUTRAL_RAMP
    return {
        fill: n[0],
        ring: n[200],
        shadow: '0 8px 24px rgba(13, 26, 51, 0.12)',
        divider: n[200],
        title: n[900],
        subtitle: n[700],
        text: n[900],
    }
}

const createDark = (): PneModalPalette => {
    const d = PNE_DARK_COLORS
    return {
        fill: d.backgroundPaper,
        ring: d.borderDefault,
        shadow: '0 16px 40px rgba(0, 0, 0, 0.48)',
        divider: d.borderDefault,
        title: d.textPrimary,
        subtitle: d.textSecondary,
        text: d.textPrimary,
    }
}

export const createPneModalPalette = (mode: PneColorMode): PneModalPalette =>
    mode === 'dark' ? createDark() : createLight()
