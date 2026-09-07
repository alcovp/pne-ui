import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react'
import type {FluidDragActions, PreDragActions, SensorAPI} from '@hello-pangea/dnd'
import useImmediateTouchSensor from '../src/component/non-abstract-entity-selector/useImmediateTouchSensor'

type Point = {x: number; y: number}

const pointer = (target: Element | Window, type: string, options: Partial<PointerEvent> = {}) => {
    const event = new Event(type, {bubbles: true, cancelable: true})
    Object.assign(event, {
        pointerId: 1, pointerType: 'touch', isPrimary: true,
        button: 0, clientX: 100, clientY: 100,
        ...options,
    })
    fireEvent(target, event)
    return event
}

const setup = () => {
    let phase: 'idle' | 'pending' | 'dragging' = 'idle'
    let stop: (() => void) | undefined
    let moveFrame: number | undefined
    const appliedMoves: Point[] = []
    const pointsAtDrop: Array<Point | undefined> = []
    const finish = () => {
        phase = 'idle'
        if (moveFrame !== undefined) cancelAnimationFrame(moveFrame)
    }
    const drag: FluidDragActions = {
        isActive: jest.fn(() => phase === 'dragging'),
        shouldRespectForcePress: () => false,
        // Match the public API's RAF batching, including cancellation during drop.
        move: jest.fn((point: Point) => {
            if (moveFrame !== undefined) cancelAnimationFrame(moveFrame)
            moveFrame = requestAnimationFrame(() => appliedMoves.push(point))
        }),
        drop: jest.fn(() => {
            pointsAtDrop.push(appliedMoves.at(-1))
            finish()
        }),
        cancel: jest.fn(finish),
    }
    const pre: PreDragActions = {
        isActive: jest.fn(() => phase === 'pending'),
        shouldRespectForcePress: () => false,
        abort: jest.fn(finish),
        fluidLift: jest.fn(() => {
            phase = 'dragging'
            return drag
        }),
        snapLift: jest.fn(),
    }
    const api: SensorAPI = {
        tryGetLock: jest.fn((_id, forceStop) => {
            if (phase !== 'idle') return null
            phase = 'pending'
            stop = forceStop
            return pre
        }),
        findClosestDraggableId: jest.fn(event => event.target instanceof Element
            ? event.target.closest('[data-rfd-drag-handle-draggable-id]')?.getAttribute('data-rfd-drag-handle-draggable-id') ?? null
            : null),
        canGetLock: () => phase === 'idle',
        isLockClaimed: () => phase !== 'idle',
        tryReleaseLock: jest.fn(),
        findOptionsForDraggable: () => null,
    }
    const onClick = jest.fn()
    const Harness = () => {
        useImmediateTouchSensor(api)
        return <>
            <button data-rfd-drag-handle-draggable-id='row-1' onClick={onClick}>Grip</button>
            <button>Outside</button>
        </>
    }
    const view = render(<Harness />)
    const handle = screen.getByRole('button', {name: 'Grip'})
    const captured = new Set<number>()
    const setCapture = jest.fn((id: number) => captured.add(id))
    const releaseCapture = jest.fn((id: number) => captured.delete(id))
    Object.defineProperties(handle, {
        setPointerCapture: {value: setCapture},
        hasPointerCapture: {value: (id: number) => captured.has(id)},
        releasePointerCapture: {value: releaseCapture},
    })
    return {
        ...view, api, pre, drag, handle, onClick, setCapture, releaseCapture, pointsAtDrop,
        abandon: () => {
            phase = 'idle'
            stop?.()
        },
    }
}

