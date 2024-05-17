import PneButton from './component/PneButton'
import PneTextField from './component/PneTextField'
import PneModal from './component/PneModal'
import PneAutocomplete from './component/dropdown/PneAutocomplete'
import PneAsyncAutocomplete from './component/dropdown/PneAsyncAutocomplete'
import PneSelect from './component/dropdown/PneSelect'
import PneTable from './component/table/PneTable'
import PneTableRow from './component/table/PneTableRow'
import PneHeaderTableCell from './component/table/PneHeaderTableCell'
import PneTableCell from './component/table/PneTableCell'

// TODO нужно ли тут импортировать и экспортировать после декларирования модулей? как сделать общую тему с
// возможностью ее дополнять?
declare module '@mui/material/styles' {
    interface Palette {
        pneNeutral: Palette['primary']
        pnePrimary: Palette['primary']
        pnePrimaryLight: Palette['primary']
        pneWhite: Palette['primary']
        pneWarningLight: Palette['primary']
        pneText: Palette['primary']
        pneTransparent: Palette['primary']
    }

    interface PaletteOptions {
        pneNeutral: PaletteOptions['primary']
        pnePrimary: PaletteOptions['primary']
        pnePrimaryLight: PaletteOptions['primary']
        pneWhite: PaletteOptions['primary']
        pneWarningLight: PaletteOptions['primary']
        pneText: PaletteOptions['primary']
        pneTransparent: PaletteOptions['primary']
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        pneNeutral: true
        pnePrimary: true
        pneTransparent: true
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        pnePrimary: true
        pnePrimaryLight: true
        pneNeutral: true
        pneWhite: true
        pneWarningLight: true
        pneText: true
    }
}

export {
    PneButton,
    PneTextField,
    PneModal,
    PneAutocomplete,
    PneAsyncAutocomplete,
    PneSelect,
    PneTable,
    PneTableRow,
    PneHeaderTableCell,
    PneTableCell,
}