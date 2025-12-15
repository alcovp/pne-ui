import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import type {
    BreakpointLayoutConfig,
    WidgetBoardLayoutOption,
    WidgetBoardLoadLayoutsResult,
    WidgetBoardState,
    WidgetLayoutConfig,
    WidgetLayoutPreset,
} from './types'

export type WidgetLayoutPlacement = {
    columnSpan?: number
    rowSpan?: number
    columnOffset?: WidgetLayoutConfig['defaultSize']['columnOffset']
    isHidden?: boolean
    isCollapsed?: boolean
}

export type WidgetLayoutSettingsBreakpoint = {
    columns?: number
    widgets?: Record<string, WidgetLayoutPlacement>
}

export type WidgetLayoutSettingsLayout = {
    id: string
    name?: string
    layoutByBreakpoint?: Record<number | string, WidgetLayoutSettingsBreakpoint>
    version?: string
    updatedAt?: string
}

export type WidgetLayoutSettings = {
    layouts?: WidgetLayoutSettingsLayout[]
    selectedLayoutId?: string
}

const isStorybookRuntime = () =>
    typeof window !== 'undefined' &&
    (Boolean((window as any).__STORYBOOK_CLIENT_API__) || Boolean((window as any).__STORYBOOK_ADDONS_CHANNEL__))

const cloneLayoutConfig = (config: BreakpointLayoutConfig): BreakpointLayoutConfig => ({
    columns: config.columns,
    widgets: Object.fromEntries(
        Object.entries(config.widgets).map(([id, widget]) => [
            id,
            {
                defaultSize: { ...widget.defaultSize },
                limits: widget.limits ? { ...widget.limits } : undefined,
                initialState: widget.initialState ? { ...widget.initialState } : undefined,
            },
        ]),
    ) as Record<string, WidgetLayoutConfig>,
})

const mergeWidgetPlacement = (base: WidgetLayoutConfig, remote?: WidgetLayoutPlacement): WidgetLayoutConfig => {
    if (!remote) return base

    return {
        defaultSize: {
            ...base.defaultSize,
            columnSpan: remote.columnSpan ?? base.defaultSize.columnSpan,
            rowSpan: remote.rowSpan ?? base.defaultSize.rowSpan,
            columnOffset: (remote.columnOffset as WidgetLayoutConfig['defaultSize']['columnOffset']) ?? base.defaultSize.columnOffset,
        },
        limits: base.limits,
        initialState: {
            ...base.initialState,
            isHidden: remote.isHidden ?? base.initialState?.isHidden,
            isCollapsed: remote.isCollapsed ?? base.initialState?.isCollapsed,
        },
    }
}

const normalizeLayoutMap = (
    layoutByBreakpoint: Record<string | number, WidgetLayoutSettingsBreakpoint> | undefined,
    baseLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpoints: readonly number[],
): Record<number | string, BreakpointLayoutConfig> | null => {
    if (!layoutByBreakpoint) return null

    const normalized: Partial<Record<number | string, BreakpointLayoutConfig>> = {}

    breakpoints.forEach(breakpoint => {
        const base = baseLayoutByBreakpoint[breakpoint] ?? baseLayoutByBreakpoint[String(breakpoint)]
        if (!base) return

        const candidate = layoutByBreakpoint[breakpoint] ?? layoutByBreakpoint[String(breakpoint)]
        if (!candidate) return

        const widgets: Record<string, WidgetLayoutConfig> = {}
        Object.keys(base.widgets).forEach(id => {
            widgets[id] = mergeWidgetPlacement(base.widgets[id], candidate.widgets?.[id])
        })

        normalized[breakpoint] = {
            columns: candidate.columns ?? base.columns,
            widgets,
        }
    })

    if (Object.keys(normalized).length === 0) {
        return null
    }

    return normalized as Record<number | string, BreakpointLayoutConfig>
}

const normalizeLayoutOption = (
    layout: WidgetLayoutSettingsLayout,
    baseLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpoints: readonly number[],
): WidgetBoardLayoutOption | null => {
    const layoutByBreakpoint = normalizeLayoutMap(layout.layoutByBreakpoint, baseLayoutByBreakpoint, breakpoints)
    if (!layoutByBreakpoint) return null

    return {
        id: layout.id,
        name: layout.name || 'Layout',
        preset: {
            layoutByBreakpoint,
            source: 'remote-live',
            version: layout.version,
        },
    }
}

