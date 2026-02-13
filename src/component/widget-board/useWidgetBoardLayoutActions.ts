import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { setWidgetLayoutsPanelBridge } from './widgetLayoutsPanelStore'
import { createLayoutId } from './widgetBoardLayoutUtils'
import type { BreakpointLayoutConfig, WidgetBoardActionsState, WidgetBoardLayoutOption, WidgetBoardProps } from './types'

type UseWidgetBoardLayoutActionsParams = {
    buildCurrentPreset: () => Record<number | string, BreakpointLayoutConfig>
    defaultLayoutId: string
    isLoadingLayouts: boolean
    layoutOptions: WidgetBoardLayoutOption[]
    layoutOptionsMap: Map<string, WidgetBoardLayoutOption>
    layoutSourceOwnerIdRef: MutableRefObject<string | undefined>
    lockedLayoutIdRef: MutableRefObject<string | undefined>
    saveLayouts: WidgetBoardProps['saveLayouts']
    actionsState: WidgetBoardActionsState
    onResetLayout: () => void
    onRestoreHidden: () => void
    selectedLayoutId: string | undefined
    setLayoutOptions: Dispatch<SetStateAction<WidgetBoardLayoutOption[]>>
    setSelectedLayoutId: Dispatch<SetStateAction<string | undefined>>
}

export const useWidgetBoardLayoutActions = ({
    buildCurrentPreset,
    defaultLayoutId,
    isLoadingLayouts,
    layoutOptions,
    layoutOptionsMap,
    layoutSourceOwnerIdRef,
    lockedLayoutIdRef,
    saveLayouts,
    actionsState,
    onResetLayout,
    onRestoreHidden,
    selectedLayoutId,
    setLayoutOptions,
    setSelectedLayoutId,
}: UseWidgetBoardLayoutActionsParams) => {
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current)
            }
        }
    }, [])

    const ensureSelected = useCallback(
        (options: WidgetBoardLayoutOption[], candidate?: string) => {
            if (candidate && options.some(option => option.id === candidate)) return candidate
            return options[0]?.id
        },
        [],
    )

    const persistLayouts = useCallback(
        (options: WidgetBoardLayoutOption[], nextSelectedId?: string) => {
            Promise.resolve(saveLayouts(options, nextSelectedId)).catch(error => {
                console.warn('Failed to save widget layouts', error)
            })
        },
        [saveLayouts],
    )

    const selectLayout = useCallback(
        (id: string) => {
            if (!id || id === selectedLayoutId || !layoutOptionsMap.has(id)) return
            setSelectedLayoutId(id)
            persistLayouts(layoutOptions, id)
        },
        [layoutOptions, layoutOptionsMap, persistLayouts, selectedLayoutId, setSelectedLayoutId],
    )

    const addLayout = useCallback(
        (name: string) => {
            const layoutByBreakpoint = buildCurrentPreset()
            const option: WidgetBoardLayoutOption = {
                id: createLayoutId(),
                name: name.trim() || 'Custom layout',
                layoutByBreakpoint,
            }
            const nextOptions = [...layoutOptions, option]
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(option.id)
            persistLayouts(nextOptions, option.id)
        },
        [buildCurrentPreset, layoutOptions, persistLayouts, setLayoutOptions, setSelectedLayoutId],
    )

    const deleteLayout = useCallback(
        (id: string) => {
            if (!layoutOptionsMap.has(id)) return
            if (lockedLayoutIdRef.current && id === lockedLayoutIdRef.current) return
            const nextOptions = layoutOptions.filter(option => option.id !== id)
            const nextSelected = id === selectedLayoutId ? ensureSelected(nextOptions) : selectedLayoutId
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(nextSelected)
            persistLayouts(nextOptions, nextSelected)
        },
        [ensureSelected, layoutOptions, layoutOptionsMap, lockedLayoutIdRef, persistLayouts, selectedLayoutId, setLayoutOptions, setSelectedLayoutId],
    )

    useEffect(() => {
        if (isLoadingLayouts) return

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

        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current)
        }
        autosaveTimeoutRef.current = setTimeout(() => {
            persistLayouts(nextOptions, selectedLayoutId)
            autosaveTimeoutRef.current = null
        }, 350)
    }, [
        buildCurrentPreset,
        defaultLayoutId,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        persistLayouts,
        selectedLayoutId,
        setLayoutOptions,
    ])

    useEffect(() => {
        const panelProps = {
            items: layoutOptions,
            selectedId: selectedLayoutId,
            onSelect: selectLayout,
            onAdd: addLayout,
            onDelete: deleteLayout,
            lockedIds: lockedLayoutIdRef.current ? [lockedLayoutIdRef.current] : [],
            actionsState,
            onResetLayout,
            onRestoreHidden,
        }
        setWidgetLayoutsPanelBridge(panelProps)
        return () => {
            setWidgetLayoutsPanelBridge(null)
        }
    }, [actionsState, addLayout, deleteLayout, layoutOptions, lockedLayoutIdRef, onResetLayout, onRestoreHidden, selectLayout, selectedLayoutId])

    return {
        addLayout,
        deleteLayout,
        selectLayout,
    }
}
