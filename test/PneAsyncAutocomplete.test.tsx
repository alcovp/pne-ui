import * as React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {createTheme, ThemeProvider} from '@mui/material/styles'

import 'jest-canvas-mock'

import PneAsyncAutocomplete, {
    PneLoadOptions,
} from '../src/component/dropdown/PneAsyncAutocomplete'
import {PneField} from '../src'
import type {AutoCompleteChoice} from '../src/common/paynet/type'

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

    return {promise, reject, resolve}
}

const choice = (choiceId: number, displayName: string): AutoCompleteChoice => ({
    choiceId,
    description: displayName,
    displayName,
})

describe('PneAsyncAutocomplete', () => {
    it('loads immediately on open and exposes the loaded options', async () => {
        const loadOptions = jest.fn(async () => [choice(1, 'First result')])

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            defaultOpen
            disablePortal
            htmlInputProps={{'aria-label': 'Remote account'}}
            loadOptions={loadOptions}
        />)

        expect(await screen.findByRole('option', {name: 'First result'})).toBeTruthy()
        expect(loadOptions).toHaveBeenCalledTimes(1)
        expect(loadOptions).toHaveBeenCalledWith('', {
            reason: 'open',
            signal: expect.any(AbortSignal),
        })
        expect(screen.getByRole('listbox', {name: 'Remote account'})).toBeTruthy()
    })

    it('merges PneField and consumer names without losing error semantics', async () => {
        const loadOptions = jest.fn(async () => [choice(1, 'First result')])

        render(<>
            <span id='remote-account-context'>Consumer context</span>
            <PneField error id='remote-account-field' label='Remote account'>
                <PneAsyncAutocomplete<AutoCompleteChoice>
                    defaultOpen
                    disablePortal
                    htmlInputProps={{'aria-labelledby': 'remote-account-context'}}
                    loadOptions={loadOptions}
                />
            </PneField>
        </>)

        expect(await screen.findByRole('option', {name: 'First result'})).toBeTruthy()
        const input = screen.getByRole('combobox', {
            name: 'Remote account Consumer context',
        })

        expect(input.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'remote-account-field-label',
            'remote-account-context',
        ])
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(screen.getByRole('listbox', {
            name: 'Remote account Consumer context',
        })).toBeTruthy()
    })

    it('aborts superseded requests and ignores their late results', async () => {
        const requests = new Map<string, {
            context: {signal: AbortSignal}
            deferred: Deferred<readonly AutoCompleteChoice[]>
        }>()
        const loadOptions: PneLoadOptions<AutoCompleteChoice> = jest.fn((query, context) => {
            if (query === '') {
                return Promise.resolve([])
            }

            const deferred = createDeferred<readonly AutoCompleteChoice[]>()
            requests.set(query, {context, deferred})
            return deferred.promise
        })

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            label="Account"
            loadOptions={loadOptions}
            open
        />)

        await waitFor(() => expect(loadOptions).toHaveBeenCalledWith('', expect.objectContaining({
            reason: 'open',
        })))

        const input = screen.getByRole('combobox', {name: 'Account'})
        fireEvent.focus(input)
        fireEvent.change(input, {target: {value: 'old'}})
        await waitFor(() => expect(requests.has('old')).toBe(true))

        fireEvent.change(input, {target: {value: 'new'}})
        await waitFor(() => expect(requests.has('new')).toBe(true))
        expect(requests.get('old')?.context.signal.aborted).toBe(true)

        await act(async () => {
            requests.get('new')?.deferred.resolve([choice(2, 'Current result')])
            await requests.get('new')?.deferred.promise
        })
        expect(await screen.findByRole('option', {name: 'Current result'})).toBeTruthy()

        await act(async () => {
            requests.get('old')?.deferred.resolve([choice(3, 'Stale result')])
            await requests.get('old')?.deferred.promise
        })
        expect(screen.queryByRole('option', {name: 'Stale result'})).toBeNull()
        expect(screen.getByRole('option', {name: 'Current result'})).toBeTruthy()
    })

    it('uses input and clear request reasons but does not search after selection reset', async () => {
        const loadOptions = jest.fn(async () => [choice(1, 'Selectable result')])
        const onInputChange = jest.fn()

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            label="Account"
            loadOptions={loadOptions}
            onInputChange={onInputChange}
            open
        />)

        await screen.findByRole('option', {name: 'Selectable result'})
        const input = screen.getByRole('combobox', {name: 'Account'})
        fireEvent.focus(input)
        fireEvent.change(input, {target: {value: 'sel'}})
        await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith('sel', expect.objectContaining({
            reason: 'input',
        })))

        fireEvent.click(await screen.findByRole('option', {name: 'Selectable result'}))
        await waitFor(() => expect(onInputChange).toHaveBeenCalledWith(
            expect.anything(),
            'Selectable result',
            'selectOption',
        ))
        const callsAfterSelection = loadOptions.mock.calls.length

        fireEvent.click(screen.getByTitle('Clear'))
        await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith('', expect.objectContaining({
            reason: 'clear',
        })))
        expect(loadOptions).toHaveBeenCalledTimes(callsAfterSelection + 1)
    })

    it('loads with the clear reason when a multiple input query is already empty', async () => {
        const selectedChoice = choice(1, 'Selected result')
        const loadOptions = jest.fn(async () => [selectedChoice])

        render(<PneAsyncAutocomplete<AutoCompleteChoice, true>
            disablePortal
            loadOptions={loadOptions}
            multiple
            onChange={() => undefined}
            open
            value={[selectedChoice]}
        />)

        await screen.findByRole('option', {name: 'Selected result'})
        expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('')

        fireEvent.click(screen.getByTitle('Clear'))

        await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith('', expect.objectContaining({
            reason: 'clear',
        })))
        expect(loadOptions).toHaveBeenCalledTimes(2)
    })

    it('does not load below minQueryLength and announces the requirement', async () => {
        const loadOptions = jest.fn(async () => [choice(1, 'Eligible result')])
        const {rerender} = render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            inputValue="ab"
            loadOptions={loadOptions}
            minQueryLength={3}
            open
        />)

        expect((await screen.findByRole('status')).textContent).toContain('Enter at least 3 characters')
        expect(loadOptions).not.toHaveBeenCalled()

        rerender(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            inputValue="abc"
            loadOptions={loadOptions}
            minQueryLength={3}
            open
        />)

        expect(await screen.findByRole('option', {name: 'Eligible result'})).toBeTruthy()
        expect(loadOptions).toHaveBeenCalledWith('abc', expect.objectContaining({reason: 'input'}))
    })

    it('uses MUI theme localization for visible and announced async states', async () => {
        const request = createDeferred<readonly AutoCompleteChoice[]>()
        const theme = createTheme({
            skin: {} as never,
            components: {
                MuiAutocomplete: {
                    defaultProps: {
                        loadingText: 'Chargement…',
                        noOptionsText: 'Aucun résultat',
                    },
                },
            },
        })

        render(<ThemeProvider theme={theme}>
            <PneAsyncAutocomplete<AutoCompleteChoice>
                disablePortal
                loadOptions={() => request.promise}
                open
            />
        </ThemeProvider>)

        expect((await screen.findByRole('status')).textContent).toContain('Chargement…')
        expect(screen.getAllByText('Chargement…').length).toBeGreaterThanOrEqual(2)

        await act(async () => {
            request.resolve([])
            await request.promise
        })

        expect((await screen.findByRole('status')).textContent).toContain('Aucun résultat')
        expect(screen.getAllByText('Aucun résultat').length).toBeGreaterThanOrEqual(2)
    })

    it('reloads only when reloadKey changes, not when the loader identity changes', async () => {
        const firstLoader = jest.fn(async () => [choice(1, 'Initial result')])
        const nextLoader = jest.fn(async () => [choice(2, 'Reloaded result')])
        const {rerender} = render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadOptions={firstLoader}
            open
            reloadKey={1}
        />)

        expect(await screen.findByRole('option', {name: 'Initial result'})).toBeTruthy()
        rerender(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadOptions={nextLoader}
            open
            reloadKey={1}
        />)
        await act(async () => Promise.resolve())
        expect(nextLoader).not.toHaveBeenCalled()

        rerender(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadOptions={nextLoader}
            open
            reloadKey={2}
        />)
        expect(await screen.findByRole('option', {name: 'Reloaded result'})).toBeTruthy()
        expect(nextLoader).toHaveBeenCalledWith('', expect.objectContaining({reason: 'reload'}))
    })

    it('reports synchronous loader failures as unknown and makes the error accessible', async () => {
        const failure = new Error('network failed')
        const onLoadError = jest.fn()
        const loadOptions = jest.fn(() => {
            throw failure
        }) as unknown as PneLoadOptions<AutoCompleteChoice>

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadErrorText="Could not load accounts"
            loadOptions={loadOptions}
            onLoadError={onLoadError}
            open
        />)

        expect((await screen.findByRole('alert')).textContent).toContain('Could not load accounts')
        expect(onLoadError).toHaveBeenCalledWith(failure, {
            query: '',
            reason: 'open',
            signal: expect.any(AbortSignal),
        })
        expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('false')
    })

    it('silences AbortError rejections', async () => {
        const onLoadError = jest.fn()
        const loadOptions = jest.fn(async () => {
            throw new DOMException('cancelled', 'AbortError')
        })

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadOptions={loadOptions}
            onLoadError={onLoadError}
            open
        />)

        await waitFor(() => expect(loadOptions).toHaveBeenCalled())
        await waitFor(() => expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('false'))
        expect(onLoadError).not.toHaveBeenCalled()
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('keeps previous options only while the next request is loading', async () => {
        const nextRequest = createDeferred<readonly AutoCompleteChoice[]>()
        const loadOptions = jest.fn((query: string) => query === ''
            ? Promise.resolve([choice(1, 'Previous result')])
            : nextRequest.promise)

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            keepPreviousOptions
            label="Account"
            loadErrorText="Reload failed"
            loadOptions={loadOptions}
            open
        />)

        expect(await screen.findByRole('option', {name: 'Previous result'})).toBeTruthy()
        const input = screen.getByRole('combobox', {name: 'Account'})
        fireEvent.focus(input)
        fireEvent.change(input, {
            target: {value: 'next'},
        })
        await waitFor(() => expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('true'))
        expect(screen.getByRole('option', {name: 'Previous result'})).toBeTruthy()

        await act(async () => {
            nextRequest.reject(new Error('failed'))
            await nextRequest.promise.catch(() => undefined)
        })
        expect((await screen.findByRole('alert')).textContent).toContain('Reload failed')
        expect(screen.queryByRole('option', {name: 'Previous result'})).toBeNull()
    })

    it('does not tear down a controlled-open request when the owner ignores onClose', async () => {
        const request = createDeferred<readonly AutoCompleteChoice[]>()
        let requestSignal: AbortSignal | undefined
        const onClose = jest.fn()
        const loadOptions: PneLoadOptions<AutoCompleteChoice> = (_query, context) => {
            requestSignal = context.signal
            return request.promise
        }

        render(<PneAsyncAutocomplete<AutoCompleteChoice>
            disablePortal
            loadOptions={loadOptions}
            onClose={onClose}
            open
        />)

        await waitFor(() => expect(requestSignal).toBeDefined())
        fireEvent.click(screen.getByRole('button', {name: 'Close'}))
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(requestSignal?.aborted).toBe(false)

        await act(async () => {
            request.resolve([choice(1, 'Still open result')])
            await request.promise
        })
        expect(await screen.findByRole('option', {name: 'Still open result'})).toBeTruthy()
    })

    it('aborts on effective close and unmount, and forwards both refs', async () => {
        const signals: AbortSignal[] = []
        const loadOptions: PneLoadOptions<AutoCompleteChoice> = (_query, context) => {
            signals.push(context.signal)
            return new Promise(() => undefined)
        }
        const inputRef = React.createRef<HTMLInputElement>()
        const rootRef = React.createRef<HTMLDivElement>()
        const {rerender, unmount} = render(<PneAsyncAutocomplete<AutoCompleteChoice>
            inputRef={inputRef}
            loadOptions={loadOptions}
            open
            ref={rootRef}
        />)

        await waitFor(() => expect(signals).toHaveLength(1))
        expect(inputRef.current).toBe(screen.getByRole('combobox'))
        expect(rootRef.current?.classList.contains('MuiAutocomplete-root')).toBe(true)

        rerender(<PneAsyncAutocomplete<AutoCompleteChoice>
            inputRef={inputRef}
            loadOptions={loadOptions}
            open={false}
            ref={rootRef}
        />)
        expect(signals[0].aborted).toBe(true)

        rerender(<PneAsyncAutocomplete<AutoCompleteChoice>
            inputRef={inputRef}
            loadOptions={loadOptions}
            open
            ref={rootRef}
        />)
        await waitFor(() => expect(signals).toHaveLength(2))
        unmount()
        expect(signals[1].aborted).toBe(true)
    })

    it('does not invoke a loader after unmount cancels its deferred start', async () => {
        const loadOptions = jest.fn(async () => [choice(1, 'Too late')])
        const {unmount} = render(<PneAsyncAutocomplete<AutoCompleteChoice>
            loadOptions={loadOptions}
            open
        />)

        expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('true')
        unmount()

        await act(async () => Promise.resolve())

        expect(loadOptions).not.toHaveBeenCalled()
    })

    it('does not duplicate the backend load during the StrictMode effect replay', async () => {
        const loadOptions = jest.fn(async () => [] as readonly AutoCompleteChoice[])

        render(<React.StrictMode>
            <PneAsyncAutocomplete<AutoCompleteChoice>
                defaultOpen
                loadOptions={loadOptions}
            />
        </React.StrictMode>)

        await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1))
        await act(async () => Promise.resolve())
        expect(loadOptions).toHaveBeenCalledTimes(1)
    })
})
