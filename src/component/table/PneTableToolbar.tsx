import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {Box, BoxProps, SxProps, Theme} from '@mui/material'
import {createAutoTestAttributes} from '../AutoTestAttribute'

export type PneTableToolbarLayout = 'inline' | 'stacked'

type PneTableToolbarAccessibleName =
    | {
        'aria-label': string
        'aria-labelledby'?: never
    }
    | {
        'aria-label'?: never
        'aria-labelledby': string
    }

export type PneTableToolbarProps = Omit<
    BoxProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'component' | 'ref'
> & PneTableToolbarAccessibleName & {
    /** Contextual controls such as current selection and bulk actions. */
    contextual?: React.ReactNode
    /** Persistent controls such as a table View selector. */
    persistent?: React.ReactNode
}

type ResolvePneTableToolbarLayoutParams = {
    availableWidth: number
    contextualWidth: number
    persistentWidth: number
    hasContextual: boolean
    hasPersistent: boolean
}

const CONTROL_GROUP_GAP = 8
const useToolbarLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const resolvePneTableToolbarLayout = ({
    availableWidth,
    contextualWidth,
    persistentWidth,
    hasContextual,
    hasPersistent,
}: ResolvePneTableToolbarLayoutParams): PneTableToolbarLayout => {
    if (!hasContextual || !hasPersistent || availableWidth <= 0) {
        return 'inline'
    }

    return contextualWidth + CONTROL_GROUP_GAP + persistentWidth <= availableWidth
        ? 'inline'
        : 'stacked'
}

const getGroupSx = (layout: PneTableToolbarLayout): SxProps<Theme> => ({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    maxWidth: '100%',
    minWidth: 0,
    width: layout === 'stacked' ? '100%' : 'max-content',
})

const PneTableToolbar = (props: PneTableToolbarProps) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        contextual,
        persistent,
        sx,
        ...rootProps
    } = props
    const hasContextual = contextual !== undefined
        && contextual !== null
        && typeof contextual !== 'boolean'
    const hasPersistent = persistent !== undefined
        && persistent !== null
        && typeof persistent !== 'boolean'
    const rootRef = useRef<HTMLDivElement>(null)
    const contextualRef = useRef<HTMLDivElement>(null)
    const contextualContentRef = useRef<HTMLDivElement>(null)
    const persistentRef = useRef<HTMLDivElement>(null)
    const persistentContentRef = useRef<HTMLDivElement>(null)
    const [layout, setLayout] = useState<PneTableToolbarLayout>('inline')

    useToolbarLayoutEffect(() => {
        const root = rootRef.current
        if (!root) {
            return
        }

        const ownerWindow = root.ownerDocument?.defaultView
        if (!ownerWindow) {
            return
        }

        const measureLayout = () => {
            const measurePreferredWidth = (element: HTMLElement | null): number => {
                if (!element) {
                    return 0
                }

                return Math.max(
                    element.scrollWidth,
                    element.getBoundingClientRect().width,
                )
            }
            const availableWidth = root.clientWidth || root.getBoundingClientRect().width
            const nextLayout = resolvePneTableToolbarLayout({
                availableWidth,
                contextualWidth: measurePreferredWidth(contextualContentRef.current),
                persistentWidth: measurePreferredWidth(persistentContentRef.current),
                hasContextual,
                hasPersistent,
            })

            setLayout(currentLayout => currentLayout === nextLayout
                ? currentLayout
                : nextLayout)
        }

        measureLayout()

        const ResizeObserverCtor = ownerWindow.ResizeObserver
        if (ResizeObserverCtor) {
            const resizeObserver = new ResizeObserverCtor(measureLayout)
            const observedElements = [
                root,
                contextualRef.current,
                contextualContentRef.current,
                ...Array.from(contextualContentRef.current?.children ?? []),
                persistentRef.current,
                persistentContentRef.current,
                ...Array.from(persistentContentRef.current?.children ?? []),
            ]
            observedElements.forEach(element => {
                if (element) {
                    resizeObserver.observe(element)
                }
            })

            return () => resizeObserver.disconnect()
        }

        ownerWindow.addEventListener('resize', measureLayout)
        return () => ownerWindow.removeEventListener('resize', measureLayout)
    }, [hasContextual, hasPersistent])

    const groupSx = getGroupSx(layout)

    return <Box
        {...rootProps}
        {...createAutoTestAttributes('table-control-bar', layout)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        ref={rootRef}
        role='group'
        sx={[
            {
                alignItems: 'center',
                columnGap: `${CONTROL_GROUP_GAP}px`,
                display: 'grid',
                gridTemplateColumns: layout === 'inline'
                    ? 'minmax(0, max-content) minmax(0, max-content)'
                    : 'minmax(0, 1fr)',
                maxWidth: '100%',
                minWidth: 0,
                rowGap: `${CONTROL_GROUP_GAP}px`,
                width: layout === 'stacked' ? '100%' : 'max-content',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        {hasContextual ? <Box
            {...createAutoTestAttributes('table-contextual-controls')}
            key='contextual'
            ref={contextualRef}
            sx={groupSx}
        >
            <Box
                ref={contextualContentRef}
                sx={{
                    alignItems: 'center',
                    display: 'flex',
                    maxWidth: '100%',
                    minWidth: 0,
                    width: 'max-content',
                }}
            >
                {contextual}
            </Box>
        </Box> : null}
        {hasPersistent ? <Box
            {...createAutoTestAttributes('table-persistent-controls')}
            key='persistent'
            ref={persistentRef}
            sx={groupSx}
        >
            <Box
                ref={persistentContentRef}
                sx={{
                    alignItems: 'center',
                    display: 'flex',
                    maxWidth: '100%',
                    minWidth: 0,
                    width: 'max-content',
                }}
            >
                {persistent}
            </Box>
        </Box> : null}
    </Box>
}

export default PneTableToolbar
