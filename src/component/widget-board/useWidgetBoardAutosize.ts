import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { WidgetBoardState } from './types'
import { DEFAULT_ROW_GAP, DEFAULT_ROW_HEIGHT, type WidgetDefinitionWithLayout } from './widgetBoardLayoutUtils'

type UseWidgetBoardAutosizeParams = {
    autoHeightEnabled: boolean
    lockedHeightModeByWidgetId: Partial<Record<string, boolean>>
    definitionsMap: Map<string, WidgetDefinitionWithLayout>
    currentBreakpointKey: string
    isInteractionLocked: boolean
    layoutPresetBreakpoint: number | string | undefined
    setLayoutState: Dispatch<SetStateAction<WidgetBoardState>>
}

export const useWidgetBoardAutosize = ({
    autoHeightEnabled,
    lockedHeightModeByWidgetId,
    definitionsMap,
    currentBreakpointKey,
    isInteractionLocked,
    layoutPresetBreakpoint,
    setLayoutState,
}: UseWidgetBoardAutosizeParams) => {
    const boardRootRef = useRef<HTMLDivElement | null>(null)
    const gridMetricsRef = useRef<{ rowHeight: number; rowGap: number } | null>(null)
    const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const measuredRowsRef = useRef<Record<string, number>>({})

    const parseCssNumber = useCallback((value: string | null) => {
        if (!value) return Number.NaN
        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed) ? parsed : Number.NaN
    }, [])

    const findGridElement = useCallback((root: HTMLElement) => {
        const boardRoot = root.querySelector<HTMLElement>('[data-awsui-board]') ?? root
        const boardStyle = window.getComputedStyle(boardRoot)
        if (boardStyle.display === 'grid' && boardStyle.gridAutoRows && boardStyle.gridAutoRows !== 'auto') {
            return boardRoot
        }

        const preferred = boardRoot.querySelectorAll<HTMLElement>('[class*="awsui_grid_"]')
        const candidates = preferred.length ? preferred : boardRoot.querySelectorAll<HTMLElement>('div')
        for (const element of candidates) {
            if (element !== boardRoot && element.closest('[data-awsui-board-item]')) continue
            const className = typeof element.className === 'string' ? element.className : ''
            if (className.includes('grid__item')) continue
            const style = window.getComputedStyle(element)
            if (style.display === 'grid' && style.gridAutoRows && style.gridAutoRows !== 'auto') {
                return element
            }
        }
        return null
    }, [])

    const updateGridMetrics = useCallback(() => {
        if (typeof window === 'undefined') return gridMetricsRef.current
        const root = boardRootRef.current
        if (!root) return gridMetricsRef.current
        const grid = findGridElement(root)
        if (!grid) return gridMetricsRef.current
        const style = window.getComputedStyle(grid)
        const rowHeight = parseCssNumber(style.gridAutoRows)
        const rowGapValue = parseCssNumber(style.rowGap)
        const gapValue = parseCssNumber(style.gap)
        const rowGap = Number.isFinite(rowGapValue) ? rowGapValue : Number.isFinite(gapValue) ? gapValue : DEFAULT_ROW_GAP
        if (!Number.isFinite(rowHeight) || rowHeight <= 0) return gridMetricsRef.current
        const next = { rowHeight, rowGap }
        gridMetricsRef.current = next
        return next
    }, [findGridElement, parseCssNumber])

    const computeRequiredRows = useCallback(
        (contentElement: HTMLDivElement) => {
            if (!contentElement.isConnected) return null
            const metrics = updateGridMetrics() ?? { rowHeight: DEFAULT_ROW_HEIGHT, rowGap: DEFAULT_ROW_GAP }
            const containerRoot =
                (contentElement.closest('[data-awsui-board-item]') as HTMLElement | null) ??
                (contentElement.closest('[class*="container-override"]') as HTMLElement | null)
            if (!containerRoot) return null

            const containerRect = containerRoot.getBoundingClientRect()
            const contentRect = contentElement.getBoundingClientRect()
            const offsetTop = contentRect.top - containerRect.top
            const contentHeight = contentElement.scrollHeight

            if (!Number.isFinite(offsetTop) || !Number.isFinite(contentHeight) || contentHeight <= 0) return null

            const requiredPx = offsetTop + contentHeight
            return Math.ceil((requiredPx + metrics.rowGap) / (metrics.rowHeight + metrics.rowGap))
        },
        [updateGridMetrics],
    )

    const applyAutoSize = useCallback(
        (widgetId: string, requiredRows: number) => {
            setLayoutState(prev => {
                const definition = definitionsMap.get(widgetId)
                if (!definition) return prev
                if (lockedHeightModeByWidgetId[widgetId]) return prev
                if (prev.collapsed.includes(widgetId)) return prev

                const heightMode = prev.heightModeMemory[currentBreakpointKey]?.[widgetId] ?? definition.layout.heightMode ?? 'auto'
                if (heightMode !== 'auto') return prev

                const index = prev.items.findIndex(item => item.id === widgetId)
                if (index < 0) return prev

                const minRows = Math.max(definition.layout.limits?.minRowSpan ?? 2, 2)
                const nextRows = Math.max(minRows, requiredRows)
                const currentItem = prev.items[index]
                if (currentItem.rowSpan === nextRows) return prev

                const nextItems = [...prev.items]
                nextItems[index] = { ...currentItem, rowSpan: nextRows }
                return { ...prev, items: nextItems }
            })
        },
        [currentBreakpointKey, definitionsMap, lockedHeightModeByWidgetId, setLayoutState],
    )

    const handleContentResize = useCallback(
        (widgetId: string, contentElement: HTMLDivElement) => {
            if (!autoHeightEnabled) return
            if (isInteractionLocked) return
            const requiredRows = computeRequiredRows(contentElement)
            if (!requiredRows) return
            measuredRowsRef.current[widgetId] = requiredRows
            applyAutoSize(widgetId, requiredRows)
        },
        [applyAutoSize, autoHeightEnabled, computeRequiredRows, isInteractionLocked],
    )

    const handleContentRef = useCallback(
        (widgetId: string, node: HTMLDivElement | null) => {
            const map = contentRefs.current
            const observer = resizeObserverRef.current
            const prev = map.get(widgetId)
            if (prev === node) return

            if (prev && observer) {
                observer.unobserve(prev)
            }

            if (!node) {
                map.delete(widgetId)
                return
            }

            map.set(widgetId, node)
            if (!autoHeightEnabled) {
                delete measuredRowsRef.current[widgetId]
                return
            }
            if (observer) {
                observer.observe(node)
            }
            requestAnimationFrame(() => handleContentResize(widgetId, node))
        },
        [autoHeightEnabled, handleContentResize],
    )

    const remeasureAll = useCallback(() => {
        if (!autoHeightEnabled) return
        if (isInteractionLocked) return
        updateGridMetrics()
        contentRefs.current.forEach((element, widgetId) => {
            handleContentResize(widgetId, element)
        })
    }, [autoHeightEnabled, handleContentResize, isInteractionLocked, updateGridMetrics])

    useEffect(() => {
        if (!autoHeightEnabled) return
        if (typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const target = entry.target as HTMLDivElement
                const widgetId = target.dataset.widgetId
                if (!widgetId) return
                handleContentResize(widgetId, target)
            })
        })
        resizeObserverRef.current = observer
        contentRefs.current.forEach(element => observer.observe(element))
        return () => {
            observer.disconnect()
            resizeObserverRef.current = null
        }
    }, [autoHeightEnabled, handleContentResize])

    useEffect(() => {
        if (!autoHeightEnabled) {
            measuredRowsRef.current = {}
        }
    }, [autoHeightEnabled])

    useEffect(() => {
        remeasureAll()
    }, [layoutPresetBreakpoint, remeasureAll])

    return {
        boardRootRef,
        handleContentRef,
        measuredRowsRef,
        remeasureAll,
    }
}
