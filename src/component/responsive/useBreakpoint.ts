import { useEffect, useState } from 'react'
import { DEFAULT_BREAKPOINTS, resolveBreakpoint } from '../../common/responsive/breakpoints'

type UseBreakpointOptions = {
    breakpoints?: readonly number[]
}

/**
 * Returns the nearest configured breakpoint for the current window width.
 */
export function useBreakpoint({ breakpoints = DEFAULT_BREAKPOINTS }: UseBreakpointOptions = {}) {
    const [current, setCurrent] = useState(() =>
        typeof window !== 'undefined' ? resolveBreakpoint(window.innerWidth, breakpoints) : breakpoints[0],
    )

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handler = () => setCurrent(resolveBreakpoint(window.innerWidth, breakpoints))
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [breakpoints])

    return current
}
