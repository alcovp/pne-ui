import React, {isValidElement, useLayoutEffect, useRef, useState} from 'react'
import {flushSync} from 'react-dom'
import Tooltip, {type TooltipProps} from '@mui/material/Tooltip'
import {useForkRef} from '@mui/material/utils'

export type PneTooltipProps = TooltipProps & {ref?: React.Ref<Element>}

type Arming = 'mouse' | 'focus' | 'touch'

type ChildProps = Record<string, unknown> & {
    className?: string
    ref?: React.Ref<unknown>
    onFocus?: (event: React.FocusEvent) => void
    onMouseOver?: (event: React.MouseEvent) => void
    onTouchEnd?: (event: React.TouchEvent) => void
}

const joinClassNames = (...names: Array<string | undefined>): string | undefined =>
    names.filter(Boolean).join(' ') || undefined

/**
 * The MUI Tooltip of the theme, mounted only once it may show.
 *
 * A Tooltip is a dozen hooks, timers and styled slots for every element it wraps, and lists wrap most of their
 * cells: a table of 50 rows spent most of its render in its closed tooltips. Until the pointer or the focus first
 * reaches the element, it stands alone, carrying what the closed Tooltip would give it (its name from a text
 * title, the props meant for the child). Then the Tooltip mounts at once, inside that very event, and gets the
 * event again: it opens after its delay as if it had always been there. The element is drawn anew at that moment
 * (the Tooltip draws its child); a focused element keeps the focus. A touch mounts the Tooltip after the tap, for
 * the next long press. A controlled tooltip (`open`) mounts from the start.
 */
const PneTooltip = ({ref, children, ...props}: PneTooltipProps) => {
    const [armedBy, setArmedBy] = useState<Arming | null>(null)
    const childRef = useRef<HTMLElement | null>(null)
    const child = isValidElement<ChildProps>(children) ? children : <span>{children}</span>
    const childProps = child.props
    const handleRef = useForkRef(childProps.ref, childRef, ref)
    const tooltipRef = useForkRef(ref, childRef)
    const mounted = armedBy !== null || props.open !== undefined

    // The Tooltip has just mounted on the event that armed it, around an element drawn anew: it gets that event.
    useLayoutEffect(() => {
        const node = childRef.current
        const view = node?.ownerDocument.defaultView
        if (!node || !view) {
            return
        }
        if (armedBy === 'mouse') {
            node.dispatchEvent(new view.MouseEvent('mouseover', {bubbles: true, cancelable: true}))
        } else if (armedBy === 'focus' && node.ownerDocument.activeElement !== node) {
            node.focus({preventScroll: true})
        }
    }, [armedBy])

    if (mounted) {
        return (
            <Tooltip {...props} ref={tooltipRef}>
                {child}
            </Tooltip>
        )
    }

    const {
        arrow: _arrow,
        classes: _classes,
        describeChild = false,
        disableFocusListener = false,
        disableHoverListener = false,
        disableInteractive: _disableInteractive,
        disableTouchListener = false,
        enterDelay: _enterDelay,
        enterNextDelay: _enterNextDelay,
        enterTouchDelay: _enterTouchDelay,
        followCursor: _followCursor,
        id: _id,
        leaveDelay: _leaveDelay,
        leaveTouchDelay: _leaveTouchDelay,
        onClose: _onClose,
        onOpen: _onOpen,
        open: _open,
        placement: _placement,
        slotProps: _slotProps,
        slots: _slots,
        title,
        ...other
    } = props
    const titleIsString = typeof title === 'string'
    const merged = {...other, ...childProps} as ChildProps
    // What the closed MUI Tooltip puts on its child: a text title names it, or describes it as a native title.
    const nameOrDescription = describeChild
        ? {title: titleIsString && !disableHoverListener ? title : undefined}
        : {'aria-label': titleIsString ? title : undefined}
    // Inside the event that armed it: a press that follows lands on the element drawn anew, not on the old one.
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the mount must not wait for the next task
    const arm = (by: Arming) => flushSync(() => setArmedBy(current => current ?? by))

    return React.cloneElement(child, {
        ...nameOrDescription,
        ...merged,
        className: joinClassNames(other.className as string | undefined, childProps.className),
        ref: handleRef,
        ...(disableHoverListener
            ? {}
            : {
                  onMouseOver: (event: React.MouseEvent) => {
                      merged.onMouseOver?.(event)
                      arm('mouse')
                  },
              }),
        ...(disableFocusListener
            ? {}
            : {
                  onFocus: (event: React.FocusEvent) => {
                      merged.onFocus?.(event)
                      arm('focus')
                  },
              }),
        ...(disableTouchListener
            ? {}
            : {
                  onTouchEnd: (event: React.TouchEvent) => {
                      merged.onTouchEnd?.(event)
                      // After the tap, not inside it: the element the tap is on stays until its click has landed.
                      setTimeout(() => setArmedBy(current => current ?? 'touch'))
                  },
              }),
    })
}

PneTooltip.displayName = 'PneTooltip'

export default PneTooltip
