import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { createLayoutId } from './widgetBoardLayoutUtils'
import type {
    BreakpointLayoutConfig,
    WidgetBoardActionsState,
    WidgetBoardEditBehavior,
    WidgetBoardLayoutOption,
} from './types'
import type { WidgetBoardFabStore, WidgetBoardVisibilityItem } from './widgetBoardFabStore'

type UseWidgetBoardLayoutActionsParams = {
    buildCurrentPreset: () => Record<number | string, BreakpointLayoutConfig>
    defaultLayoutId: string
    isLoadingLayouts: boolean
    isLayoutStateCurrent: boolean
    layoutOptions: WidgetBoardLayoutOption[]
    layoutOptionsMap: Map<string, WidgetBoardLayoutOption>
    layoutSourceOwnerIdRef: MutableRefObject<string | undefined>
    lockedLayoutIdRef: MutableRefObject<string | undefined>
    saveLayouts: (options: WidgetBoardLayoutOption[], selectedId?: string) => Promise<void>
    fabStore: WidgetBoardFabStore
    actionsState: WidgetBoardActionsState
    visibilityItems: WidgetBoardVisibilityItem[]
    onSetWidgetVisibility: (id: string, visible: boolean) => void
    onResetLayout: () => void
    onRestoreHidden: () => void
    activeBreakpointId: string
    editBehavior: WidgetBoardEditBehavior
    selectedLayoutId: string | undefined
    setLayoutOptions: Dispatch<SetStateAction<WidgetBoardLayoutOption[]>>
    setLayoutSource: Dispatch<SetStateAction<Record<number | string, BreakpointLayoutConfig>>>
    setSelectedLayoutId: Dispatch<SetStateAction<string | undefined>>
}

