import { applyTheme } from '@cloudscape-design/components/theming'
import React, { useEffect } from 'react'
import { cloudscapeTheme } from './cloudscapeTheme'

/**
 * Runtime Cloudscape theming hook. Applies our theme on mount and resets on unmount.
 */
export function CloudscapeThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const { reset } = applyTheme({ theme: cloudscapeTheme })
        return () => reset()
    }, [])

    return <>{children}</>
}

export default CloudscapeThemeProvider
