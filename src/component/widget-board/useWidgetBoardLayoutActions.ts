import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { createLayoutId } from './widgetBoardLayoutUtils'
import type {
    BreakpointLayoutConfig,
    WidgetBoardActionsState,
    WidgetBoardEditBehavior,
    WidgetBoardLayoutOption,
    WidgetBoardPersistenceStatus,
} from './types'
import type { WidgetBoardFabStore, WidgetBoardVisibilityItem } from './widgetBoardFabStore'

export type WidgetBoardPersistenceState = {
    status: WidgetBoardPersistenceStatus
    error?: string
    dirtyBreakpointIds: string[]
}

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
    onDiscardLockedLayoutDrafts: () => void
    onRestorePersistedLayout: (
        layoutId: string,
        layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    ) => void
    onSaveAsLockedLayoutSuccess: (
        layoutId: string,
        layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    ) => void
    onPersistenceStateChange: Dispatch<SetStateAction<WidgetBoardPersistenceState>>
    activeBreakpointId: string
    editBehavior: WidgetBoardEditBehavior
    selectedLayoutId: string | undefined
    setLayoutOptions: Dispatch<SetStateAction<WidgetBoardLayoutOption[]>>
    setLayoutSource: Dispatch<SetStateAction<Record<number | string, BreakpointLayoutConfig>>>
    setSelectedLayoutId: Dispatch<SetStateAction<string | undefined>>
}

const serialize = (value: unknown) => JSON.stringify(value ?? {}, (key, nestedValue) => {
    if (key !== 'initialState') return nestedValue
    const initialState = nestedValue as { isHidden?: boolean; isCollapsed?: boolean } | undefined
    return {
        isHidden: Boolean(initialState?.isHidden),
        isCollapsed: Boolean(initialState?.isCollapsed),
    }
})

const toErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message
    if (typeof error === 'string' && error) return error
    return 'Failed to save widget layouts'
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
    onDiscardLockedLayoutDrafts,
    onRestorePersistedLayout,
    onSaveAsLockedLayoutSuccess,
    onPersistenceStateChange,
    activeBreakpointId,
    editBehavior,
    selectedLayoutId,
    setLayoutOptions,
    setLayoutSource,
    setSelectedLayoutId,
}: UseWidgetBoardLayoutActionsParams) => {
    const { t } = useTranslation()
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingAutosaveRef = useRef<{
        options: WidgetBoardLayoutOption[]
        selectedId?: string
    } | null>(null)
    const persistQueueRef = useRef<Promise<void>>(Promise.resolve())
    const persistenceGenerationRef = useRef(0)
    const persistenceStatusRef = useRef<WidgetBoardPersistenceStatus>('idle')
    const persistedOptionsRef = useRef<WidgetBoardLayoutOption[]>(layoutOptions)
    const persistedSelectedIdRef = useRef<string | undefined>(selectedLayoutId)
    const loadedSnapshotReadyRef = useRef(false)
    const saveLayoutsRef = useRef(saveLayouts)

    const layoutOptionsRef = useRef(layoutOptions)
    const selectedLayoutIdRef = useRef(selectedLayoutId)
    const buildCurrentPresetRef = useRef(buildCurrentPreset)
    layoutOptionsRef.current = layoutOptions
    selectedLayoutIdRef.current = selectedLayoutId
    buildCurrentPresetRef.current = buildCurrentPreset
    saveLayoutsRef.current = saveLayouts

    const setPersistenceState = useCallback(
        (status: WidgetBoardPersistenceStatus, error?: string, dirtyBreakpointIds?: string[]) => {
            persistenceStatusRef.current = status
            onPersistenceStateChange(previous => {
                const nextDirtyBreakpointIds = dirtyBreakpointIds ?? previous.dirtyBreakpointIds
                return previous.status === status &&
                    previous.error === error &&
                    previous.dirtyBreakpointIds.length === nextDirtyBreakpointIds.length &&
                    previous.dirtyBreakpointIds.every((id, index) => id === nextDirtyBreakpointIds[index])
                    ? previous
                    : { status, error, dirtyBreakpointIds: nextDirtyBreakpointIds }
            })
        },
        [onPersistenceStateChange],
    )

    const cancelPendingAutosave = useCallback((invalidate = false) => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current)
            autosaveTimeoutRef.current = null
        }
        pendingAutosaveRef.current = null
        if (invalidate) persistenceGenerationRef.current += 1
    }, [])

    useEffect(() => () => {
        const pendingAutosave = pendingAutosaveRef.current
        cancelPendingAutosave(true)
        if (!pendingAutosave) return

        const operation = persistQueueRef.current
            .catch(() => undefined)
            .then(() => saveLayoutsRef.current(pendingAutosave.options, pendingAutosave.selectedId))
        persistQueueRef.current = operation
        void operation.catch(error => {
            console.warn('Failed to save widget layouts during unmount', error)
        })
    }, [cancelPendingAutosave])

    useEffect(() => {
        if (isLoadingLayouts) {
            loadedSnapshotReadyRef.current = false
            cancelPendingAutosave(true)
            setPersistenceState('idle', undefined, [])
            return
        }
        if (loadedSnapshotReadyRef.current) return

        persistedOptionsRef.current = layoutOptions
        persistedSelectedIdRef.current = selectedLayoutId
        loadedSnapshotReadyRef.current = true
    }, [cancelPendingAutosave, isLoadingLayouts, layoutOptions, selectedLayoutId, setPersistenceState])

    const enqueuePersistence = useCallback(
        (
            options: WidgetBoardLayoutOption[],
            nextSelectedId: string | undefined,
        ) => {
            const generation = ++persistenceGenerationRef.current
            setPersistenceState('saving')

            const operation = persistQueueRef.current
                .catch(() => undefined)
                .then(() => saveLayouts(options, nextSelectedId))

            persistQueueRef.current = operation

            return operation.then(
                () => {
                    persistedOptionsRef.current = options
                    persistedSelectedIdRef.current = nextSelectedId
                    if (persistenceGenerationRef.current === generation) {
                        setPersistenceState('idle', undefined, [])
                    }
                },
                error => {
                    if (persistenceGenerationRef.current === generation) {
                        setPersistenceState('error', toErrorMessage(error))
                    }
                    throw error
                },
            )
        },
        [saveLayouts, setPersistenceState],
    )

    const getDirtyBreakpointIds = useCallback((
        options: WidgetBoardLayoutOption[],
        layoutId: string,
    ) => {
        const currentLayout = options.find(option => option.id === layoutId)?.layoutByBreakpoint
        const persistedLayout = persistedOptionsRef.current
            .find(option => option.id === layoutId)
            ?.layoutByBreakpoint
        if (!currentLayout) return []

        const breakpointIds = [
            ...Object.keys(currentLayout),
            ...Object.keys(persistedLayout ?? {}),
        ]
        return [...new Set(breakpointIds)].filter(breakpointId =>
            serialize(currentLayout[breakpointId]) !== serialize(persistedLayout?.[breakpointId]),
        )
    }, [])

    const ensureSelected = useCallback(
        (options: WidgetBoardLayoutOption[], candidate?: string) => {
            if (candidate && options.some(option => option.id === candidate)) return candidate
            return options[0]?.id
        },
        [],
    )

    const getOptionsWithCurrentPreset = useCallback(() => {
        const currentOptions = layoutOptionsRef.current
        const currentSelectedId = selectedLayoutIdRef.current
        if (!currentSelectedId || lockedLayoutIdRef.current === currentSelectedId || !isLayoutStateCurrent) {
            return currentOptions
        }

        const selectedOption = currentOptions.find(option => option.id === currentSelectedId)
        if (!selectedOption) return currentOptions
        const nextPreset = buildCurrentPresetRef.current()
        if (serialize(selectedOption.layoutByBreakpoint) === serialize(nextPreset)) return currentOptions

        return currentOptions.map(option =>
            option.id === currentSelectedId
                ? { ...option, layoutByBreakpoint: nextPreset }
                : option,
        )
    }, [isLayoutStateCurrent, lockedLayoutIdRef])

    const selectLayout = useCallback(
        async (id: string) => {
            const currentSelectedId = selectedLayoutIdRef.current
            const currentOptions = getOptionsWithCurrentPreset()
            if (!id || id === currentSelectedId || !currentOptions.some(option => option.id === id)) return

            cancelPendingAutosave(true)
            await enqueuePersistence(currentOptions, id)
            layoutOptionsRef.current = currentOptions
            selectedLayoutIdRef.current = id
            setLayoutOptions(currentOptions)
            setSelectedLayoutId(id)
        },
        [cancelPendingAutosave, enqueuePersistence, getOptionsWithCurrentPreset, setLayoutOptions, setSelectedLayoutId],
    )

    const addLayout = useCallback(
        async (name: string) => {
            const sourceLayoutId = selectedLayoutIdRef.current
            const isLockedSource = Boolean(
                sourceLayoutId && lockedLayoutIdRef.current === sourceLayoutId,
            )
            cancelPendingAutosave(true)
            const layoutByBreakpoint = buildCurrentPresetRef.current()
            const option: WidgetBoardLayoutOption = {
                id: createLayoutId(),
                name: name.trim() || t('pne.widgetBoard.layouts.customName', { defaultValue: 'Custom layout' }),
                layoutByBreakpoint,
            }
            const nextOptions = [...getOptionsWithCurrentPreset(), option]

            await enqueuePersistence(nextOptions, option.id)
            layoutOptionsRef.current = nextOptions
            selectedLayoutIdRef.current = option.id
            if (isLockedSource) {
                onSaveAsLockedLayoutSuccess(option.id, layoutByBreakpoint)
            }
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(option.id)
            return option.id
        },
        [
            cancelPendingAutosave,
            enqueuePersistence,
            getOptionsWithCurrentPreset,
            lockedLayoutIdRef,
            onSaveAsLockedLayoutSuccess,
            setLayoutOptions,
            setSelectedLayoutId,
            t,
        ],
    )

    const deleteLayout = useCallback(
        async (id: string) => {
            const currentOptions = getOptionsWithCurrentPreset()
            if (!currentOptions.some(option => option.id === id)) return
            if (lockedLayoutIdRef.current && id === lockedLayoutIdRef.current) return

            cancelPendingAutosave(true)
            const nextOptions = currentOptions.filter(option => option.id !== id)
            const nextSelected = id === selectedLayoutIdRef.current
                ? ensureSelected(nextOptions)
                : selectedLayoutIdRef.current

            await enqueuePersistence(nextOptions, nextSelected)
            layoutOptionsRef.current = nextOptions
            selectedLayoutIdRef.current = nextSelected
            setLayoutOptions(nextOptions)
            setSelectedLayoutId(nextSelected)
        },
        [
            cancelPendingAutosave,
            enqueuePersistence,
            ensureSelected,
            getOptionsWithCurrentPreset,
            lockedLayoutIdRef,
            setLayoutOptions,
            setSelectedLayoutId,
        ],
    )

    const flushPendingSave = useCallback(async () => {
        while (true) {
            const currentSelectedId = selectedLayoutIdRef.current
            const pendingAutosave = pendingAutosaveRef.current
            cancelPendingAutosave(true)

            if (!currentSelectedId || lockedLayoutIdRef.current === currentSelectedId) {
                await persistQueueRef.current
                return
            }

            if (!pendingAutosave && persistenceStatusRef.current === 'saving') {
                await persistQueueRef.current
                if (persistenceStatusRef.current === 'saving') {
                    setPersistenceState('idle', undefined, [])
                }
                continue
            }

            const nextOptions = pendingAutosave?.options ?? getOptionsWithCurrentPreset()
            const nextSelectedId = pendingAutosave?.selectedId ?? currentSelectedId
            const matchesPersistedSnapshot =
                persistedSelectedIdRef.current === nextSelectedId &&
                serialize(persistedOptionsRef.current) === serialize(nextOptions)
            if (matchesPersistedSnapshot) {
                setPersistenceState('idle', undefined, [])
                return
            }

            await enqueuePersistence(nextOptions, nextSelectedId)
            layoutOptionsRef.current = nextOptions
            setLayoutOptions(nextOptions)
            const selectedOption = nextOptions.find(option => option.id === nextSelectedId)
            if (selectedOption) {
                setLayoutSource(previous =>
                    previous === selectedOption.layoutByBreakpoint
                        ? previous
                        : selectedOption.layoutByBreakpoint,
                )
            }
        }
    }, [
        cancelPendingAutosave,
        enqueuePersistence,
        getOptionsWithCurrentPreset,
        lockedLayoutIdRef,
        setLayoutOptions,
        setLayoutSource,
        setPersistenceState,
    ])

    const discardLayoutChanges = useCallback(async () => {
        const currentSelectedId = selectedLayoutIdRef.current
        cancelPendingAutosave(true)

        if (persistenceStatusRef.current === 'saving') {
            try {
                await persistQueueRef.current
            } catch {
                // The last successfully persisted snapshot remains the discard target.
            }
        }

        if (!currentSelectedId || lockedLayoutIdRef.current === currentSelectedId) {
            onDiscardLockedLayoutDrafts()
            setPersistenceState('idle', undefined, [])
            return
        }

        const persistedOption = persistedOptionsRef.current.find(option => option.id === currentSelectedId)
        if (!persistedOption) {
            setPersistenceState('idle', undefined, [])
            return
        }

        const nextOptions = layoutOptionsRef.current.map(option =>
            option.id === currentSelectedId ? persistedOption : option,
        )
        layoutOptionsRef.current = nextOptions
        setLayoutOptions(nextOptions)
        setLayoutSource(persistedOption.layoutByBreakpoint)
        onRestorePersistedLayout(currentSelectedId, persistedOption.layoutByBreakpoint)
        setPersistenceState('idle', undefined, [])
    }, [
        cancelPendingAutosave,
        lockedLayoutIdRef,
        onDiscardLockedLayoutDrafts,
        onRestorePersistedLayout,
        setLayoutOptions,
        setLayoutSource,
        setPersistenceState,
    ])

    useEffect(() => {
        if (isLoadingLayouts || !isLayoutStateCurrent) return

        const expectedOwnerId = selectedLayoutId ?? defaultLayoutId
        if (layoutSourceOwnerIdRef.current !== expectedOwnerId) return

        const lockedId = lockedLayoutIdRef.current
        if (!selectedLayoutId || (lockedId && selectedLayoutId === lockedId)) return

        const selectedOption = layoutOptionsMap.get(selectedLayoutId)
        if (!selectedOption) return

        const nextPreset = buildCurrentPreset()
        if (serialize(selectedOption.layoutByBreakpoint) === serialize(nextPreset)) return

        const nextOptions = layoutOptions.map(option =>
            option.id === selectedLayoutId
                ? { ...option, layoutByBreakpoint: nextPreset }
                : option,
        )
        layoutOptionsRef.current = nextOptions
        setLayoutOptions(nextOptions)
        setLayoutSource(previous => (previous === nextPreset ? previous : nextPreset))

        const hasInFlightSave = persistenceStatusRef.current === 'saving'
        cancelPendingAutosave(true)
        const dirtyBreakpointIds = getDirtyBreakpointIds(nextOptions, selectedLayoutId)
        if (
            dirtyBreakpointIds.length === 0 &&
            persistedSelectedIdRef.current === selectedLayoutId &&
            !hasInFlightSave
        ) {
            setPersistenceState('idle', undefined, [])
            return
        }

        const pendingSave = { options: nextOptions, selectedId: selectedLayoutId }
        pendingAutosaveRef.current = pendingSave
        persistenceGenerationRef.current += 1
        setPersistenceState(
            'pending',
            undefined,
            dirtyBreakpointIds.length > 0 ? dirtyBreakpointIds : [activeBreakpointId],
        )
        autosaveTimeoutRef.current = setTimeout(() => {
            autosaveTimeoutRef.current = null
            pendingAutosaveRef.current = null
            void enqueuePersistence(pendingSave.options, pendingSave.selectedId).catch(() => undefined)
        }, 350)
    }, [
        buildCurrentPreset,
        cancelPendingAutosave,
        defaultLayoutId,
        enqueuePersistence,
        getDirtyBreakpointIds,
        isLayoutStateCurrent,
        isLoadingLayouts,
        layoutOptions,
        layoutOptionsMap,
        layoutSourceOwnerIdRef,
        lockedLayoutIdRef,
        activeBreakpointId,
        selectedLayoutId,
        setLayoutOptions,
        setLayoutSource,
        setPersistenceState,
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
            onFlushLayoutSave: flushPendingSave,
            onDiscardLayoutChanges: discardLayoutChanges,
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
        discardLayoutChanges,
        editBehavior,
        fabStore,
        flushPendingSave,
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
        discardLayoutChanges,
        flushPendingSave,
        selectLayout,
    }
}
