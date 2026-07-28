import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BreakpointLayoutConfig, WidgetBoardLayoutOption } from './types'
import { buildLayoutOptions, getLayoutConfigForBreakpoint } from './widgetBoardLayoutUtils'

type UseWidgetBoardLayoutSourceParams = {
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
    breakpointIds: readonly string[]
    currentBreakpointKey: string
}

export const useWidgetBoardLayoutSource = ({
    layoutByBreakpoint,
    breakpointIds,
    currentBreakpointKey,
}: UseWidgetBoardLayoutSourceParams) => {
    const { t } = useTranslation()
    const defaultOption = useMemo<WidgetBoardLayoutOption>(
        () => ({
            id: 'default',
            name: t('pne.widgetBoard.layouts.defaultName', { defaultValue: 'Default layout' }),
            layoutByBreakpoint,
        }),
        [layoutByBreakpoint, t],
    )

    const initialOptions = useMemo(
        () => buildLayoutOptions(undefined, defaultOption, breakpointIds),
        [breakpointIds, defaultOption],
    )
    const [layoutOptions, setLayoutOptions] = useState<WidgetBoardLayoutOption[]>(initialOptions)
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | undefined>(initialOptions[0]?.id)
    const selectedLayoutRef = useRef<string | undefined>(initialOptions[0]?.id)
    const layoutSourceOwnerIdRef = useRef<string | undefined>(initialOptions[0]?.id)
    const lockedLayoutIdRef = useRef<string | undefined>(defaultOption.id)
    const loadRequestIdRef = useRef(0)

    useEffect(() => {
        selectedLayoutRef.current = selectedLayoutId
    }, [selectedLayoutId])

    const layoutOptionsMap = useMemo(() => new Map(layoutOptions.map(option => [option.id, option])), [layoutOptions])

    useEffect(() => {
        if (!selectedLayoutId || layoutOptionsMap.has(selectedLayoutId)) return
        const fallbackId = layoutOptions[0]?.id
        if (fallbackId && fallbackId !== selectedLayoutId) {
            setSelectedLayoutId(fallbackId)
        }
    }, [layoutOptions, layoutOptionsMap, selectedLayoutId])

    const [layoutSource, setLayoutSource] = useState<Record<number | string, BreakpointLayoutConfig>>(
        () => layoutOptionsMap.get(selectedLayoutId ?? '')?.layoutByBreakpoint ?? defaultOption.layoutByBreakpoint,
    )

    const layoutPreset = useMemo(
        () => getLayoutConfigForBreakpoint(currentBreakpointKey, layoutSource),
        [currentBreakpointKey, layoutSource],
    )

    useEffect(() => {
        const targetLayoutId = selectedLayoutId ?? defaultOption.id

        if (layoutSourceOwnerIdRef.current === targetLayoutId) {
            if (targetLayoutId === defaultOption.id) {
                setLayoutSource(prev => (prev === defaultOption.layoutByBreakpoint ? prev : defaultOption.layoutByBreakpoint))
            }
            return
        }

        const nextSource = layoutOptionsMap.get(selectedLayoutId ?? '')?.layoutByBreakpoint ?? defaultOption.layoutByBreakpoint
        layoutSourceOwnerIdRef.current = targetLayoutId
        setLayoutSource(prev => (prev === nextSource ? prev : nextSource))
    }, [defaultOption.id, defaultOption.layoutByBreakpoint, layoutOptionsMap, selectedLayoutId])

    return {
        breakpoints: breakpointIds,
        currentBreakpointKey,
        defaultOption,
        layoutOptions,
        layoutOptionsMap,
        layoutPreset,
        layoutSource,
        layoutSourceOwnerIdRef,
        loadRequestIdRef,
        lockedLayoutIdRef,
        selectedLayoutId,
        selectedLayoutRef,
        setLayoutOptions,
        setLayoutSource,
        setSelectedLayoutId,
    }
}
