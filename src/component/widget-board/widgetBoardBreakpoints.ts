import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BreakpointLayoutConfig, WidgetBoardBreakpoint, WidgetBoardBreakpointSource } from './types'

const sortBreakpoints = (breakpoints: readonly WidgetBoardBreakpoint[]): WidgetBoardBreakpoint[] =>
    breakpoints
        .map((breakpoint, index) => ({ breakpoint, index }))
        .filter(({ breakpoint }) => breakpoint.id.length > 0 && Number.isFinite(breakpoint.minWidth))
        .sort((left, right) => left.breakpoint.minWidth - right.breakpoint.minWidth || left.index - right.index)
        .filter(
            ({ breakpoint }, index, sorted) =>
                sorted.findIndex(candidate => candidate.breakpoint.id === breakpoint.id) === index,
        )
        .map(({ breakpoint }) => ({ ...breakpoint }))

export const buildWidgetBoardBreakpoints = (
    layoutByBreakpoint: Record<number | string, BreakpointLayoutConfig>,
    breakpoints?: readonly WidgetBoardBreakpoint[],
): WidgetBoardBreakpoint[] => {
    if (breakpoints?.length) {
        const normalized = sortBreakpoints(breakpoints)
        if (normalized.length) return normalized
    }

    const derived = sortBreakpoints(
        Object.keys(layoutByBreakpoint).map(id => ({
            id,
            minWidth: Number(id),
        })),
    )
    if (derived.length) return derived

    const fallbackId = Object.keys(layoutByBreakpoint)[0] ?? '0'
    return [{ id: fallbackId, minWidth: 0 }]
}

export const resolveWidgetBoardBreakpoint = (
    width: number | undefined,
    breakpoints: readonly WidgetBoardBreakpoint[],
): WidgetBoardBreakpoint => {
    const first = breakpoints[0] ?? { id: '0', minWidth: 0 }
    if (width === undefined || !Number.isFinite(width)) return first

    let match = first
    for (const breakpoint of breakpoints) {
        if (width >= breakpoint.minWidth) {
            match = breakpoint
        } else {
            break
        }
    }
    return match
}

type UseWidgetBoardBreakpointParams = {
    breakpoints: readonly WidgetBoardBreakpoint[]
    source: WidgetBoardBreakpointSource
}

export const useWidgetBoardBreakpoint = ({ breakpoints, source }: UseWidgetBoardBreakpointParams) => {
    const [viewportWidth, setViewportWidth] = useState<number | undefined>(() =>
        typeof window === 'undefined' ? undefined : window.innerWidth,
    )
    const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null)
    const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)

    const containerRef = useCallback((node: HTMLDivElement | null) => {
        setContainerNode(previous => (previous === node ? previous : node))
    }, [])

    useEffect(() => {
        if (source !== 'viewport' || typeof window === 'undefined') return
        const handleResize = () => setViewportWidth(window.innerWidth)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [source])

    useEffect(() => {
        if (source !== 'container' || !containerNode) return

        const measure = () => {
            const width = containerNode.getBoundingClientRect().width
            if (!Number.isFinite(width)) return
            setContainerWidth(previous => (previous === width ? previous : width))
        }
        measure()

        if (typeof ResizeObserver === 'undefined') {
            if (typeof window === 'undefined') return
            window.addEventListener('resize', measure)
            return () => window.removeEventListener('resize', measure)
        }

        const observer = new ResizeObserver(measure)
        observer.observe(containerNode)
        return () => observer.disconnect()
    }, [containerNode, source])

    const activeWidth = source === 'container' ? containerWidth : viewportWidth
    const activeBreakpoint = useMemo(
        () => resolveWidgetBoardBreakpoint(activeWidth, breakpoints),
        [activeWidth, breakpoints],
    )

    return {
        activeBreakpoint,
        containerRef,
        containerWidth,
        viewportWidth,
    }
}
