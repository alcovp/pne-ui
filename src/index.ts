import type {Skin} from './common/paynet/skin'
import type {PneSemanticPalette} from './createTheme'

declare module '@mui/material/styles' {
    interface Theme {
        skin: Skin
    }

    interface Palette {
        pne: PneSemanticPalette
        pneNeutral: Palette['primary']
        pnePrimary: Palette['primary']
        pneAccentuated: Palette['primary']
    }

    interface PaletteOptions {
        pne?: PneSemanticPalette
        pneNeutral?: PaletteOptions['primary']
        pnePrimary?: PaletteOptions['primary']
        pneAccentuated?: PaletteOptions['primary']
    }

    // allow configuration using `createTheme`
    interface ThemeOptions {
        skin?: Skin
    }
}

// The fields of pne-ui have three sizes, so `size` takes `large` wherever MUI declares it for a field.
declare module '@mui/material/TextField' {
    interface TextFieldPropsSizeOverrides {
        large: true
    }
}

declare module '@mui/material/InputBase' {
    interface InputBasePropsSizeOverrides {
        large: true
    }
}

declare module '@mui/material/FormControl' {
    interface FormControlPropsSizeOverrides {
        large: true
    }
}

declare module '@mui/material/Autocomplete' {
    interface AutocompletePropsSizeOverrides {
        large: true
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        pneNeutral: true
        pnePrimary: true
    }
}

// The button of pne-ui is the MUI `Button` drawn by the theme (`buttonLook.ts`): `soft` is the
// fourth variant, and the colours the UI Kit has no button for are not offered.
declare module '@mui/material/Button' {
    interface ButtonPropsVariantOverrides {
        soft: true
    }

    interface ButtonPropsColorOverrides {
        info: false
        secondary: false
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
export * from './exports/inputs'
export * from './exports/dates'
export * from './exports/modals'
export * from './exports/table'
export * from './exports/search'
export * from './exports/entities'
export * from './exports/utils'
export * from './exports/overlay'
export * from './exports/confirm'
export * from './exports/fab'
export * from './exports/navigation'
export * from './common'
