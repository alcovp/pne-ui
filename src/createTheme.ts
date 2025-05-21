import {createTheme, Theme} from '@mui/material/styles'
import {Skin} from './common/paynet/skin'
import {ThemeOptions} from '@mui/material/styles/createTheme'

const MISSING_COLOR = '#ff00dc'

export const createPneTheme = (
    skin: Skin,
    options?: Omit<ThemeOptions, 'skin'> | undefined,
    ...args: object[]
): Theme => {
    console.log('Creating theme...')
    const theme = createTheme({
        skin: skin,
        palette: {
            tonalOffset: {
                dark: 0.1, // results: as designed: #1075eb, generated: #207be5
                light: 0.8, // results: as designed: #D3E7FF, generated: #D3E7FF
            },
            primary: {
                main: skin.experimentalColor || MISSING_COLOR,
            },
            pneNeutral: {
                main: skin.experimentalColor || MISSING_COLOR,
            },//TODO put 4 colors here and then use it at styleOverrides
            pnePrimary: {
                main: skin.experimentalColor || MISSING_COLOR,
            },
            pnePrimaryLight: {
                main: skin.experimentalColor || MISSING_COLOR,
            },
            pneWhite: {
                main: skin.experimentalColor || MISSING_COLOR,
            },
            pneWarningLight: {
                main: '#F5762F',
            },
            pneAccentuated: {
                main: skin.experimentalColor || MISSING_COLOR,
            },
        },
        components: {
            MuiIconButton: {
                styleOverrides: {
                    root: ({ownerState, theme}) => {
                        if (ownerState.color === 'pnePrimary') {
                            return {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                    color: theme.palette.primary.contrastText,
                                },
                            }
                        } else if (ownerState.color === 'pneNeutral') {
                            return {
                                backgroundColor: '#F1F5FA', //TODO hardcode. move to pne palette
                                stroke: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: theme.palette.primary.dark,
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
                            return {
                                backgroundColor: '#F1F5FA', //TODO hardcode. move to pne palette
                                color: theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneWhite') {
                            return {
                                backgroundColor: '#fff',
                                color: theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pnePrimaryLight') {
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
                        } else if (ownerState.color === 'pneWarningLight') {
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
                        } else {
                            return {
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                },
                            }
                        }
                    },
                },
            },
            MuiToggleButtonGroup: {
                styleOverrides: {
                    root: ({ownerState, theme}) => {
                        if (ownerState.color === 'pneAccentuated') {
                            return {
                                backgroundColor: '#ffffff',
                            }
                        } else {
                            return {}
                        }
                    },
                },
            },
        },
        ...options,
        ...args,
    })

    return theme
}