export const normalizeWidgetLayoutSettings = (
    settings: WidgetLayoutSettings | null | undefined,
    defaultOption: WidgetBoardLayoutOption,
    breakpoints: readonly number[] = DEFAULT_BREAKPOINTS,
): WidgetBoardLoadLayoutsResult => {
    const baseLayout = defaultOption.preset.layoutByBreakpoint
    const layouts = settings?.layouts ?? []

    const options = layouts
        .map(layout => normalizeLayoutOption(layout, baseLayout, breakpoints))
        .filter((option): option is WidgetBoardLayoutOption => Boolean(option))

    const optionsWithDefault = options.some(option => option.id === defaultOption.id) ? options : [...options, defaultOption]
    const selectedFromServer =
        settings?.selectedLayoutId && optionsWithDefault.some(option => option.id === settings.selectedLayoutId)
            ? settings.selectedLayoutId
            : optionsWithDefault[0]?.id ?? defaultOption.id

    return { options: optionsWithDefault, selectedId: selectedFromServer }
}

const mapOptionToSettingsLayout = (option: WidgetBoardLayoutOption): WidgetLayoutSettingsLayout => ({
    id: option.id,
    name: option.name,
    layoutByBreakpoint: Object.fromEntries(
        Object.entries(option.preset.layoutByBreakpoint).map(([breakpoint, config]) => [
            breakpoint,
            {
                columns: config.columns,
                widgets: Object.fromEntries(
                    Object.entries(config.widgets).map(([id, widget]) => [
                        id,
                        {
                            columnSpan: widget.defaultSize.columnSpan,
                            rowSpan: widget.defaultSize.rowSpan,
                            columnOffset: widget.defaultSize.columnOffset as WidgetLayoutPlacement['columnOffset'],
                            isHidden: widget.initialState?.isHidden,
                            isCollapsed: widget.initialState?.isCollapsed,
                        } as WidgetLayoutPlacement,
                    ]),
                ),
            },
        ]),
    ),
    version: option.preset.version,
})

export const buildLayoutSettingsPayload = (
    options: WidgetBoardLayoutOption[],
    selectedId?: string,
): WidgetLayoutSettings => ({
    layouts: options.map(mapOptionToSettingsLayout),
    selectedLayoutId: selectedId && options.some(option => option.id === selectedId) ? selectedId : options[0]?.id,
})

export const buildPresetFromState = (
    state: WidgetBoardState | null,
    baseLayoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpoints: readonly number[] = DEFAULT_BREAKPOINTS,
): WidgetLayoutPreset => {
    if (!state) {
        return {
            layoutByBreakpoint: Object.fromEntries(
                Object.entries(baseLayoutByBreakpoint).map(([breakpoint, config]) => [breakpoint, cloneLayoutConfig(config)]),
            ) as Record<number | string, BreakpointLayoutConfig>,
            source: 'remote-live',
        }
    }

    const layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig> = {} as Record<number | string, BreakpointLayoutConfig>

    const hiddenSet = new Set<string>(state.hidden)
    const collapsedSet = new Set<string>(state.collapsed)
    const sizeMemory = state.sizeMemory ?? {}
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
            }
        })

        layoutByBreakpoint[breakpoint] = {
            columns: base.columns,
            widgets,
        }
    })

    return { layoutByBreakpoint, source: 'remote-live' }
}

type RemoteHandlersParams = {
    defaultOption: WidgetBoardLayoutOption
    breakpoints?: readonly number[]
    loadSettings?: () => Promise<WidgetLayoutSettings | null | undefined>
    saveSettings?: (settings: WidgetLayoutSettings) => Promise<void>
    skipWhenStorybook?: boolean
}

export const createWidgetLayoutsRemoteHandlers = ({
    defaultOption,
    breakpoints = DEFAULT_BREAKPOINTS,
    loadSettings,
    saveSettings,
    skipWhenStorybook = true,
}: RemoteHandlersParams) => {
    const shouldSkipRemote = skipWhenStorybook && isStorybookRuntime()

    const loadLayouts = async (): Promise<WidgetBoardLoadLayoutsResult> => {
        if (!loadSettings || shouldSkipRemote) {
            return { options: [defaultOption], selectedId: defaultOption.id }
        }

        try {
            const response = await loadSettings()
            const normalized = normalizeWidgetLayoutSettings(response, defaultOption, breakpoints)
            return normalized ?? { options: [defaultOption], selectedId: defaultOption.id }
        } catch (error) {
            console.warn('Failed to load widget layouts', error)
            return { options: [defaultOption], selectedId: defaultOption.id }
        }
    }

    const saveLayouts = async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
        if (!saveSettings || shouldSkipRemote) return

        const safeOptions = options.length ? options : [defaultOption]
        const resolvedSelected =
            selectedId && safeOptions.some(option => option.id === selectedId) ? selectedId : safeOptions[0]?.id ?? defaultOption.id

        const payload = buildLayoutSettingsPayload(safeOptions, resolvedSelected)

        try {
            await saveSettings(payload)
        } catch (error) {
            console.warn('Failed to save widget layouts', error)
        }
    }

    return { loadLayouts, saveLayouts }
}
