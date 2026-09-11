import * as React from 'react'
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'

import {AbstractEntitySelector} from '../src/component/non-abstract-entity-selector/AbstractEntitySelector'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

// Keep the real DnD sensors and draggable buttons; jsdom only needs a non-virtual layout.
jest.mock('react-virtuoso', () => ({
    Virtuoso: ({data, itemContent, scrollerRef}: {
        data: {id: number}[]
        itemContent: (index: number, item: {id: number}) => React.ReactNode
        scrollerRef: (element: HTMLDivElement | null) => void
    }) => (
        <div ref={scrollerRef} data-testid='list-scroller'>
            {data.map((item, index) => (
                <React.Fragment key={item.id}>{itemContent(index, item)}</React.Fragment>
            ))}
        </div>
    ),
}))

const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
    x: left, y: top, left, top, width, height,
    right: left + width, bottom: top + height,
    toJSON: () => ({}),
})

const selected = [{id: 1, displayName: 'Name'}, {id: 2, displayName: 'Status'}]
const available = [{id: 3, displayName: 'Email'}, {id: 4, displayName: 'Role'}]

const renderSelector = (disableMoving?: 'ADDED' | 'AVAILABLE', virtualized?: boolean, dragHandle?: 'row' | 'button') => {
    const onChange = jest.fn()
    render(<AbstractEntitySelector
        list={available}
        selected={selected}
        disableMoving={disableMoving}
        virtualized={virtualized}
        dragHandle={dragHandle}
        elementAttributes={{
            addedColumn: {'data-testid': 'added'},
            availableColumn: {'data-testid': 'available'},
        }}
        onChange={onChange}
    />)
    return onChange
}

const lastIds = (onChange: jest.Mock) => onChange.mock.calls.at(-1)?.map(
    (items: {id: number}[]) => items.map(item => item.id),
)

const pointer = (target: Element, type: string, clientX: number, clientY: number) => {
    const event = new MouseEvent(type, {bubbles: true, cancelable: true, button: 0, clientX, clientY})
    Object.defineProperties(event, {
        pointerId: {value: 1},
        pointerType: {value: 'touch'},
        isPrimary: {value: true},
    })
    fireEvent(target, event)
    return event
}

const gripFor = (name: string) => screen.getByRole('button', {name})
    .parentElement!.querySelector<HTMLButtonElement>('[data-rfd-drag-handle-draggable-id]')!

