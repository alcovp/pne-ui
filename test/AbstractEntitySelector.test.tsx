import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {AbstractEntitySelector} from '../src/component/non-abstract-entity-selector/AbstractEntitySelector'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock('@hello-pangea/dnd', () => {
    const React = require('react')

    return {
        DragDropContext: ({children}: React.PropsWithChildren) => <div>{children}</div>,
        Droppable: ({children}: any) => (
            <div>
                {children({
                    innerRef: jest.fn(),
                    placeholder: null,
                })}
            </div>
        ),
        Draggable: ({children}: any) => (
            <div>
                {children({
                    innerRef: jest.fn(),
                    draggableProps: {},
                    dragHandleProps: {},
                })}
            </div>
        ),
    }
})

jest.mock('react-virtuoso', () => {
    const React = require('react')

    return {
        Virtuoso: ({children, data, itemContent}: any) => (
            <div>
                {data.map((item: {id: number}, index: number) => (
                    <React.Fragment key={item.id}>
                        {itemContent(index, item)}
                    </React.Fragment>
                ))}
                {children}
            </div>
        ),
    }
})

type MappedEntity = {
    id: number
    name: string
    mappingStatus: 'Mapped' | 'Unmapped'
}

const getLastChange = (onChange: jest.Mock): [MappedEntity[], MappedEntity[]] => {
    return onChange.mock.calls[onChange.mock.calls.length - 1]
}

describe('AbstractEntitySelector', () => {
    it('allows removing only newly added items when added movement is disabled', async () => {
        const onChange = jest.fn()

        render(
            <AbstractEntitySelector<MappedEntity>
                list={[{id: 2, name: 'New superior', mappingStatus: 'Unmapped'}]}
                selected={[{id: 1, name: 'Saved superior', mappingStatus: 'Mapped'}]}
                disableMoving='ADDED'
                allowNewlyAddedRemoval
                onChange={onChange}
            />
        )

        await waitFor(() => {
            const [mapped, unmapped] = getLastChange(onChange)
            expect(mapped.map(item => item.id)).toEqual([1])
            expect(unmapped.map(item => item.id)).toEqual([2])
        })

        onChange.mockClear()
        fireEvent.click(screen.getByText('Saved superior'))
        expect(onChange).not.toHaveBeenCalled()

        fireEvent.click(screen.getByText('New superior'))
        await waitFor(() => {
            const [mapped, unmapped] = getLastChange(onChange)
            expect(mapped.map(item => item.id)).toEqual([1, 2])
            expect(unmapped.map(item => item.id)).toEqual([])
        })

        onChange.mockClear()
        fireEvent.click(screen.getByText('New superior'))
        await waitFor(() => {
            const [mapped, unmapped] = getLastChange(onChange)
            expect(mapped.map(item => item.id)).toEqual([1])
            expect(unmapped.map(item => item.id)).toEqual([2])
        })
    })
})
