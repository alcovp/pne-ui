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

const renderSelector = (disableMoving?: 'ADDED' | 'AVAILABLE') => {
    const onChange = jest.fn()
    render(<AbstractEntitySelector
        list={available}
        selected={selected}
        disableMoving={disableMoving}
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

describe('AbstractEntitySelector drag handles', () => {
    beforeEach(() => {
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const scroller = this.closest('[data-testid="list-scroller"]')
            const left = this.closest('[data-testid="added"]') ? 400 : 100
            if (this.hasAttribute('data-rfd-draggable-id') && scroller) {
                const index = Array.from(scroller.querySelectorAll('[data-rfd-draggable-id]')).indexOf(this)
                return rect(left, 100 + index * 40, 200, 40)
            }
            return rect(left, 100, 200, 400)
        })
        jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
        jest.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it.each([
        ['added', 'Name', [[2, 1], [3, 4]]],
        ['available', 'Email', [[1, 2], [4, 3]]],
    ] as const)('reorders the %s list using its native button drag handle', async (list, name, expected) => {
        const onChange = renderSelector()
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
        const onChange = renderSelector()
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
        const onChange = renderSelector()
        fireEvent.click(screen.getByRole('button', {name: 'Email'}))
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2, 3], [4]]))
        fireEvent.click(screen.getByRole('button', {name: 'Email'}))
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [4, 3]]))
    })

    it.each([
        ['ADDED', 'Name'],
        ['AVAILABLE', 'Email'],
    ] as const)('keeps %s movement disabled for drag and click', async (disabled, name) => {
        const onChange = renderSelector(disabled)
        await waitFor(() => expect(lastIds(onChange)).toEqual([[1, 2], [3, 4]]))
        onChange.mockClear()
        const handle = screen.getByRole('button', {name})
        fireEvent.keyDown(handle, {key: ' ', code: 'Space', keyCode: 32})
        expect(document.querySelector('[data-rfd-draggable-id][style*="position: fixed"]')).toBeNull()
        fireEvent.click(handle)
        expect(onChange).not.toHaveBeenCalled()
    })
})
