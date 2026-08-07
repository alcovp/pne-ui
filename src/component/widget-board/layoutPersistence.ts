import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import type { BreakpointLayoutConfig, WidgetBoardState, WidgetLayoutConfig } from './types'

const cloneLayoutConfig = (config: BreakpointLayoutConfig): BreakpointLayoutConfig => ({
    columns: config.columns,
    rowHeight: config.rowHeight,
    margin: config.margin,
    containerPadding: config.containerPadding,
    widgetOrder: config.widgetOrder ? [...config.widgetOrder] : undefined,
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
    breakpoints: readonly (number | string)[] = DEFAULT_BREAKPOINTS,
    activeBreakpoint?: number | string,
): Record<number | string, BreakpointLayoutConfig> => {
    if (!state) {
        return Object.fromEntries(
            Object.entries(baseLayoutByBreakpoint).map(([breakpoint, config]) => [breakpoint, cloneLayoutConfig(config)]),
        ) as Record<number | string, BreakpointLayoutConfig>
    }

    const layoutByBreakpoint = Object.fromEntries(
        Object.entries(baseLayoutByBreakpoint).map(([breakpoint, config]) => [
            breakpoint,
            cloneLayoutConfig(config),
        ]),
    ) as Record<number | string, BreakpointLayoutConfig>

    const hiddenSet = new Set<string>(state.hidden)
    const collapsedSet = new Set<string>(state.collapsed)
    const layoutMemory = state.layoutMemory ?? {}
    const itemMap = new Map<string, (typeof state.items)[number]>(state.items.map(item => [item.id as string, item]))

    breakpoints.forEach(breakpoint => {
        const isActiveBreakpoint = activeBreakpoint === undefined || String(activeBreakpoint) === String(breakpoint)
        const base =
            baseLayoutByBreakpoint[breakpoint] ??
            baseLayoutByBreakpoint[String(breakpoint)] ??
            Object.values(baseLayoutByBreakpoint)[0]

        if (!base) return
        if (!isActiveBreakpoint) {
            if (!layoutByBreakpoint[breakpoint]) {
                layoutByBreakpoint[breakpoint] = cloneLayoutConfig(base)
            }
            return
        }

        const widgets: Record<string, WidgetLayoutConfig> = {}
        const memoryForBreakpoint = layoutMemory[String(breakpoint)] ?? {}
        const managedWidgetIds = new Set([
            ...itemMap.keys(),
            ...hiddenSet,
            ...Object.keys(memoryForBreakpoint),
        ])

        Object.keys(base.widgets).forEach(id => {
            const baseConfig = base.widgets[id]
            if (!managedWidgetIds.has(id)) {
                widgets[id] = {
                    ...baseConfig,
                    defaultSize: { ...baseConfig.defaultSize },
                    limits: baseConfig.limits ? { ...baseConfig.limits } : undefined,
                    initialState: baseConfig.initialState ? { ...baseConfig.initialState } : undefined,
                }
                return
            }

            const item = itemMap.get(id)
            const rememberedSnapshot = memoryForBreakpoint[id]
            const isHidden = hiddenSet.has(id) || !item
            const isCollapsed = collapsedSet.has(id)

            widgets[id] = {
                defaultSize: {
                    columnSpan: item?.columnSpan ?? rememberedSnapshot?.columnSpan ?? baseConfig.defaultSize.columnSpan,
                    rowSpan: baseConfig.defaultSize.rowSpan,
                    columnOffset: item?.columnOffset ?? rememberedSnapshot?.columnOffset ?? baseConfig.defaultSize.columnOffset,
                },
                limits: baseConfig.limits,
                initialState: {
                    ...baseConfig.initialState,
                    isHidden,
                    isCollapsed,
                },
                heightMode: baseConfig.heightMode,
            }
        })

        const baseOrderCandidates = [
            ...(base.widgetOrder ?? Object.keys(base.widgets)),
            ...Object.keys(base.widgets).filter(id => !base.widgetOrder?.includes(id)),
        ]
        const seenBaseOrderIds = new Set<string>()
        const baseOrder = baseOrderCandidates.filter(id => {
            if (!base.widgets[id] || seenBaseOrderIds.has(id)) return false
            seenBaseOrderIds.add(id)
            return true
        })
        const seenManagedOrderIds = new Set<string>()
        const managedOrder = [...state.widgetOrder, ...baseOrder].filter(id => {
            if (!base.widgets[id] || !managedWidgetIds.has(id) || seenManagedOrderIds.has(id)) return false
            seenManagedOrderIds.add(id)
            return true
        })
        const managedOrderIterator = managedOrder[Symbol.iterator]()
        const widgetOrder = baseOrder.map(id =>
            managedWidgetIds.has(id) ? managedOrderIterator.next().value ?? id : id,
        )

        layoutByBreakpoint[breakpoint] = {
            columns: base.columns,
            rowHeight: base.rowHeight,
            margin: base.margin,
            containerPadding: base.containerPadding,
            widgetOrder,
            widgets,
        }
    })

    return layoutByBreakpoint
}
