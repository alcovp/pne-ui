export type PneColorMode = 'light' | 'dark'

export const PNE_DARK_COLORS = Object.freeze({
    backgroundDefault: '#121212',
    backgroundPaper: '#1C1C1C',
    surfaceSunken: '#181818',
    surfaceSubtle: '#242424',
    surfaceRaised: '#292929',
    surfacePressed: '#303030',
    borderSubtle: 'rgba(255,255,255,0.035)',
    borderDefault: '#484848',
    borderControl: '#707070',
    textPrimary: '#F2F2F2',
    textSecondary: '#B8B8B8',
    textMuted: '#949494',
    textDisabled: '#7A7A7A',
    divider: 'rgba(255,255,255,0.12)',
    actionHover: 'rgba(255,255,255,0.08)',
    actionSelected: 'rgba(255,255,255,0.16)',
    actionFocus: 'rgba(255,255,255,0.12)',
    actionDisabled: 'rgba(255,255,255,0.30)',
    actionDisabledBackground: 'rgba(255,255,255,0.12)',
})

export const PNE_LIGHT_COLORS = Object.freeze({
    surfaceSunken: '#F8FAFC',
    surfaceSubtle: '#F1F5FA',
    surfaceRaised: '#FFFFFF',
    borderSubtle: '#F1F5FA',
    borderDefault: '#E1E7EF',
    borderControl: '#B0B7C3',
    textDefault: '#38434D',
    textMuted: '#808080',
    controlForeground: '#8A8A8A',
    controlForegroundHover: '#5C5C5C',
    controlForegroundDisabled: '#C4C4C4',
    controlActiveBackground: '#F0F0F0',
})

/** UI Kit (Claude) neutral ramp; the same for every skin. */
export const PNE_NEUTRAL_RAMP = Object.freeze({
    0: '#FFFFFF',
    50: '#F5F6F7',
    100: '#EBEDF0',
    200: '#C9D2D9',
    300: '#B6C0C9',
    400: '#A2AEB9',
    500: '#8F9CAA',
    600: '#7C8B9B',
    700: '#637487',
    800: '#55677B',
    900: '#41556B',
    950: '#384D62',
})

export type PneStatusRamp = Readonly<Record<300 | 500 | 650 | 700 | 750 | 850, string>>

/** UI Kit (Claude) status ramps used by buttons; the same for every skin. */
export const PNE_STATUS_COLORS: Readonly<Record<'error' | 'warning', PneStatusRamp>> = Object.freeze({
    error: Object.freeze({
        300: '#F7B7BE',
        500: '#EC4B5D',
        650: '#C8283B',
        700: '#67465C',
        750: '#A8202F',
        850: '#8A1A27',
    }),
    warning: Object.freeze({
        300: '#FFCCB9',
        500: '#FF7F50',
        650: '#B24A12',
        700: '#825C57',
        750: '#923B0D',
        850: '#742F0A',
    }),
})
