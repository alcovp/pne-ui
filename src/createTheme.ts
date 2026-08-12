import {
    alpha,
    createTheme,
    getContrastRatio,
    type Theme,
    type ThemeOptions,
} from '@mui/material/styles'
import {Skin} from './common/paynet/skin'

export type PneColorMode = 'light' | 'dark'

export type PneBrandPalette = {
    seed: string
    foreground: string
    foregroundHover: string
    soft: string
    softHover: string
    border: string
    fill: string
    fillHover: string
    fillActive: string
    onFill: string
    fillBorder: string
}

export type PneSemanticPalette = {
    surface: {
        sunken: string
        subtle: string
        raised: string
    }
    border: {
        subtle: string
        default: string
        control: string
    }
    text: {
        muted: string
    }
    brand: PneBrandPalette
}

export type PneCreateThemeOptions = Omit<ThemeOptions, 'skin'> & {
    /** PNE color mode. `palette.mode` remains supported for compatibility. */
    colorMode?: PneColorMode
}

export const PNE_DARK_COLORS = Object.freeze({
    backgroundDefault: '#121212',
    backgroundPaper: '#1C1C1C',
    surfaceSunken: '#181818',
    surfaceSubtle: '#242424',
    surfaceRaised: '#292929',
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

const PNE_LIGHT_COLORS = Object.freeze({
    surfaceSunken: '#F8FAFC',
    surfaceSubtle: '#F1F5FA',
    surfaceRaised: '#FFFFFF',
    borderSubtle: '#F1F5FA',
    borderDefault: '#E1E7EF',
    borderControl: '#B0B7C3',
    textMuted: '#809EAE',
})

const MISSING_COLOR = '#FF00DC'
const MIN_FOREGROUND_CONTRAST = 4.5
const MIN_CONTROL_BOUNDARY_CONTRAST = 3
const DARK_FOREGROUND_SURFACES = [
    PNE_DARK_COLORS.backgroundDefault,
    PNE_DARK_COLORS.backgroundPaper,
    PNE_DARK_COLORS.surfaceSunken,
    PNE_DARK_COLORS.surfaceSubtle,
    PNE_DARK_COLORS.surfaceRaised,
] as const

const normalizeHexColor = (value: string | undefined): string => {
    const color = value?.trim()
    if (!color) return MISSING_COLOR

    const shortMatch = /^#([0-9a-f]{3})$/i.exec(color)
    if (shortMatch) {
        return `#${shortMatch[1].split('').map(part => `${part}${part}`).join('')}`.toUpperCase()
    }

    return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : MISSING_COLOR
}

const hexToRgb = (color: string): [number, number, number] => {
    const value = Number.parseInt(color.slice(1), 16)
    return [value >> 16, (value >> 8) & 255, value & 255]
}

const rgbToHex = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue]
        .map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase()

const mixHex = (color: string, target: '#000000' | '#FFFFFF', amount: number): string => {
    const sourceChannels = hexToRgb(color)
    const targetChannels = hexToRgb(target)
    return rgbToHex(
        sourceChannels[0] + (targetChannels[0] - sourceChannels[0]) * amount,
        sourceChannels[1] + (targetChannels[1] - sourceChannels[1]) * amount,
        sourceChannels[2] + (targetChannels[2] - sourceChannels[2]) * amount,
    )
}

const hasMinimumContrast = (
    foreground: string,
    surfaces: readonly string[],
    minimum: number,
): boolean => surfaces.every(surface => getContrastRatio(foreground, surface) >= minimum)

const createAccessibleDarkForeground = (seed: string): string => {
    if (hasMinimumContrast(seed, DARK_FOREGROUND_SURFACES, MIN_FOREGROUND_CONTRAST)) {
        return seed
    }

    let lowerAmount = 0
    let upperAmount = 1
    let result = '#FFFFFF'

    for (let iteration = 0; iteration < 24; iteration += 1) {
        const amount = (lowerAmount + upperAmount) / 2
        const candidate = mixHex(seed, '#FFFFFF', amount)
        if (hasMinimumContrast(candidate, DARK_FOREGROUND_SURFACES, MIN_FOREGROUND_CONTRAST)) {
            result = candidate
            upperAmount = amount
        } else {
            lowerAmount = amount
        }
    }

    return result
}

const createForegroundHover = (foreground: string, mode: PneColorMode): string => {
    const preferredTarget = mode === 'dark' ? '#FFFFFF' : '#000000'
    const candidate = mixHex(foreground, preferredTarget, 0.12)
    if (
        mode === 'light'
        || hasMinimumContrast(candidate, DARK_FOREGROUND_SURFACES, MIN_FOREGROUND_CONTRAST)
    ) {
        return candidate
    }
    return foreground
}

const chooseContrastText = (background: string): '#000000' | '#FFFFFF' =>
    getContrastRatio(background, '#000000') >= getContrastRatio(background, '#FFFFFF')
        ? '#000000'
        : '#FFFFFF'

// Mirrors MUI's light-palette `getContrastText` rule. Keeping this separate from
// the stricter dark-mode rule prevents the existing light buttons from changing.
const chooseMuiLightContrastText = (background: string): string =>
    getContrastRatio(background, '#FFFFFF') >= 3
        ? '#FFFFFF'
        : 'rgba(0, 0, 0, 0.87)'

const createFillState = (
    fill: string,
    onFill: '#000000' | '#FFFFFF',
    amount: number,
): string => {
    const target = onFill === '#000000' ? '#FFFFFF' : '#000000'
    const candidate = mixHex(fill, target, amount)
    return getContrastRatio(candidate, onFill) >= MIN_FOREGROUND_CONTRAST ? candidate : fill
}

const createBrandPalette = (seed: string, mode: PneColorMode): PneBrandPalette => {
    const foreground = mode === 'dark' ? createAccessibleDarkForeground(seed) : seed
    const foregroundHover = createForegroundHover(foreground, mode)
    const fill = seed
    const onFill = mode === 'dark'
        ? chooseContrastText(fill)
        : chooseMuiLightContrastText(fill)
    const fillStateContrastText = onFill === '#FFFFFF' ? '#FFFFFF' : '#000000'
    const boundarySurface = mode === 'dark'
        ? PNE_DARK_COLORS.surfaceRaised
        : PNE_LIGHT_COLORS.surfaceRaised

    return {
        seed,
        foreground,
        foregroundHover,
        soft: alpha(foreground, mode === 'dark' ? 0.10 : 0.06),
        softHover: alpha(foreground, mode === 'dark' ? 0.16 : 0.10),
        border: alpha(foreground, 0.40),
        fill,
        fillHover: createFillState(fill, fillStateContrastText, 0.12),
        fillActive: createFillState(fill, fillStateContrastText, 0.20),
        onFill,
        fillBorder: mode === 'light'
            || getContrastRatio(fill, boundarySurface) >= MIN_CONTROL_BOUNDARY_CONTRAST
            ? 'transparent'
            : foreground,
    }
}

const createSemanticPalette = (seed: string, mode: PneColorMode): PneSemanticPalette => ({
    surface: mode === 'dark'
        ? {
            sunken: PNE_DARK_COLORS.surfaceSunken,
            subtle: PNE_DARK_COLORS.surfaceSubtle,
            raised: PNE_DARK_COLORS.surfaceRaised,
        }
        : {
            sunken: PNE_LIGHT_COLORS.surfaceSunken,
            subtle: PNE_LIGHT_COLORS.surfaceSubtle,
            raised: PNE_LIGHT_COLORS.surfaceRaised,
        },
    border: mode === 'dark'
        ? {
            subtle: PNE_DARK_COLORS.borderSubtle,
            default: PNE_DARK_COLORS.borderDefault,
            control: PNE_DARK_COLORS.borderControl,
        }
        : {
            subtle: PNE_LIGHT_COLORS.borderSubtle,
            default: PNE_LIGHT_COLORS.borderDefault,
            control: PNE_LIGHT_COLORS.borderControl,
        },
    text: {
        muted: mode === 'dark' ? PNE_DARK_COLORS.textMuted : PNE_LIGHT_COLORS.textMuted,
    },
    brand: createBrandPalette(seed, mode),
})

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (value === null || typeof value !== 'object') return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

const mergeThemeObjects = <T>(base: T, override: unknown): T => {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return (override === undefined ? base : override) as T
    }

    const result: Record<string, unknown> = {...base}
    Object.entries(override).forEach(([key, value]) => {
        result[key] = key in result
            ? mergeThemeObjects(result[key], value)
            : value
    })
    return result as T
}

