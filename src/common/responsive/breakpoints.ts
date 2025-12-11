export const DEFAULT_BREAKPOINTS = [360, 640, 800, 1024, 1600, 2500] as const

export type Breakpoint = (typeof DEFAULT_BREAKPOINTS)[number]

export const resolveBreakpoint = (width?: number, breakpoints: readonly number[] = DEFAULT_BREAKPOINTS): number => {
    if (!width || Number.isNaN(width)) {
        return breakpoints[0]
    }

    let match = breakpoints[0]
    for (const breakpoint of breakpoints) {
        if (width >= breakpoint) {
            match = breakpoint
        } else {
            break
        }
    }

    return match
}
