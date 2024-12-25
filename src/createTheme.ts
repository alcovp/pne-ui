import {createTheme, Theme} from '@mui/material/styles';
import {Skin} from './common/paynet/skin';
import {ThemeOptions} from '@mui/material/styles/createTheme';

const MISSING_COLOR = '#ff00dc'
let theme: Theme | null = null

export const createPneTheme = (
    skin: Skin,
    options?: Omit<ThemeOptions, 'skin'> | undefined,
    ...args: object[]
): Theme => {
    if (theme) {
        return theme
    }

    theme = createTheme({
        skin: skin,
        palette: {
            tonalOffset: {
                dark: 0.1, // results: as designed: #1075eb, generated: #207be5
                light: 0.8 // results: as designed: #D3E7FF, generated: #D3E7FF
            },
            primary: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pneNeutral: {
                main: skin.experimentalColor || MISSING_COLOR
            },//TODO put 6 colors here and then use it at styleOverrides
            pneText: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pneTransparent: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pnePrimary: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pnePrimaryLight: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pneWhite: {
                main: skin.experimentalColor || MISSING_COLOR
            },
            pneWarningLight: {
                main: '#F5762F'
            },
        },
        components: {
            // MuiTooltip: {
            //     styleOverrides: {
            //         tooltip: {},
            //         popper: {
            //             // our menu has 1050 and mui modals have 1080 z-indexes
            //             zIndex: 1040 + '!important',
            //         }
            //     },
            // },
            MuiIconButton: {
                styleOverrides: {
                    root: ({ownerState, theme}) => {
                        if (ownerState.color === 'pnePrimary') {
                            return {
                                backgroundColor: theme.palette.primary.main,
                                stroke: '#fff',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                    stroke: '#fff',
                                }
                            }
                        } else if (ownerState.color === 'pneNeutral') {
                            return {
                                backgroundColor: '#F1F5FA', //TODO hardcode. move to pne palette
                                stroke: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: theme.palette.primary.dark,
                                }
                            }
                        } else if (ownerState.color === 'pneTransparent') {
                            return {
                                color: theme.palette.primary.main,
                                stroke: ownerState.disabled ? theme.palette.text.disabled
                                    : theme.palette.primary.main,
                            }
                        }
                        return {}
                    },
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: ({ownerState, theme}) => {
                        if (ownerState.color === 'pnePrimary') {
                            return {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                stroke: theme.palette.primary.contrastText,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                    stroke: theme.palette.primary.contrastText,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneNeutral') {
                            return {
                                backgroundColor: '#F1F5FA', //TODO hardcode. move to pne palette
                                color: theme.palette.primary.main,
                                stroke: ownerState.disabled ? theme.palette.text.disabled
                                    : theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: ownerState.disabled ? theme.palette.text.disabled
                                        : theme.palette.primary.main,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneWhite') {
                            return {
                                backgroundColor: '#fff',
                                color: theme.palette.primary.main,
                                stroke: ownerState.disabled ? theme.palette.text.disabled
                                    : theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: ownerState.disabled ? theme.palette.text.disabled
                                        : theme.palette.primary.main,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pnePrimaryLight') {
                            return {
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.main,
                                stroke: ownerState.disabled ? theme.palette.text.disabled
                                    : theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                    stroke: theme.palette.primary.contrastText,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneWarningLight') {
                            return {
                                backgroundColor: theme.palette.warning.light,
                                color: theme.palette.warning.contrastText,
                                stroke: theme.palette.warning.contrastText,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.warning.main,
                                    color: theme.palette.warning.contrastText,
                                    stroke: theme.palette.warning.contrastText,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneText') {
                            return {
                                color: theme.palette.primary.main,
                                stroke: ownerState.disabled ? theme.palette.text.disabled
                                    : theme.palette.primary.main,
                                boxShadow: 'none',
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
                }
            },
        },
        ...options,
        ...args,
    })

    return theme
}