import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import type { WidgetBoardLayoutOption, WidgetBoardLoadLayoutsResult, WidgetBoardState } from './types'
import type { WidgetLayoutSettings } from './layoutPersistence'
import { buildPresetFromState, createWidgetLayoutsRemoteHandlers } from './layoutPersistence'

type UseWidgetLayoutsManagerParams = {
    defaultOption: WidgetBoardLayoutOption
    breakpoints?: readonly number[]
    loadSettings?: () => Promise<WidgetLayoutSettings | null | undefined>
    saveSettings?: (settings: WidgetLayoutSettings) => Promise<void>
    lockedLayoutIds?: string[]
    skipRemoteInStorybook?: boolean
}

export type WidgetLayoutsManager = {
    layoutOptions: WidgetBoardLayoutOption[]
    selectedLayoutId?: string
    layoutState: WidgetBoardState | null
    hiddenCount: number
    loadLayouts: () => Promise<WidgetBoardLoadLayoutsResult>
    handleLayoutPersist: (state: WidgetBoardState) => void
    selectLayout: (id: string) => Promise<void>
    addLayout: (name: string) => Promise<void>
    updateLayout: (id: string) => Promise<void>
    deleteLayout: (id: string) => Promise<void>
}

const createLayoutId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `layout-${Date.now()}`
}

export const useWidgetLayoutsManager = ({
    defaultOption,
    breakpoints = DEFAULT_BREAKPOINTS,
    loadSettings,
    saveSettings,
    lockedLayoutIds,
    skipRemoteInStorybook = true,
}: UseWidgetLayoutsManagerParams): WidgetLayoutsManager => {
    const lockedIdsSet = useMemo(() => new Set(lockedLayoutIds ?? [defaultOption.id]), [defaultOption.id, lockedLayoutIds])

    const [layoutOptions, setLayoutOptions] = useState<WidgetBoardLayoutOption[]>([defaultOption])
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | undefined>(defaultOption.id)
    const [layoutState, setLayoutState] = useState<WidgetBoardState | null>(null)

    const { loadLayouts: loadRemoteLayouts, saveLayouts: saveRemoteLayouts } = useMemo(
        () =>
            createWidgetLayoutsRemoteHandlers({
                defaultOption,
                breakpoints,
                loadSettings,
                saveSettings,
                skipWhenStorybook: skipRemoteInStorybook,
            }),
        [breakpoints, defaultOption, loadSettings, saveSettings, skipRemoteInStorybook],
    )

    const handleLayoutPersist = useCallback((state: WidgetBoardState) => {
        setLayoutState(state)
    }, [])

    const ensureSelected = useCallback(
        (options: WidgetBoardLayoutOption[], candidate?: string) => {
            if (candidate && options.some(option => option.id === candidate)) return candidate
            return options[0]?.id
        },
        [],
    )

    const loadLayouts = useCallback(async (): Promise<WidgetBoardLoadLayoutsResult> => {
        const loaded = await loadRemoteLayouts()
        const options = loaded.options?.length ? loaded.options : [defaultOption]
        const selected = loaded.selectedId && options.some(option => option.id === loaded.selectedId) ? loaded.selectedId : options[0]?.id
        setLayoutOptions(options)
        setSelectedLayoutId(selected)
        return { options, selectedId: selected }
    }, [defaultOption, loadRemoteLayouts])

    const persistLayouts = useCallback(
        async (options: WidgetBoardLayoutOption[], selectedId?: string) => {
            const nextOptions = options.length ? options : [defaultOption]
            const resolvedSelected = ensureSelected(nextOptions, selectedId)

            setLayoutOptions(nextOptions)
            setSelectedLayoutId(resolvedSelected)

            await saveRemoteLayouts(nextOptions, resolvedSelected)
        },
        [defaultOption, ensureSelected, saveRemoteLayouts],
    )

    const selectLayout = useCallback(
        async (id: string) => {
            if (!id || id === selectedLayoutId) return
            await persistLayouts(layoutOptions, id)
        },
        [layoutOptions, persistLayouts, selectedLayoutId],
    )

    const addLayout = useCallback(
        async (name: string) => {
            const preset = buildPresetFromState(layoutState, defaultOption.preset.layoutByBreakpoint, breakpoints)
            const option: WidgetBoardLayoutOption = {
                id: createLayoutId(),
                name: name.trim() || 'Custom layout',
                preset,
            }
            await persistLayouts([...layoutOptions, option], option.id)
        },
        [breakpoints, defaultOption.preset.layoutByBreakpoint, layoutOptions, layoutState, persistLayouts],
    )

    const updateLayout = useCallback(
        async (id: string) => {
            if (!id || lockedIdsSet.has(id)) return
            const preset = buildPresetFromState(layoutState, defaultOption.preset.layoutByBreakpoint, breakpoints)
            const nextOptions = layoutOptions.map(option => (option.id === id ? { ...option, preset } : option))
            await persistLayouts(nextOptions, selectedLayoutId)
        },
        [breakpoints, defaultOption.preset.layoutByBreakpoint, layoutOptions, layoutState, lockedIdsSet, persistLayouts, selectedLayoutId],
    )

    const deleteLayout = useCallback(
        async (id: string) => {
            if (!id || lockedIdsSet.has(id)) return
            const nextOptions = layoutOptions.filter(option => option.id !== id)
            const nextSelected = id === selectedLayoutId ? ensureSelected(nextOptions) : selectedLayoutId
            await persistLayouts(nextOptions, nextSelected)
        },
        [ensureSelected, layoutOptions, lockedIdsSet, persistLayouts, selectedLayoutId],
    )

    const hiddenCount = layoutState?.hidden.length ?? 0

    return {
        layoutOptions,
        selectedLayoutId,
        layoutState,
        hiddenCount,
        loadLayouts,
        handleLayoutPersist,
        selectLayout,
        addLayout,
        updateLayout,
        deleteLayout,
    }
}
