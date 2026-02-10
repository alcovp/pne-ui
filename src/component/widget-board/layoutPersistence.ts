import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import type { BreakpointLayoutConfig, WidgetBoardState, WidgetLayoutConfig } from './types'

const cloneLayoutConfig = (config: BreakpointLayoutConfig): BreakpointLayoutConfig => ({
    widgets: Object.fromEntries(
        Object.entries(config.widgets).map(([id, widget]) => [
            id,
            {
                defaultSize: { ...widget.defaultSize },
                limits: widget.limits ? { ...widget.limits } : undefined,
                initialState: widget.initialState ? { ...widget.initialState } : undefined,
                heightMode: widget.heightMode,
            },
        ]),
    ) as Record<string, WidgetLayoutConfig>,
})

export const buildPresetFromState = (
    state: WidgetBoardState | null,
    baseLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpoints: readonly number[] = DEFAULT_BREAKPOINTS,
): Record<number | string, BreakpointLayoutConfig> => {
    if (!state) {
        return Object.fromEntries(
            Object.entries(baseLayoutByBreakpoint).map(([breakpoint, config]) => [breakpoint, cloneLayoutConfig(config)]),
        ) as Record<number | string, BreakpointLayoutConfig>
    }

    const layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig> = {} as Record<number | string, BreakpointLayoutConfig>

    const hiddenSet = new Set<string>(state.hidden)
    const collapsedSet = new Set<string>(state.collapsed)
    const sizeMemory = state.sizeMemory ?? {}
    const heightModeMemory = state.heightModeMemory ?? {}
    const layoutMemory = state.layoutMemory ?? {}
    const itemMap = new Map<string, (typeof state.items)[number]>(state.items.map(item => [item.id as string, item]))

    breakpoints.forEach(breakpoint => {
        const base =
            baseLayoutByBreakpoint[breakpoint] ??
            baseLayoutByBreakpoint[String(breakpoint)] ??
            Object.values(baseLayoutByBreakpoint)[0]

        if (!base) return

        const widgets: Record<string, WidgetLayoutConfig> = {}
        const memoryForBreakpoint = layoutMemory[String(breakpoint)] ?? {}
        const heightModeForBreakpoint = heightModeMemory[String(breakpoint)] ?? {}

        Object.keys(base.widgets).forEach(id => {
            const baseConfig = base.widgets[id]
            const item = itemMap.get(id)
            const rememberedSnapshot = memoryForBreakpoint[id]
            const isHidden = hiddenSet.has(id) || !item
            const isCollapsed = collapsedSet.has(id)
            const rememberedSize =
                sizeMemory[id] ?? item?.rowSpan ?? rememberedSnapshot?.rowSpan ?? baseConfig.defaultSize.rowSpan

            widgets[id] = {
                defaultSize: {
                    columnSpan: item?.columnSpan ?? rememberedSnapshot?.columnSpan ?? baseConfig.defaultSize.columnSpan,
                    rowSpan: rememberedSize,
                    columnOffset: item?.columnOffset ?? rememberedSnapshot?.columnOffset ?? baseConfig.defaultSize.columnOffset,
                },
                limits: baseConfig.limits,
                initialState: {
                    ...baseConfig.initialState,
                    isHidden,
                    isCollapsed,
                },
                heightMode: heightModeForBreakpoint[id] ?? baseConfig.heightMode,
            }
        })

        layoutByBreakpoint[breakpoint] = { widgets }
    })

    return layoutByBreakpoint
}