export const useWidgetBoardLayoutActions = ({
    buildCurrentPreset,
    defaultLayoutId,
    isLoadingLayouts,
    isLayoutStateCurrent,
    layoutOptions,
    layoutOptionsMap,
    layoutSourceOwnerIdRef,
    lockedLayoutIdRef,
    saveLayouts,
    fabStore,
    actionsState,
    visibilityItems,
    onSetWidgetVisibility,
    onResetLayout,
    onRestoreHidden,
    activeBreakpointId,
    editBehavior,
    selectedLayoutId,
    setLayoutOptions,
    setLayoutSource,
    setSelectedLayoutId,
}: UseWidgetBoardLayoutActionsParams) => {
    const { t } = useTranslation()
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const persistQueueRef = useRef<Promise<void>>(Promise.resolve())

    const cancelPendingAutosave = useCallback(() => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current)
            autosaveTimeoutRef.current = null
        }
    }, [])

    useEffect(() => cancelPendingAutosave, [cancelPendingAutosave])

    const ensureSelected = useCallback(
        (options: WidgetBoardLayoutOption[], candidate?: string) => {
            if (candidate && options.some(option => option.id === candidate)) return candidate
            return options[0]?.id
        },
        [],
    )

    const persistLayouts = useCallback(
        (options: WidgetBoardLayoutOption[], nextSelectedId?: string) => {
            persistQueueRef.current = persistQueueRef.current
                .catch(() => undefined)
                .then(() => saveLayouts(options, nextSelectedId))
                .catch(error => {
                    console.warn('Failed to save widget layouts', error)
                })
        },
        [saveLayouts],
    )

    const selectLayout = useCallback(
        (id: string) => {
            if (!id || id === selectedLayoutId || !layoutOptionsMap.has(id)) return
            cancelPendingAutosave()
            setSelectedLayoutId(id)
            persistLayouts(layoutOptions, id)
        },
        [
            cancelPendingAutosave,
            layoutOptions,
            layoutOptionsMap,
            persistLayouts,
            selectedLayoutId,
            setSelectedLayoutId,
        ],
    )

    const addLayout = useCallback(
        (name: string) => {
            cancelPendingAutosave()
            const layoutByBreakpoint = buildCurrentPreset()
            const option: WidgetBoardLayoutOption = {
                id: createLayoutId(),
                name: name.trim() || t('pne.widgetBoard.layouts.customName', { defaultValue: 'Custom layout' }),
                layoutByBreakpoint,
            }
            const nextOptions = [...layoutOptions, option]
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(option.id)
            persistLayouts(nextOptions, option.id)
        },
        [
            buildCurrentPreset,
            cancelPendingAutosave,
            layoutOptions,
            persistLayouts,
            setLayoutOptions,
            setSelectedLayoutId,
            t,
        ],
    )

    const deleteLayout = useCallback(
        (id: string) => {
            if (!layoutOptionsMap.has(id)) return
            if (lockedLayoutIdRef.current && id === lockedLayoutIdRef.current) return
            cancelPendingAutosave()
            const nextOptions = layoutOptions.filter(option => option.id !== id)
            const nextSelected = id === selectedLayoutId ? ensureSelected(nextOptions) : selectedLayoutId
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(nextSelected)
            persistLayouts(nextOptions, nextSelected)
        },
        [
            cancelPendingAutosave,
            ensureSelected,
            layoutOptions,
            layoutOptionsMap,
            lockedLayoutIdRef,
            persistLayouts,
            selectedLayoutId,
            setLayoutOptions,
            setSelectedLayoutId,
        ],
    )

    useEffect(() => {
        if (isLoadingLayouts || !isLayoutStateCurrent) return

        const expectedOwnerId = selectedLayoutId ?? defaultLayoutId
        if (layoutSourceOwnerIdRef.current !== expectedOwnerId) return

        const lockedId = lockedLayoutIdRef.current
        if (!selectedLayoutId || (lockedId && selectedLayoutId === lockedId)) return

        const selectedOption = layoutOptionsMap.get(selectedLayoutId)
        if (!selectedOption) return

        const nextPreset = buildCurrentPreset()
        const selectedSerialized = JSON.stringify(selectedOption.layoutByBreakpoint ?? {})
        const nextSerialized = JSON.stringify(nextPreset ?? {})
        if (selectedSerialized === nextSerialized) return

        const nextOptions = layoutOptions.map(option => (option.id === selectedLayoutId ? { ...option, layoutByBreakpoint: nextPreset } : option))
        setLayoutOptions(nextOptions)
        setLayoutSource(previous => (previous === nextPreset ? previous : nextPreset))

        if (autosaveTimeoutRef.current) {
            cancelPendingAutosave()
        }
        autosaveTimeoutRef.current = setTimeout(() => {
            persistLayouts(nextOptions, selectedLayoutId)
            autosaveTimeoutRef.current = null
        }, 350)
    }, [
        buildCurrentPreset,
        cancelPendingAutosave,
        defaultLayoutId,
        isLayoutStateCurrent,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        persistLayouts,
        selectedLayoutId,
        setLayoutOptions,
        setLayoutSource,
    ])

    const addInfo = useMemo(() => {
        const sourceLayoutId = selectedLayoutId ?? defaultLayoutId
        const sourceOption = layoutOptionsMap.get(sourceLayoutId)
        if (!sourceOption) return undefined

        return {
            basedOnName: sourceOption.name,
        }
    }, [defaultLayoutId, layoutOptionsMap, selectedLayoutId])

    useEffect(() => {
        const panelProps = {
            items: layoutOptions,
            selectedId: selectedLayoutId,
            onSelect: selectLayout,
            onAdd: addLayout,
            onDelete: deleteLayout,
            addInfo,
            lockedIds: lockedLayoutIdRef.current ? [lockedLayoutIdRef.current] : [],
            actionsState,
            visibilityItems,
            onSetWidgetVisibility,
            onResetLayout,
            onRestoreHidden,
            activeBreakpointId,
            editBehavior,
            isLoadingLayouts,
        }
        fabStore.getState().setPanelState(panelProps)
        return () => {
            fabStore.getState().resetPanelState()
        }
    }, [
        actionsState,
        activeBreakpointId,
        addInfo,
        addLayout,
        deleteLayout,
        editBehavior,
        fabStore,
        isLoadingLayouts,
        layoutOptions,
        lockedLayoutIdRef,
        onSetWidgetVisibility,
        onResetLayout,
        onRestoreHidden,
        selectLayout,
        selectedLayoutId,
        visibilityItems,
    ])

    return {
        addLayout,
        deleteLayout,
        selectLayout,
    }
}