const createPneComponentOverrides = (mode: PneColorMode): ThemeOptions['components'] => ({
    MuiIconButton: {
        styleOverrides: {
            root: ({ownerState, theme}) => {
                if (ownerState.color === 'pnePrimary') {
                    if (mode === 'light') {
                        return {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                                color: theme.palette.primary.contrastText,
                            },
                        }
                    }
                    return {
                        backgroundColor: theme.palette.pne.brand.fill,
                        color: theme.palette.pne.brand.onFill,
                        border: '1px solid',
                        borderColor: theme.palette.pne.brand.fillBorder,
                        '&:hover': {
                            backgroundColor: theme.palette.pne.brand.fillHover,
                            color: theme.palette.pne.brand.onFill,
                        },
                    }
                }
                if (ownerState.color === 'pneNeutral') {
                    if (mode === 'light') {
                        return {
                            backgroundColor: '#F1F5FA',
                            stroke: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.light,
                                stroke: theme.palette.primary.dark,
                            },
                        }
                    }
                    return {
                        backgroundColor: theme.palette.pne.surface.subtle,
                        stroke: theme.palette.pne.brand.foreground,
                        '&:hover': {
                            backgroundColor: theme.palette.pne.brand.softHover,
                            stroke: theme.palette.pne.brand.foregroundHover,
                        },
                    }
                }
                return {}
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: ({ownerState, theme}) => {
                if (ownerState.color === 'pneNeutral') {
                    if (mode === 'light') {
                        return {
                            backgroundColor: '#F1F5FA',
                            color: theme.palette.primary.main,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.light,
                                boxShadow: 'none',
                            },
                        }
                    }
                    return {
                        backgroundColor: theme.palette.pne.surface.subtle,
                        color: theme.palette.pne.brand.foreground,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.pne.brand.softHover,
                            boxShadow: 'none',
                        },
                    }
                }
                if (ownerState.color === 'pneWhite') {
                    if (mode === 'light') {
                        return {
                            backgroundColor: '#fff',
                            color: theme.palette.primary.main,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.light,
                                boxShadow: 'none',
                            },
                        }
                    }
                    return {
                        backgroundColor: theme.palette.pne.surface.raised,
                        color: theme.palette.pne.brand.foreground,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.pne.brand.softHover,
                            boxShadow: 'none',
                        },
                    }
                }
                if (ownerState.color === 'pnePrimaryLight') {
                    if (mode === 'light') {
                        return {
                            backgroundColor: theme.palette.primary.light,
                            color: theme.palette.primary.main,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                boxShadow: 'none',
                            },
                        }
                    }
                    return {
                        backgroundColor: theme.palette.pne.brand.soft,
                        color: theme.palette.pne.brand.foreground,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.pne.brand.softHover,
                            color: theme.palette.pne.brand.foregroundHover,
                            boxShadow: 'none',
                        },
                    }
                }
                if (ownerState.color === 'pneWarningLight') {
                    return {
                        backgroundColor: theme.palette.warning.light,
                        color: theme.palette.warning.contrastText,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.warning.main,
                            color: theme.palette.warning.contrastText,
                            boxShadow: 'none',
                        },
                    }
                }
                return {
                    boxShadow: 'none',
                    '&:hover': {boxShadow: 'none'},
                }
            },
        },
    },
    MuiToggleButtonGroup: {
        styleOverrides: {
            root: ({ownerState, theme}) => ownerState.color === 'pneAccentuated'
                ? {backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.pne.surface.raised}
                : {},
        },
    },
})

