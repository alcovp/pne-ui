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
    50: '#F7FBFF',
    100: '#F0F4F8',
    200: '#E2E9F0',
    300: '#CED5DC',
    400: '#B2B8BF',
    500: '#8D9399',
    600: '#6E747A',
    700: '#565B61',
    800: '#3E4349',
    900: '#2C3136',
    950: '#1D2227',
    1000: '#111417',
    1050: '#0A0C0F',
})

export type PneStatusRamp = Readonly<Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>>

/**
 * UI Kit (Claude) status ramps, the same for every skin: Red for errors, Amber for warnings and
 * Green for success. As in the brand ramp, 600 is the fill a white label reads on and 700 the text.
 */
export const PNE_STATUS_COLORS: Readonly<Record<'error' | 'warning' | 'success', PneStatusRamp>> = Object.freeze({
    error: Object.freeze({
        50: '#FEF9F8',
        100: '#FFEEED',
        200: '#FFDDDB',
        300: '#FEBEBB',
        400: '#FE908D',
        500: '#F8535A',
        600: '#CC2538',
        700: '#B1182C',
        800: '#900F21',
        900: '#6C0816',
        950: '#4C060E',
    }),
    warning: Object.freeze({
        50: '#FFF9F5',
        100: '#FEEFE4',
        200: '#FEE0C8',
        300: '#FFC393',
        400: '#FA9A40',
        500: '#D97A05',
        600: '#A65C03',
        700: '#8E4E01',
        800: '#733E01',
        900: '#552C00',
        950: '#3D1D00',
    }),
    success: Object.freeze({
        50: '#F1FEF3',
        100: '#DFFBE4',
        200: '#C3F5CC',
        300: '#96E7A7',
        400: '#62CF7E',
        500: '#29B159',
        600: '#05893E',
        700: '#017433',
        800: '#005E28',
        900: '#00451B',
        950: '#003011',
    }),
})
