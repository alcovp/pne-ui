import PneButton from './component/PneButton';

declare module '@mui/material/styles' {
    interface Palette {
        pneNeutral: Palette['primary']
        pnePrimary: Palette['primary']
        pnePrimaryLight: Palette['primary']
        pneWhite: Palette['primary']
        pneWarningLight: Palette['primary']
    }

    interface PaletteOptions {
        pneNeutral: PaletteOptions['primary']
        pnePrimary: PaletteOptions['primary']
        pnePrimaryLight: PaletteOptions['primary']
        pneWhite: PaletteOptions['primary']
        pneWarningLight: PaletteOptions['primary']
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
        pnePrimary: true
        pnePrimaryLight: true
        pneNeutral: true
        pneWhite: true
        pneWarningLight: true
    }
}

export {PneButton};