import { useEffect, useMemo, useRef, useState } from 'react'
import type { BreakpointLayoutConfig, WidgetBoardLayoutOption } from './types'
import { buildLayoutOptions, getLayoutConfigForWidth } from './widgetBoardLayoutUtils'

type UseWidgetBoardLayoutSourceParams = {
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>
}

export const useWidgetBoardLayoutSource = ({ layoutByBreakpoint }: UseWidgetBoardLayoutSourceParams) => {
    const defaultOption = useMemo<WidgetBoardLayoutOption>(
        () => ({
            id: 'default',
            name: 'Default layout',
            layoutByBreakpoint,
        }),
        [layoutByBreakpoint],
    )

    const initialOptions = useMemo(() => buildLayoutOptions(undefined, defaultOption), [defaultOption])
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

    const breakpoints = useMemo(() => Object.keys(layoutSource).map(Number).sort((a, b) => a - b), [layoutSource])

    const [layoutPreset, setLayoutPreset] = useState(() =>
        getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource, breakpoints),
    )

    useEffect(() => {
        setLayoutPreset(getLayoutConfigForWidth(typeof window !== 'undefined' ? window.innerWidth : undefined, layoutSource, breakpoints))
    }, [breakpoints, layoutSource])

    const currentBreakpointKey = useMemo(
        () => String(layoutPreset.breakpoint ?? breakpoints[0]),
        [breakpoints, layoutPreset.breakpoint],
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
        breakpoints,
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
        setLayoutPreset,
        setLayoutSource,
        setSelectedLayoutId,
    }
}