describe('AbstractEntitySelector drag handles', () => {
    beforeEach(() => {
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const scroller = this.closest('[data-testid="list-scroller"], [data-rfd-droppable-id]')
            const left = this.closest('[data-testid="added"]') ? 400 : 100
            if (this.hasAttribute('data-rfd-draggable-id') && scroller) {
                const index = Array.from(scroller.querySelectorAll('[data-rfd-draggable-id]')).indexOf(this)
                return rect(left, 100 + index * 40, 200, 40)
            }
            return rect(left, 100, 200, 400)
        })
        jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200)
        jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
        jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200)
        jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400)
        jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
        jest.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('separate immediate drag button', () => {
        it.each([
            ['Name', 420, [[2, 1], [3, 4]]],
            ['Email', 120, [[1, 2], [4, 3]]],
        ] as const)('reorders %s with immediate movement and does not turn the drop into a transfer', async (name, x, expected) => {
            const onChange = renderSelector(undefined, undefined, 'button')
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            const label = screen.getByRole('button', {name})
            const grip = gripFor(name)
            expect(grip).not.toBe(label)
            expect(label.hasAttribute('data-rfd-drag-handle-draggable-id')).toBe(false)
            expect(grip.style.touchAction).toBe('none')
            pointer(grip, 'pointerdown', x, 120)
            expect(grip.parentElement?.style.position).not.toBe('fixed')
            // No elapsed hold: the very next pointer movement must lift the row.
            pointer(grip, 'pointermove', x, 160)
            expect(grip.parentElement?.style.position).toBe('fixed')
            expect(grip.isConnected).toBe(true)
            pointer(grip, 'pointerup', x, 160)
            fireEvent.click(grip)
            await waitFor(() => expect(lastIds(onChange)).toEqual(expected))
            expect(grip.parentElement?.style.position).not.toBe('fixed')
        })

        it('leaves label swipes free for scrolling and still transfers by clicking the label', async () => {
            const onChange = renderSelector(undefined, false, 'button')
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            const label = screen.getByRole('button', {name: 'Email'})
            const down = pointer(label, 'pointerdown', 120, 120)
            const move = pointer(label, 'pointermove', 120, 160)
            pointer(label, 'pointerup', 120, 160)
            expect(down.defaultPrevented).toBe(false)
            expect(move.defaultPrevented).toBe(false)
            expect(label.parentElement?.style.position).not.toBe('fixed')
            expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]])
            fireEvent.click(label)
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2, 3], [4]]))
        })

        it('keeps a tap on the grip separate from label click and supports keyboard reordering', async () => {
            const onChange = renderSelector(undefined, false, 'button')
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            const grip = gripFor('Name')
            pointer(grip, 'pointerdown', 420, 120)
            pointer(grip, 'pointerup', 420, 120)
            fireEvent.click(grip)
            expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]])
            act(() => grip.focus())
            fireEvent.keyDown(grip, {key: ' ', code: 'Space', keyCode: 32})
            await waitFor(() => expect(grip.parentElement?.style.position).toBe('fixed'))
            fireEvent.keyDown(window, {key: 'ArrowDown', code: 'ArrowDown', keyCode: 40})
            fireEvent.keyDown(window, {key: ' ', code: 'Space', keyCode: 32})
            await waitFor(() => expect(lastIds(onChange)).toEqual([[2, 1], [3, 4]]))
        })

        it('omits the grip where moving is disabled', async () => {
            const onChange = renderSelector('ADDED', false, 'button')
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            expect(gripFor('Name')).toBeNull()
            expect(gripFor('Email')).not.toBeNull()
            fireEvent.click(screen.getByRole('button', {name: 'Name'}))
            expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]])
        })
    })

    it.each([
        ['added', 'Name', 420, [[2, 1], [3, 4]]],
        ['available', 'Email', 120, [[1, 2], [4, 3]]],
    ] as const)('keeps the original touch target connected while reordering the non-virtual %s list', async (list, name, left, expected) => {
        const onChange = renderSelector(undefined, false)
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
        const handle = within(screen.getByTestId(list)).getByRole('button', {name})
        const touch = {identifier: 1, target: handle, clientX: left, clientY: 120}
        fireEvent.touchStart(handle, {touches: [touch], changedTouches: [touch]})
        await waitFor(() => expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).not.toBeNull())
        // Native touchmove/touchend retain the touchstart target for the whole gesture.
        expect(handle.isConnected).toBe(true)
        const movedTouch = {...touch, clientY: 160}
        fireEvent.touchMove(handle, {touches: [movedTouch], changedTouches: [movedTouch]})
        await waitFor(() => expect(handle.parentElement?.style.transform).toContain('40px'))
        await act(async () => {
            fireEvent.touchEnd(handle, {touches: [], changedTouches: [movedTouch]})
        })
        await waitFor(() => expect(lastIds(onChange)).toEqual(expected))
        expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).toBeNull()
    })

    it.each(['Name', 'Email'])('cancels a touch drag from %s without losing the row', async name => {
        const onChange = renderSelector(undefined, false)
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
        const handle = screen.getByRole('button', {name})
        fireEvent.touchStart(handle, {touches: [{identifier: 1, target: handle, clientX: name === 'Name' ? 420 : 120, clientY: 120}]})
        await waitFor(() => expect(handle.parentElement?.style.position).toBe('fixed'))
        await act(async () => {
            fireEvent.touchCancel(handle, {touches: []})
        })
        await waitFor(() => expect(handle.parentElement?.style.position).not.toBe('fixed'))
        expect(handle.isConnected).toBe(true)
        expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]])
    })

    it('allows a short tap to transfer an item in the non-virtual list', async () => {
        const onChange = renderSelector(undefined, false)
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
        const handle = screen.getByRole('button', {name: 'Email'})
        await act(async () => {
            fireEvent.touchStart(handle, {touches: [{identifier: 1, target: handle, clientX: 120, clientY: 120}]})
            fireEvent.touchEnd(handle, {touches: []})
            fireEvent.click(handle)
        })
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2, 3], [4]]))
    })

    describe.each([undefined, false])('virtualized = %s', virtualized => {
        it.each([
            ['added', 'Name', [[2, 1], [3, 4]]],
            ['available', 'Email', [[1, 2], [4, 3]]],
        ] as const)('reorders the %s list using its native button drag handle', async (list, name, expected) => {
            const onChange = renderSelector(undefined, virtualized)
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            const handle = within(screen.getByTestId(list)).getByRole('button', {name})
            expect(handle.tagName).toBe('BUTTON')
            act(() => handle.focus())
            fireEvent.keyDown(handle, {key: ' ', code: 'Space', keyCode: 32})
            await waitFor(() => expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).not.toBeNull())
            fireEvent.keyDown(window, {key: 'ArrowDown', code: 'ArrowDown', keyCode: 40})
            fireEvent.keyDown(window, {key: ' ', code: 'Space', keyCode: 32})
            await waitFor(() => expect(lastIds(onChange)).toEqual(expected))
        })

        it.each(['Name', 'Email'])('starts a mouse drag from the %s button and cancels without transferring it', async name => {
            const onChange = renderSelector(undefined, virtualized)
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            const handle = screen.getByRole('button', {name})
            const left = name === 'Name' ? 420 : 120
            fireEvent.mouseDown(handle, {button: 0, clientX: left, clientY: 120})
            fireEvent.mouseMove(window, {clientX: left, clientY: 140})
            await waitFor(() => expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).not.toBeNull())
            fireEvent.keyDown(window, {key: 'Escape', code: 'Escape', keyCode: 27})
            await waitFor(() => expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).toBeNull())
            expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]])
        })

        it('still transfers items on an ordinary click', async () => {
            const onChange = renderSelector(undefined, virtualized)
            fireEvent.click(screen.getByRole('button', {name: 'Email'}))
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2, 3], [4]]))
            fireEvent.click(screen.getByRole('button', {name: 'Email'}))
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [4, 3]]))
        })

        it.each([
            ['ADDED', 'Name'],
            ['AVAILABLE', 'Email'],
        ] as const)('keeps %s movement disabled for drag and click', async (disabled, name) => {
            const onChange = renderSelector(disabled, virtualized)
            await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
            onChange.mockClear()
            const handle = screen.getByRole('button', {name})
            fireEvent.keyDown(handle, {key: ' ', code: 'Space', keyCode: 32})
            expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).toBeNull()
            fireEvent.click(handle)
            fireEvent.touchStart(handle, {touches: [{identifier: 1, target: handle, clientX: 420, clientY: 120}]})
            await act(() => new Promise(resolve => setTimeout(resolve, 150)))
            expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).toBeNull()
            await act(async () => {
                fireEvent.touchEnd(handle, {touches: []})
            })
            expect(onChange).not.toHaveBeenCalled()
        })
    })
})
