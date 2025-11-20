import type {Skin} from './common/paynet/skin'

// TODO нужно ли тут импортировать и экспортировать после декларирования модулей? как сделать общую тему с
// возможностью ее дополнять?
declare module '@mui/material/styles' {
    interface Theme {
        skin: Skin
    }

    interface Palette {
        pneNeutral: Palette['primary']
        pnePrimary: Palette['primary']
        pnePrimaryLight: Palette['primary']
        pneWhite: Palette['primary']
        pneWarningLight: Palette['primary']
        pneAccentuated: Palette['primary']
    }

    interface PaletteOptions {
        pneNeutral: PaletteOptions['primary']
        pnePrimary: PaletteOptions['primary']
        pnePrimaryLight: PaletteOptions['primary']
        pneWhite: PaletteOptions['primary']
        pneWarningLight: PaletteOptions['primary']
        pneAccentuated: PaletteOptions['primary']
    }

    // allow configuration using `createTheme`
    interface ThemeOptions {
        skin: Skin
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        pneNeutral: true
        pnePrimary: true
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        pnePrimaryLight: true
        pneNeutral: true
        pneWhite: true
        pneWarningLight: true
    }
}

declare module '@mui/material/ToggleButtonGroup' {
    interface ToggleButtonGroupPropsColorOverrides {
        pneAccentuated: true
    }
}

declare module '@mui/material/ToggleButton' {
    interface ToggleButtonPropsColorOverrides {
        pneAccentuated: true
    }
}

export * from './exports/theme'
export * from './exports/buttons'
export * from './exports/inputs'
export * from './exports/modals'
export * from './exports/table'
export * from './exports/search'
export * from './exports/entities'
export * from './exports/utils'
export * from './common'
