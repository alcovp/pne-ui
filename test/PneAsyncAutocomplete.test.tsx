import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import 'jest-canvas-mock'

import PneAsyncAutocomplete from '../src/component/dropdown/PneAsyncAutocomplete'
import type { AutoCompleteChoice } from '../src/common/paynet/type'

jest.mock('@mui/material', () => {
    const actual = jest.requireActual('@mui/material')

    return {
        ...actual,
        Autocomplete: ({ onOpen, onClose, onInputChange, options, loading }: any) => (
            <div>
                <button data-testid="open-autocomplete" onClick={() => onOpen?.()} type="button">
                    {'open'}
                </button>
                <button data-testid="close-autocomplete" onClick={() => onClose?.()} type="button">
                    {'close'}
                </button>
                <input
                    data-testid="autocomplete-input"
                    onChange={(event) => onInputChange?.(event, (event.target as HTMLInputElement).value)}
                />
                <div data-testid="autocomplete-loading">{loading ? 'loading' : 'idle'}</div>
                <ul data-testid="autocomplete-options">
                    {options.map((option: AutoCompleteChoice) => (
                        <li key={option.choiceId}>{option.displayName}</li>
                    ))}
                </ul>
            </div>
        ),
        CircularProgress: () => null,
    }
})

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
}

const createDeferred = <T,>(): Deferred<T> => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void

    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve
        reject = innerReject
    })

    return {
        promise,
        resolve,
        reject,
    }
}

const renderAutocomplete = (searchChoices: (request: { searchString?: string }) => Promise<AutoCompleteChoice[]>) => {
    render(
        <PneAsyncAutocomplete<AutoCompleteChoice>
            searchChoices={searchChoices}
        />
    )

    fireEvent.click(screen.getByTestId('open-autocomplete'))

    return screen.getByTestId('autocomplete-input')
}

describe('PneAsyncAutocomplete', () => {
    it('clears stale options when a new search starts', async () => {
        const deferredByQuery: Record<string, Deferred<AutoCompleteChoice[]>> = {}
        const searchChoices = jest.fn(({ searchString = '' }: { searchString?: string }) => {
            if (searchString === '') {
                return Promise.resolve([])
            }

            const deferred = createDeferred<AutoCompleteChoice[]>()
            deferredByQuery[searchString] = deferred
            return deferred.promise
        })

        const input = renderAutocomplete(searchChoices)

        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: '' })
        })

        fireEvent.change(input, { target: { value: 'old' } })

        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: 'old' })
        })

        await act(async () => {
            deferredByQuery.old.resolve([
                { choiceId: 1, displayName: 'Old result', description: 'old' },
            ])
            await deferredByQuery.old.promise
        })

        expect(await screen.findByText('Old result')).toBeTruthy()

        fireEvent.change(input, { target: { value: 'new' } })

        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: 'new' })
        })

        await waitFor(() => {
            expect(screen.queryByText('Old result')).toBeNull()
        })

        await act(async () => {
            deferredByQuery.new.resolve([
                { choiceId: 2, displayName: 'New result', description: 'new' },
            ])
            await deferredByQuery.new.promise
        })

        expect(await screen.findByText('New result')).toBeTruthy()
    })

    it('ignores late responses from older searches', async () => {
        const deferredByQuery: Record<string, Deferred<AutoCompleteChoice[]>> = {}
        const searchChoices = jest.fn(({ searchString = '' }: { searchString?: string }) => {
            if (searchString === '') {
                return Promise.resolve([])
            }

            const deferred = createDeferred<AutoCompleteChoice[]>()
            deferredByQuery[searchString] = deferred
            return deferred.promise
        })

        const input = renderAutocomplete(searchChoices)

        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: '' })
        })

        fireEvent.change(input, { target: { value: 'abc' } })
        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: 'abc' })
        })

        fireEvent.change(input, { target: { value: 'abcd' } })
        await waitFor(() => {
            expect(searchChoices).toHaveBeenCalledWith({ searchString: 'abcd' })
        })

        await act(async () => {
            deferredByQuery.abcd.resolve([
                { choiceId: 4, displayName: 'Actual result', description: 'latest' },
            ])
            await deferredByQuery.abcd.promise
        })

        expect(await screen.findByText('Actual result')).toBeTruthy()

        await act(async () => {
            deferredByQuery.abc.resolve([
                { choiceId: 3, displayName: 'Stale result', description: 'old' },
            ])
            await deferredByQuery.abc.promise
        })

        expect(screen.queryByText('Stale result')).toBeNull()
        expect(screen.getByText('Actual result')).toBeTruthy()
    })
})
