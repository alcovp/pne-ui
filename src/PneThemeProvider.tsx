import {ThemeProvider} from '@mui/material/styles'
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react'
import type {Skin} from './common/paynet/skin'
import {
    createPneTheme,
    type PneColorMode,
    type PneCreateThemeOptions,
} from './createTheme'

export type PneColorModeContextValue = {
    mode: PneColorMode
    setMode: (mode: PneColorMode) => void
}

export type PneThemeProviderProps = {
    children: React.ReactNode
    skin: Skin
    /** Controlled mode. Use this when persistence is owned by the application. */
    mode?: PneColorMode
    /** In-memory fallback for stories and standalone consumers. No browser storage is used. */
    defaultMode?: PneColorMode
    onModeChange?: (mode: PneColorMode) => void
    themeOptions?: Omit<PneCreateThemeOptions, 'colorMode'>
}

const PneColorModeContext = createContext<PneColorModeContextValue | null>(null)

export const PneThemeProvider = ({
    children,
    skin,
    mode: controlledMode,
    defaultMode = 'light',
    onModeChange,
    themeOptions,
}: PneThemeProviderProps) => {
    const [uncontrolledMode, setUncontrolledMode] = useState<PneColorMode>(defaultMode)
    const mode = controlledMode ?? uncontrolledMode
    const setMode = useCallback((nextMode: PneColorMode) => {
        if (controlledMode === undefined) {
            setUncontrolledMode(nextMode)
        }
        onModeChange?.(nextMode)
    }, [controlledMode, onModeChange])
    const contextValue = useMemo<PneColorModeContextValue>(
        () => ({mode, setMode}),
        [mode, setMode],
    )
    const theme = useMemo(
        () => createPneTheme(skin, {...themeOptions, colorMode: mode}),
        [mode, skin, themeOptions],
    )

    return (
        <PneColorModeContext.Provider value={contextValue}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </PneColorModeContext.Provider>
    )
}

export const usePneColorMode = (): PneColorModeContextValue => {
    const context = useContext(PneColorModeContext)
    if (!context) {
        throw new Error('usePneColorMode must be used within <PneThemeProvider>')
    }
    return context
}

export default PneThemeProvider