const createBaseThemeOptions = (skin: Skin, mode: PneColorMode): ThemeOptions => {
    const seed = normalizeHexColor(skin.experimentalColor)
    const pne = createSemanticPalette(seed, mode)
    const darkModePalette = mode === 'dark'
        ? {
            background: {
                default: PNE_DARK_COLORS.backgroundDefault,
                paper: PNE_DARK_COLORS.backgroundPaper,
            },
            text: {
                primary: PNE_DARK_COLORS.textPrimary,
                secondary: PNE_DARK_COLORS.textSecondary,
                disabled: PNE_DARK_COLORS.textDisabled,
            },
            divider: PNE_DARK_COLORS.divider,
            action: {
                hover: PNE_DARK_COLORS.actionHover,
                selected: PNE_DARK_COLORS.actionSelected,
                focus: PNE_DARK_COLORS.actionFocus,
                disabled: PNE_DARK_COLORS.actionDisabled,
                disabledBackground: PNE_DARK_COLORS.actionDisabledBackground,
            },
        }
        : {}

    return {
        skin,
        palette: {
            mode,
            tonalOffset: {
                dark: 0.1,
                light: 0.8,
            },
            primary: mode === 'dark'
                ? {
                    main: pne.brand.foreground,
                    dark: pne.brand.foregroundHover,
                    light: pne.brand.foregroundHover,
                    contrastText: chooseContrastText(pne.brand.foreground),
                }
                : {main: seed},
            pne,
            pneNeutral: {main: seed},
            pnePrimary: {main: seed},
            pnePrimaryLight: {main: seed},
            pneWhite: {main: seed},
            pneWarningLight: {main: '#F5762F'},
            pneAccentuated: {main: seed},
            ...darkModePalette,
        },
        components: createPneComponentOverrides(mode),
    }
}

export const createPneThemeOptions = (
    skin: Skin,
    options: PneCreateThemeOptions = {},
): ThemeOptions => {
    const {colorMode, palette, ...themeOverrides} = options
    const {mode: paletteMode, ...paletteOverrides} = palette ?? {}
    const mode = colorMode ?? paletteMode ?? 'light'
    const normalizedMode: PneColorMode = mode === 'dark' ? 'dark' : 'light'
    const overrides: ThemeOptions = {
        ...themeOverrides,
        ...(palette ? {palette: paletteOverrides} : {}),
    }

    return mergeThemeObjects(createBaseThemeOptions(skin, normalizedMode), overrides)
}

export const createPneTheme = (
    skin: Skin,
    options?: PneCreateThemeOptions,
    ...args: object[]
): Theme => createTheme(createPneThemeOptions(skin, options), ...args)