describe('useImmediateTouchSensor', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('starts on movement without waiting and applies the final pointerup coordinate before drop', () => {
        const {api, pre, drag, handle, setCapture, releaseCapture, pointsAtDrop} = setup()
        const down = pointer(handle, 'pointerdown')
        expect(api.tryGetLock).toHaveBeenCalledWith('row-1', expect.any(Function), {sourceEvent: down})
        expect(setCapture).toHaveBeenCalledWith(1)
        pointer(handle, 'pointermove', {clientY: 104})
        expect(pre.fluidLift).not.toHaveBeenCalled()
        pointer(handle, 'pointermove', {clientY: 105})
        expect(pre.fluidLift).toHaveBeenCalledWith({x: 100, y: 100})
        expect(drag.move).toHaveBeenLastCalledWith({x: 100, y: 105})
        const up = pointer(handle, 'pointerup', {clientY: 180})
        expect(up.defaultPrevented).toBe(true)
        expect(drag.drop).not.toHaveBeenCalled()
        expect(releaseCapture).toHaveBeenCalledWith(1)
        // Normal release emits lostpointercapture; it must not cancel the queued drop.
        pointer(handle, 'lostpointercapture')
        act(() => jest.advanceTimersByTime(20))
        expect(pointsAtDrop).toEqual([{x: 100, y: 180}])
        expect(drag.drop).toHaveBeenCalledTimes(1)
        expect(drag.cancel).not.toHaveBeenCalled()
    })

    it('preserves short taps and blocks only the click produced by a completed drag', () => {
        const {pre, handle, onClick} = setup()
        expect(pointer(handle, 'pointerdown').defaultPrevented).toBe(false)
        expect(pointer(handle, 'pointerup').defaultPrevented).toBe(false)
        fireEvent.click(handle)
        expect(pre.abort).toHaveBeenCalledTimes(1)
        expect(onClick).toHaveBeenCalledTimes(1)
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 150})
        pointer(handle, 'pointerup', {clientY: 150})
        expect(fireEvent.click(handle)).toBe(false)
        expect(onClick).toHaveBeenCalledTimes(1)
        act(() => jest.advanceTimersByTime(20))
        fireEvent.click(handle)
        expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('ignores mouse, pen, secondary touches, non-handles and denied locks', () => {
        const {api, pre, handle, setCapture} = setup()
        pointer(handle, 'pointerdown', {pointerType: 'mouse'})
        pointer(handle, 'pointerdown', {pointerType: 'pen'})
        pointer(handle, 'pointerdown', {isPrimary: false})
        pointer(screen.getByRole('button', {name: 'Outside'}), 'pointerdown')
        expect(api.tryGetLock).not.toHaveBeenCalled()
        jest.mocked(api.tryGetLock).mockReturnValueOnce(null)
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 160})
        expect(setCapture).not.toHaveBeenCalled()
        expect(pre.fluidLift).not.toHaveBeenCalled()
    })

    it.each(['pointercancel', 'lostpointercapture'])('aborts pending %s and allows a fresh gesture', eventType => {
        const {pre, drag, handle} = setup()
        pointer(handle, 'pointerdown')
        pointer(handle, eventType)
        expect(pre.abort).toHaveBeenCalledTimes(1)
        expect(drag.cancel).not.toHaveBeenCalled()
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 150})
        expect(pre.fluidLift).toHaveBeenCalledTimes(1)
    })

    it.each(['pointercancel', 'lostpointercapture', 'blur', 'resize', 'orientationchange', 'visibilitychange', 'Escape'])('cancels an active drag on %s', eventType => {
        const {drag, handle} = setup()
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 150})
        if (eventType === 'Escape') {
            fireEvent.keyDown(window, {key: 'Escape'})
        } else if (eventType === 'visibilitychange') {
            jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)
            fireEvent(document, new Event('visibilitychange'))
        } else if (eventType === 'pointercancel' || eventType === 'lostpointercapture') {
            pointer(handle, eventType)
        } else {
            fireEvent(window, new Event(eventType))
        }
        expect(drag.cancel).toHaveBeenCalledWith({shouldBlockNextClick: true})
        pointer(handle, 'pointerup')
        act(() => jest.advanceTimersByTime(20))
        expect(drag.drop).not.toHaveBeenCalled()
    })

    it('cancels on a second touch and ignores unrelated pointer movement/end', () => {
        const {pre, drag, handle} = setup()
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {pointerId: 2, clientY: 160})
        pointer(handle, 'pointerup', {pointerId: 2})
        expect(pre.abort).not.toHaveBeenCalled()
        expect(pre.fluidLift).not.toHaveBeenCalled()
        pointer(handle, 'pointermove', {clientY: 160})
        pointer(handle, 'pointerdown', {pointerId: 2, isPrimary: false})
        expect(drag.cancel).toHaveBeenCalledTimes(1)
    })

    it('aborts a pending drag on scroll but allows scrolling during an active drag', () => {
        const {pre, drag, handle} = setup()
        pointer(handle, 'pointerdown')
        fireEvent.scroll(window)
        expect(pre.abort).toHaveBeenCalledTimes(1)
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 160})
        fireEvent.scroll(window)
        expect(drag.cancel).not.toHaveBeenCalled()
    })

    it('prevents the context menu only while controlling a touch gesture', () => {
        const {handle} = setup()
        expect(fireEvent.contextMenu(handle)).toBe(true)
        pointer(handle, 'pointerdown')
        expect(fireEvent.contextMenu(handle)).toBe(false)
        pointer(handle, 'pointercancel')
        expect(fireEvent.contextMenu(handle)).toBe(true)
    })

    it('consumes native touch movement only inside the handle of its active drag', () => {
        const {handle} = setup()
        const outside = screen.getByRole('button', {name: 'Outside'})
        expect(fireEvent.touchMove(handle)).toBe(true)
        pointer(handle, 'pointerdown')
        expect(fireEvent.touchMove(handle)).toBe(true)
        pointer(handle, 'pointermove', {clientY: 160})
        expect(fireEvent.touchMove(handle)).toBe(false)
        expect(fireEvent.touchMove(outside)).toBe(true)
        pointer(handle, 'pointerup', {clientY: 160})
        expect(fireEvent.touchMove(handle)).toBe(false)
        act(() => jest.advanceTimersByTime(20))
        expect(fireEvent.touchMove(handle)).toBe(true)
    })

    it('cleans up a forced abandonment without trying to release the lock again', () => {
        const {pre, drag, api, handle, abandon, releaseCapture} = setup()
        pointer(handle, 'pointerdown')
        pointer(handle, 'pointermove', {clientY: 160})
        pointer(handle, 'pointerup', {clientY: 170})
        abandon()
        act(() => jest.advanceTimersByTime(20))
        expect(releaseCapture).toHaveBeenCalledTimes(1)
        expect(pre.abort).not.toHaveBeenCalled()
        expect(drag.cancel).not.toHaveBeenCalled()
        expect(drag.drop).not.toHaveBeenCalled()
        expect(api.tryReleaseLock).not.toHaveBeenCalled()
    })

    it.each(['pending', 'dragging', 'dropping'])('cleans up %s gesture on unmount', phase => {
        const {api, pre, drag, handle, unmount} = setup()
        pointer(handle, 'pointerdown')
        if (phase !== 'pending') pointer(handle, 'pointermove', {clientY: 160})
        if (phase === 'dropping') pointer(handle, 'pointerup', {clientY: 170})
        unmount()
        if (phase === 'pending') expect(pre.abort).toHaveBeenCalledTimes(1)
        else expect(drag.cancel).toHaveBeenCalledTimes(1)
        act(() => jest.advanceTimersByTime(20))
        pointer(handle, 'pointerdown')
        expect(api.tryGetLock).toHaveBeenCalledTimes(1)
        expect(drag.drop).not.toHaveBeenCalled()
    })
})
