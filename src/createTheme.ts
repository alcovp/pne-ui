import {
    alpha,
    createTheme,
    getContrastRatio,
    type Theme,
    type ThemeOptions,
} from '@mui/material/styles'
import {Skin} from './common/paynet/skin'
import {mixHex, normalizeHexColor} from './color'
import {createPneBrandRamp, type PneBrandRamp} from './brandRamp'
import {
    createPneButtonPalette,
    createPneFocusRing,
    createPneLinkColor,
    type PneButtonPalette,
} from './buttonPalette'
import {createPneCheckboxPalette, type PneCheckboxPalette} from './checkboxPalette'
import {createPneSwitchPalette, type PneSwitchPalette} from './switchPalette'
import {PNE_DARK_COLORS, PNE_LIGHT_COLORS, type PneColorMode} from './themeColors'

export {PNE_DARK_COLORS} from './themeColors'
export type {PneColorMode} from './themeColors'

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
        /** Labels and names that must read at full strength, such as filter names. */
        default: string
        muted: string
    }
    /**
     * Secondary controls: pagination, the table view selector, the sort arrow, the filter icons,
     * the off switch track. Neutral greys, so every skin reads the same; the resting colour keeps
     * at least 3:1 against the page.
     */
    control: {
        foreground: string
        foregroundHover: string
        foregroundDisabled: string
        /** The pressed-in control: the current page, the chosen view, a hovered action. */
        activeBackground: string
    }
    brand: PneBrandPalette
    /** The brand ramp of the skin, steps 0…1000; 500 is the skin colour. */
    ramp: PneBrandRamp
    /** Button colours by UI Kit role. */
    button: PneButtonPalette
    /** Switch colours by UI Kit role. */
    switch: PneSwitchPalette
    /** Checkbox colours by UI Kit role. */
    checkbox: PneCheckboxPalette
    /** The outer 2px of the keyboard focus ring; the 2px gap inside takes the page colour. */
    focusRing: string
    /** Link text on the page. */
    link: string
}

export type PneCreateThemeOptions = Omit<ThemeOptions, 'skin'> & {
    /** PNE color mode. `palette.mode` remains supported for compatibility. */
    colorMode?: PneColorMode
}

const MIN_FOREGROUND_CONTRAST = 4.5
const MIN_CONTROL_BOUNDARY_CONTRAST = 3
const DARK_FOREGROUND_SURFACES = [
    PNE_DARK_COLORS.backgroundDefault,
    PNE_DARK_COLORS.backgroundPaper,
    PNE_DARK_COLORS.surfaceSunken,
    PNE_DARK_COLORS.surfaceSubtle,
    PNE_DARK_COLORS.surfaceRaised,
] as const

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

const createSemanticPalette = (seed: string, mode: PneColorMode): PneSemanticPalette => {
    const ramp = createPneBrandRamp(seed)
    return {
        ...createSemanticSurfaces(seed, mode),
        ramp,
        button: createPneButtonPalette(ramp, mode),
        switch: createPneSwitchPalette(ramp, mode),
        checkbox: createPneCheckboxPalette(ramp, mode),
        focusRing: createPneFocusRing(ramp, mode),
        link: createPneLinkColor(ramp, mode),
    }
}

/** The PNE palette of a theme; one is built from `primary.main` for a theme made without `createPneTheme`. */
export const resolvePneSemanticPalette = (theme: Theme): PneSemanticPalette =>
    theme.palette.pne ?? createSemanticPalette(
        normalizeHexColor(theme.palette.primary.main),
        theme.palette.mode === 'dark' ? 'dark' : 'light',
    )

const createSemanticSurfaces = (
    seed: string,
    mode: PneColorMode,
): Omit<PneSemanticPalette, 'ramp' | 'button' | 'switch' | 'checkbox' | 'focusRing' | 'link'> => ({
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
        default: mode === 'dark' ? PNE_DARK_COLORS.textPrimary : PNE_LIGHT_COLORS.textDefault,
        muted: mode === 'dark' ? PNE_DARK_COLORS.textMuted : PNE_LIGHT_COLORS.textMuted,
    },
    control: mode === 'dark'
        ? {
            foreground: PNE_DARK_COLORS.textSecondary,
            foregroundHover: PNE_DARK_COLORS.textPrimary,
            foregroundDisabled: PNE_DARK_COLORS.textDisabled,
            activeBackground: PNE_DARK_COLORS.surfaceSubtle,
        }
        : {
            foreground: PNE_LIGHT_COLORS.controlForeground,
            foregroundHover: PNE_LIGHT_COLORS.controlForegroundHover,
            foregroundDisabled: PNE_LIGHT_COLORS.controlForegroundDisabled,
            activeBackground: PNE_LIGHT_COLORS.controlActiveBackground,
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
    MuiFormHelperText: {
        styleOverrides: {
            root: {
                overflowWrap: 'anywhere',
                whiteSpace: 'normal',
                '&.Mui-error': {
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 5,
                },
            },
        },
    },
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
