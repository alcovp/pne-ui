import {createTheme, Theme} from '@mui/material/styles';

const mainColor = '#1686ca';
let theme: Theme | null = null;

export const createPneTheme = (): Theme => {
    if (theme) {
        return theme;
    }

    theme = createTheme({
        palette: {
            tonalOffset: {
                dark: 0.1, // results: as designed: #1075eb, generated: #207be5
                light: 0.8 // results: as designed: #D3E7FF, generated: #D3E7FF
            },
            primary: {
                main: mainColor
            },
            pneNeutral: {
                main: mainColor
            },//TODO put 4 colors here and then use it at styleOverrides
            pnePrimary: {
                main: mainColor
            },
            pnePrimaryLight: {
                main: mainColor
            },
            pneWhite: {
                main: mainColor
            },
            pneWarningLight: {
                main: '#F5762F'
            },
        },
        components: {
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {},
                    popper: {
                        // our menu has 1050 and mui modals have 1080 z-indexes
                        zIndex: 1040 + '!important',
                    }
                },
            },
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
                                stroke: theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: theme.palette.primary.main,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pneWhite') {
                            return {
                                backgroundColor: '#fff',
                                color: theme.palette.primary.main,
                                stroke: theme.palette.primary.main,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.light,
                                    stroke: theme.palette.primary.main,
                                    boxShadow: 'none',
                                },
                            }
                        } else if (ownerState.color === 'pnePrimaryLight') {
                            return {
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.main,
                                stroke: theme.palette.primary.main,
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
                        }
                        return {}
                    },
                }
            },
        }
    });
    return theme;
}