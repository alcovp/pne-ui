import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import type {CheckboxOwnerState} from '@mui/material/Checkbox'
import type {SwitchOwnerState} from '@mui/material/Switch'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import * as React from 'react'

import {
    PneCheckbox,
    PneField,
    PneLabeledCheckbox,
    PneSwitch,
} from '../src'

const getDescriptionIds = (control: HTMLElement): string[] => {
    return control.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? []
}

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

type CustomInputProps = React.ComponentPropsWithoutRef<'input'> & {ownerState?: unknown}

const FirstNativeInput = React.forwardRef<HTMLInputElement, CustomInputProps>((props, ref) => {
    const {ownerState: _ownerState, ...inputProps} = props
    return <input {...inputProps} data-input-slot='first' ref={ref}/>
})

const SecondNativeInput = React.forwardRef<HTMLInputElement, CustomInputProps>((props, ref) => {
    const {ownerState: _ownerState, ...inputProps} = props
    return <input {...inputProps} data-input-slot='second' ref={ref}/>
})

describe('PneCheckbox', () => {
    it('forwards separate span and native input refs while moving ARIA to the input', () => {
        const rootRef = React.createRef<HTMLSpanElement>()
        const inputRef = React.createRef<HTMLInputElement>()

        render(<PneCheckbox
            aria-label='Select report'
            data-autotest='report-checkbox'
            inputRef={inputRef}
            ref={rootRef}
        />)

        const input = screen.getByRole('checkbox', {name: 'Select report'}) as HTMLInputElement

        expect(rootRef.current?.tagName).toBe('SPAN')
        expect(rootRef.current?.getAttribute('data-autotest')).toBe('report-checkbox')
        expect(rootRef.current?.getAttribute('aria-label')).toBeNull()
        expect(rootRef.current?.contains(input)).toBe(true)
        expect(inputRef.current).toBe(input)
    })

    it('synchronizes managed mixed state when the native input is replaced', () => {
        const view = render(<PneCheckbox
            aria-checked={false}
            aria-label='Select page'
            indeterminate
            slots={{input: FirstNativeInput}}
            slotProps={{
                input: {
                    'aria-checked': false,
                },
            }}
        />)
        const firstInput = screen.getByRole('checkbox', {name: 'Select page'}) as HTMLInputElement

        expect(firstInput.indeterminate).toBe(true)
        expect(firstInput.getAttribute('aria-checked')).toBe('mixed')

        view.rerender(<PneCheckbox
            aria-checked={false}
            aria-label='Select page'
            indeterminate
            slots={{input: SecondNativeInput}}
            slotProps={{
                input: {
                    'aria-checked': false,
                },
            }}
        />)
        const secondInput = screen.getByRole('checkbox', {name: 'Select page'}) as HTMLInputElement

        expect(secondInput).not.toBe(firstInput)
        expect(secondInput.indeterminate).toBe(true)
        expect(secondInput.getAttribute('aria-checked')).toBe('mixed')

        view.rerender(<PneCheckbox aria-label='Select page' indeterminate={false}/>)

        const determinateInput = screen.getByRole('checkbox', {name: 'Select page'}) as HTMLInputElement
        expect(determinateInput.indeterminate).toBe(false)
        expect(determinateInput.getAttribute('aria-checked')).toBeNull()
    })

    it('preserves uncontrolled and controlled checked behavior', () => {
        const uncontrolledChange = jest.fn()
        const uncontrolled = render(<PneCheckbox
            aria-label='Uncontrolled checkbox'
            defaultChecked={false}
            onChange={uncontrolledChange}
        />)
        const uncontrolledInput = screen.getByRole('checkbox', {
            name: 'Uncontrolled checkbox',
        }) as HTMLInputElement

        fireEvent.click(uncontrolledInput)

        expect(uncontrolledInput.checked).toBe(true)
        expect(uncontrolledChange).toHaveBeenCalledWith(expect.anything(), true)

        uncontrolled.unmount()

        const controlledChange = jest.fn()
        render(<PneCheckbox
            aria-label='Controlled checkbox'
            checked={false}
            onChange={controlledChange}
        />)
        const controlledInput = screen.getByRole('checkbox', {
            name: 'Controlled checkbox',
        }) as HTMLInputElement

        fireEvent.click(controlledInput)

        expect(controlledInput.checked).toBe(false)
        expect(controlledChange).toHaveBeenCalledWith(expect.anything(), true)
    })

    it('composes object input slot props, refs, and PneField semantics', () => {
        const slotInputRef = React.createRef<HTMLInputElement>()
        const inputRef = React.createRef<HTMLInputElement>()

        render(<>
            <span id='external-help'>External help</span>
            <span id='slot-help'>Slot help</span>
            <PneField
                error
                helperText='Field help'
                id='report-selection'
                label='Select report'
                required
            >
                <PneCheckbox
                    aria-describedby='external-help'
                    inputRef={inputRef}
                    slotProps={{
                        input: {
                            'aria-describedby': 'slot-help',
                            ref: slotInputRef,
                            title: 'Native checkbox title',
                        },
                    }}
                />
            </PneField>
        </>)

        const input = screen.getByRole('checkbox', {name: 'Select report'}) as HTMLInputElement
        const helper = screen.getByText('Field help')

        expect(input.id).toBe('report-selection-control')
        expect(input.title).toBe('Native checkbox title')
        expect(inputRef.current).toBe(input)
        expect(slotInputRef.current).toBe(input)
        expect(getDescriptionIds(input)).toEqual(['external-help', 'slot-help', helper.id])
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(input.getAttribute('aria-required')).toBe('true')
        expect(input.required).toBe(false)
    })

    it('lets an explicit top-level accessible name override PneField labels', () => {
        render(<>
            <span id='ignored-checkbox-label'>Ignored checkbox label</span>
            <PneField label='Field checkbox name'>
                <PneCheckbox
                    aria-label='Explicit checkbox name'
                    slotProps={{
                        input: {'aria-labelledby': 'ignored-checkbox-label'},
                    }}
                />
            </PneField>
        </>)

        const input = screen.getByRole('checkbox', {name: 'Explicit checkbox name'})

        expect(input.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('composes theme input defaults with a functional consumer slot', () => {
        const themeInputRef = React.createRef<HTMLInputElement>()
        const consumerInputRef = React.createRef<HTMLInputElement>()
        const inputRef = React.createRef<HTMLInputElement>()
        const onChange = jest.fn()
        const consumerInputSlot = jest.fn((_ownerState: CheckboxOwnerState) => ({
            'aria-describedby': 'consumer-help',
            className: 'consumer-input',
            ref: consumerInputRef,
            style: {opacity: 0.75},
            title: 'Consumer input',
        }))
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            mergeClassNameAndStyle: true,
            MuiCheckbox: {
                defaultProps: {
                    'aria-label': 'Theme checkbox',
                    defaultChecked: true,
                    indeterminate: true,
                    readOnly: true,
                    slotProps: {
                        input: {
                            'aria-describedby': 'theme-help',
                            className: 'theme-input',
                            inputMode: 'none',
                            ref: themeInputRef,
                            style: {cursor: 'help', opacity: 0.5},
                        },
                    },
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <span id='theme-help'>Theme help</span>
            <span id='consumer-help'>Consumer help</span>
            <PneCheckbox
                inputRef={inputRef}
                onChange={onChange}
                slotProps={{input: consumerInputSlot}}
            />
        </ThemeProvider>)

        const input = screen.getByRole('checkbox', {name: 'Theme checkbox'}) as HTMLInputElement

        expect(consumerInputSlot).toHaveBeenCalledTimes(1)
        expect(inputRef.current).toBe(input)
        expect(themeInputRef.current).toBe(input)
        expect(consumerInputRef.current).toBe(input)
        expect(input.inputMode).toBe('none')
        expect(input.title).toBe('Consumer input')
        expect(input.classList.contains('theme-input')).toBe(true)
        expect(input.classList.contains('consumer-input')).toBe(true)
        expect(input.style.cursor).toBe('help')
        expect(input.style.opacity).toBe('0.75')
        expect(getDescriptionIds(input)).toEqual(['theme-help', 'consumer-help'])
        expect(input.indeterminate).toBe(true)
        expect(input.getAttribute('aria-checked')).toBe('mixed')
        expect(input.getAttribute('aria-readonly')).toBe('true')

        fireEvent.click(input)

        expect(input.checked).toBe(true)
        expect(onChange).not.toHaveBeenCalled()
    })

    it('inherits disabled state from PneField', () => {
        render(<PneField controlId='archived-report' disabled label='Archived report'>
            <PneCheckbox
                slotProps={{
                    input: {
                        'aria-disabled': false,
                        disabled: false,
                        id: 'ignored-checkbox-id',
                    },
                }}
            />
        </PneField>)

        const input = screen.getByRole('checkbox', {name: 'Archived report'}) as HTMLInputElement

        expect(input.id).toBe('archived-report')
        expect(input.disabled).toBe(true)
        expect(input.getAttribute('aria-disabled')).toBe('true')
    })

    it('keeps native form value, required validation, and reset behavior', () => {
        const formRef = React.createRef<HTMLFormElement>()

        render(<form ref={formRef}>
            <PneCheckbox
                aria-label='Terms accepted'
                defaultChecked
                name='terms'
                required
                value='accepted'
            />
        </form>)

        const input = screen.getByRole('checkbox', {name: 'Terms accepted'}) as HTMLInputElement

        expect(new FormData(formRef.current ?? undefined).get('terms')).toBe('accepted')
        expect(input.required).toBe(true)

        fireEvent.click(input)
        expect(input.checked).toBe(false)
        expect(input.checkValidity()).toBe(false)

        formRef.current?.reset()
        expect(input.checked).toBe(true)
    })
})

describe('PneSwitch', () => {
    it('keeps the switch role while composing functional input props and refs', () => {
        const slotInputRefCleanup = jest.fn()
        const slotInputRef = jest.fn((_input: HTMLInputElement | null) => slotInputRefCleanup)
        const inputRef = React.createRef<HTMLInputElement>()
        const inputSlot = jest.fn((_ownerState: SwitchOwnerState) => ({
            'aria-describedby': 'slot-help',
            ref: slotInputRef,
            role: 'checkbox' as const,
            title: 'Native switch title',
        }))

        const view = render(<>
            <span id='external-help'>External help</span>
            <span id='slot-help'>Slot help</span>
            <PneSwitch
                aria-describedby='external-help'
                aria-label='Live updates'
                inputRef={inputRef}
                slotProps={{input: inputSlot}}
            />
        </>)

        const input = screen.getByRole('switch', {name: 'Live updates'}) as HTMLInputElement

        expect(inputSlot).toHaveBeenCalled()
        expect(inputSlot.mock.calls[0]?.[0]).toEqual(expect.objectContaining({size: 'medium'}))
        expect(input.getAttribute('role')).toBe('switch')
        expect(input.title).toBe('Native switch title')
        expect(getDescriptionIds(input)).toEqual(['external-help', 'slot-help'])
        expect(inputRef.current).toBe(input)
        expect(slotInputRef).toHaveBeenCalledWith(input)

        view.unmount()
        expect(slotInputRefCleanup).toHaveBeenCalled()
        expect(inputRef.current).toBeNull()
    })

    it('forwards its primary ref to a span and integrates with PneField', () => {
        const rootRef = React.createRef<HTMLSpanElement>()

        render(<PneField
            error
            helperText='Switch help'
            id='updates-field'
            label='Live updates'
            required
        >
            <PneSwitch data-autotest='live-updates-switch' ref={rootRef}/>
        </PneField>)

        const input = screen.getByRole('switch', {name: 'Live updates'}) as HTMLInputElement
        const helper = screen.getByText('Switch help')

        expect(rootRef.current?.tagName).toBe('SPAN')
        expect(rootRef.current?.getAttribute('data-autotest')).toBe('live-updates-switch')
        expect(rootRef.current?.contains(input)).toBe(true)
        expect(input.id).toBe('updates-field-control')
        expect(getDescriptionIds(input)).toEqual([helper.id])
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(input.getAttribute('aria-required')).toBe('true')
    })

    it('lets an explicit functional-slot name override PneField labels', () => {
        const inputSlot = jest.fn((_ownerState: SwitchOwnerState) => ({
            'aria-label': 'Explicit switch name',
            'aria-labelledby': 'ignored-switch-label',
        }))

        render(<>
            <span id='ignored-switch-label'>Ignored switch label</span>
            <PneField label='Field switch name'>
                <PneSwitch
                    aria-labelledby='also-ignored-switch-label'
                    slotProps={{input: inputSlot}}
                />
            </PneField>
        </>)

        const input = screen.getByRole('switch', {name: 'Explicit switch name'})

        expect(inputSlot).toHaveBeenCalledTimes(1)
        expect(input.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('keeps field identity and disabled state over theme and functional input slots', () => {
        const inputSlot = jest.fn((_ownerState: SwitchOwnerState) => ({
            'aria-disabled': false,
            disabled: false,
            id: 'consumer-switch-id',
        }))
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            MuiSwitch: {
                defaultProps: {
                    slotProps: {
                        input: {
                            'aria-disabled': false,
                            disabled: false,
                            id: 'theme-switch-id',
                        },
                    },
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <PneField controlId='field-switch-id' disabled label='Locked updates'>
                <PneSwitch slotProps={{input: inputSlot}}/>
            </PneField>
        </ThemeProvider>)

        const input = screen.getByRole('switch', {name: 'Locked updates'}) as HTMLInputElement

        expect(inputSlot).toHaveBeenCalledTimes(1)
        expect(input.id).toBe('field-switch-id')
        expect(input.disabled).toBe(true)
        expect(input.getAttribute('aria-disabled')).toBe('true')
    })

    it('preserves theme input defaults under a functional consumer slot', async () => {
        const themeInputRef = React.createRef<HTMLInputElement>()
        const consumerInputRef = React.createRef<HTMLInputElement>()
        const inputRef = React.createRef<HTMLInputElement>()
        const onChange = jest.fn()
        const consumerInputSlot = jest.fn((_ownerState: SwitchOwnerState) => ({
            'aria-describedby': 'consumer-switch-help',
            ref: consumerInputRef,
            role: 'checkbox' as const,
            title: 'Consumer switch',
        }))
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            MuiSwitch: {
                defaultProps: {
                    'aria-label': 'Theme switch',
                    defaultChecked: true,
                    readOnly: true,
                    slotProps: {
                        input: {
                            'aria-describedby': 'theme-switch-help',
                            inputMode: 'none',
                            ref: themeInputRef,
                        },
                    },
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <span id='theme-switch-help'>Theme help</span>
            <span id='consumer-switch-help'>Consumer help</span>
            <PneSwitch
                inputRef={inputRef}
                onChange={onChange}
                slotProps={{input: consumerInputSlot}}
            />
        </ThemeProvider>)

        const input = screen.getByRole('switch', {name: 'Theme switch'}) as HTMLInputElement

        expect(consumerInputSlot).toHaveBeenCalledTimes(1)
        expect(inputRef.current).toBe(input)
        expect(themeInputRef.current).toBe(input)
        expect(consumerInputRef.current).toBe(input)
        expect(input.inputMode).toBe('none')
        expect(input.title).toBe('Consumer switch')
        expect(getDescriptionIds(input)).toEqual(['theme-switch-help', 'consumer-switch-help'])
        expect(input.getAttribute('role')).toBe('switch')
        expect(input.getAttribute('aria-readonly')).toBe('true')

        fireEvent.click(input)

        await waitFor(() => expect(input.checked).toBe(true))
        expect(onChange).not.toHaveBeenCalled()
    })

    it('shows a controlled async change immediately and locks repeat activation', async () => {
        const request = createDeferred<void>()
        const onChange = jest.fn()

        const ControlledSwitch = () => {
            const [checked, setChecked] = React.useState(false)

            return <PneSwitch
                aria-label='Remote updates'
                checked={checked}
                onChange={(event, nextChecked) => {
                    onChange(event, nextChecked)
                    return request.promise.then(() => setChecked(nextChecked))
                }}
            />
        }

        render(<ControlledSwitch/>)

        const input = screen.getByRole('switch', {name: 'Remote updates'}) as HTMLInputElement

        act(() => input.focus())
        fireEvent.click(input)

        expect(input.checked).toBe(true)
        expect(input.disabled).toBe(false)
        expect(input.getAttribute('aria-busy')).toBe('true')
        expect(input.getAttribute('aria-disabled')).toBe('true')
        expect(document.activeElement).toBe(input)
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith(expect.anything(), true)

        fireEvent.click(input)
        expect(onChange).toHaveBeenCalledTimes(1)

        await act(async () => {
            request.resolve()
            await request.promise
        })

        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBeNull()
        expect(input.getAttribute('aria-disabled')).toBeNull()
    })

    it('guards a reentrant activation before an async callback returns', async () => {
        const request = createDeferred<void>()
        const onChange = jest.fn((event: React.ChangeEvent<HTMLInputElement>) => {
            fireEvent.click(event.currentTarget)
            return request.promise
        })

        render(<PneSwitch
            aria-label='Reentrant updates'
            checked={false}
            onChange={onChange}
        />)

        const input = screen.getByRole('switch', {name: 'Reentrant updates'}) as HTMLInputElement

        fireEvent.click(input)

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBe('true')

        await act(async () => {
            request.reject(new Error('Server rejected the update'))
            await request.promise.catch(() => undefined)
        })

        expect(input.checked).toBe(false)
        expect(input.getAttribute('aria-busy')).toBeNull()
    })

    it('rolls a rejected controlled async change back and handles the rejection', async () => {
        const request = createDeferred<void>()

        render(<PneSwitch
            aria-label='Rejected updates'
            checked={false}
            onChange={() => request.promise}
        />)

        const input = screen.getByRole('switch', {name: 'Rejected updates'}) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBe('true')

        await act(async () => {
            request.reject(new Error('Server rejected the update'))
            await request.promise.catch(() => undefined)
        })

        expect(input.checked).toBe(false)
        expect(input.getAttribute('aria-busy')).toBeNull()
        expect(input.getAttribute('aria-disabled')).toBeNull()
    })

    it('commits and rolls back async changes with defaultChecked usage', async () => {
        const acceptedRequest = createDeferred<void>()
        const rejectedRequest = createDeferred<void>()
        const onChange = jest.fn()
            .mockImplementationOnce(() => acceptedRequest.promise)
            .mockImplementationOnce(() => rejectedRequest.promise)

        render(<PneSwitch
            aria-label='Uncontrolled updates'
            defaultChecked={false}
            onChange={onChange}
        />)

        const input = screen.getByRole('switch', {name: 'Uncontrolled updates'}) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(true)

        await act(async () => {
            acceptedRequest.resolve()
            await acceptedRequest.promise
        })

        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBeNull()

        fireEvent.click(input)
        expect(input.checked).toBe(false)

        await act(async () => {
            rejectedRequest.reject(new Error('Server rejected the update'))
            await rejectedRequest.promise.catch(() => undefined)
        })

        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBeNull()
    })

    it('keeps synchronous controlled and native form reset behavior unchanged', async () => {
        const changes: boolean[] = []
        const controlledChange = jest.fn()
        const formRef = React.createRef<HTMLFormElement>()

        const view = render(<PneSwitch
            aria-label='Controlled sync switch'
            checked={false}
            onChange={controlledChange}
        />)
        const controlledInput = screen.getByRole('switch', {
            name: 'Controlled sync switch',
        }) as HTMLInputElement

        fireEvent.click(controlledInput)

        expect(controlledInput.checked).toBe(false)
        expect(controlledInput.getAttribute('aria-busy')).toBeNull()
        expect(controlledChange).toHaveBeenCalledWith(expect.anything(), true)

        view.unmount()
        render(<form ref={formRef}>
            <PneSwitch
                aria-label='Resettable sync switch'
                defaultChecked
                name='updates'
                onChange={(_event, nextChecked) => changes.push(nextChecked)}
                value='enabled'
            />
        </form>)

        const resettableInput = screen.getByRole('switch', {
            name: 'Resettable sync switch',
        }) as HTMLInputElement

        fireEvent.click(resettableInput)
        expect(resettableInput.checked).toBe(false)
        expect(changes).toEqual([false])
        expect(new FormData(formRef.current ?? undefined).has('updates')).toBe(false)

        await act(async () => {
            formRef.current?.reset()
            await Promise.resolve()
        })

        expect(resettableInput.checked).toBe(true)
        expect(new FormData(formRef.current ?? undefined).get('updates')).toBe('enabled')
    })

    it('lets a native form reset invalidate an in-flight visual transaction', async () => {
        const request = createDeferred<void>()
        const formRef = React.createRef<HTMLFormElement>()

        render(<form ref={formRef}>
            <PneSwitch
                aria-label='Reset pending switch'
                defaultChecked={false}
                onChange={() => request.promise}
            />
        </form>)

        const input = screen.getByRole('switch', {
            name: 'Reset pending switch',
        }) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBe('true')

        await act(async () => {
            formRef.current?.reset()
            await Promise.resolve()
        })

        expect(input.checked).toBe(false)
        expect(input.getAttribute('aria-busy')).toBeNull()
        expect(input.getAttribute('aria-disabled')).toBeNull()

        await act(async () => {
            request.resolve()
            await request.promise
        })

        expect(input.checked).toBe(false)
    })

    it('honors a canceled form reset for idle and pending switches', async () => {
        const request = createDeferred<void>()
        const formRef = React.createRef<HTMLFormElement>()

        render(<form
            onReset={event => event.preventDefault()}
            ref={formRef}
        >
            <PneSwitch
                aria-label='Canceled idle reset'
                defaultChecked
            />
            <PneSwitch
                aria-label='Canceled pending reset'
                defaultChecked={false}
                onChange={() => request.promise}
            />
        </form>)

        const idleInput = screen.getByRole('switch', {
            name: 'Canceled idle reset',
        }) as HTMLInputElement
        const pendingInput = screen.getByRole('switch', {
            name: 'Canceled pending reset',
        }) as HTMLInputElement

        fireEvent.click(idleInput)
        fireEvent.click(pendingInput)
        expect(idleInput.checked).toBe(false)
        expect(pendingInput.checked).toBe(true)
        expect(pendingInput.getAttribute('aria-busy')).toBe('true')

        await act(async () => {
            formRef.current?.reset()
            await Promise.resolve()
        })

        expect(idleInput.checked).toBe(false)
        expect(pendingInput.checked).toBe(true)
        expect(pendingInput.getAttribute('aria-busy')).toBe('true')

        await act(async () => {
            request.resolve()
            await request.promise
        })

        expect(pendingInput.checked).toBe(true)
        expect(pendingInput.getAttribute('aria-busy')).toBeNull()
    })

    it('tracks a changed native form association without remounting', async () => {
        const renderSwitch = (formId: string) => <>
            <form id='updates-form-a'/>
            <form id='updates-form-b'/>
            <PneSwitch
                aria-label='Reassociated switch'
                defaultChecked
                slotProps={{input: {form: formId}}}
            />
        </>
        const view = render(renderSwitch('updates-form-a'))
        const input = screen.getByRole('switch', {
            name: 'Reassociated switch',
        }) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(false)

        view.rerender(renderSwitch('updates-form-b'))

        await act(async () => {
            (document.getElementById('updates-form-a') as HTMLFormElement).reset()
            await Promise.resolve()
        })
        expect(input.checked).toBe(false)

        await act(async () => {
            (document.getElementById('updates-form-b') as HTMLFormElement).reset()
            await Promise.resolve()
        })
        expect(input.checked).toBe(true)
    })

    it('settles while React Activity temporarily disconnects effects', async () => {
        const request = createDeferred<void>()
        const renderActivity = (mode: 'hidden' | 'visible') => <React.Activity mode={mode}>
            <PneSwitch
                aria-label='Activity switch'
                defaultChecked={false}
                onChange={() => request.promise}
            />
        </React.Activity>
        const view = render(renderActivity('visible'))
        const input = screen.getByRole('switch', {name: 'Activity switch'}) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBe('true')

        view.rerender(renderActivity('hidden'))

        await act(async () => {
            request.resolve()
            await request.promise
        })

        view.rerender(renderActivity('visible'))

        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBeNull()
        expect(input.getAttribute('aria-disabled')).toBeNull()
    })

    it('honors a form reset while React Activity is hidden', async () => {
        const request = createDeferred<void>()
        const formRef = React.createRef<HTMLFormElement>()
        const renderActivity = (mode: 'hidden' | 'visible') => <form ref={formRef}>
            <React.Activity mode={mode}>
                <PneSwitch
                    aria-label='Hidden reset switch'
                    defaultChecked={false}
                    onChange={() => request.promise}
                />
            </React.Activity>
        </form>
        const view = render(renderActivity('visible'))
        const input = screen.getByRole('switch', {
            name: 'Hidden reset switch',
        }) as HTMLInputElement

        fireEvent.click(input)
        expect(input.checked).toBe(true)
        expect(input.getAttribute('aria-busy')).toBe('true')

        view.rerender(renderActivity('hidden'))

        await act(async () => {
            formRef.current?.reset()
            await Promise.resolve()
        })

        view.rerender(renderActivity('visible'))

        expect(input.checked).toBe(false)
        expect(input.getAttribute('aria-busy')).toBeNull()
        expect(input.getAttribute('aria-disabled')).toBeNull()

        await act(async () => {
            request.resolve()
            await request.promise
        })

        expect(input.checked).toBe(false)
    })

    it('releases a form reset listener when hidden Activity is unmounted', async () => {
        const formRef = React.createRef<HTMLFormElement>()
        const renderActivity = (mounted: boolean, mode: 'hidden' | 'visible') => <form ref={formRef}>
            {mounted && <React.Activity mode={mode}>
                <PneSwitch aria-label='Hidden unmount switch' defaultChecked/>
            </React.Activity>}
        </form>
        const view = render(renderActivity(true, 'visible'))
        const form = formRef.current!
        const removeEventListener = jest.spyOn(form, 'removeEventListener')

        view.rerender(renderActivity(true, 'hidden'))
        await act(async () => Promise.resolve())

        expect(removeEventListener).not.toHaveBeenCalledWith('reset', expect.any(Function))

        view.rerender(renderActivity(false, 'hidden'))

        await waitFor(() => expect(removeEventListener).toHaveBeenCalledWith(
            'reset',
            expect.any(Function),
        ))

        removeEventListener.mockRestore()
    })
})

describe('read-only toggle controls', () => {
    it('keeps a labeled checkbox focusable and form-participating without activation', () => {
        const onChange = jest.fn()
        const formRef = React.createRef<HTMLFormElement>()

        render(<form ref={formRef}>
            <PneLabeledCheckbox
                defaultChecked
                label='Locked selection'
                name='selection'
                onChange={onChange}
                readOnly
                value='locked'
            />
        </form>)

        const input = screen.getByRole('checkbox', {name: 'Locked selection'}) as HTMLInputElement

        fireEvent.click(screen.getByText('Locked selection'))
        expect(input.checked).toBe(true)

        act(() => input.focus())
        fireEvent.keyDown(input, {key: ' ', code: 'Space'})
        fireEvent.keyUp(input, {key: ' ', code: 'Space'})
        fireEvent.click(input, {detail: 0})

        expect(document.activeElement).toBe(input)
        expect(input.checked).toBe(true)
        expect(input.disabled).toBe(false)
        expect(input.getAttribute('aria-readonly')).toBe('true')
        expect(new FormData(formRef.current ?? undefined).get('selection')).toBe('locked')
        expect(onChange).not.toHaveBeenCalled()
    })

    it('prevents direct activation of a read-only switch', async () => {
        const onChange = jest.fn()

        render(<PneSwitch
            aria-label='Locked switch'
            defaultChecked={false}
            onChange={onChange}
            readOnly
        />)

        const input = screen.getByRole('switch', {name: 'Locked switch'}) as HTMLInputElement

        fireEvent.click(input)

        await waitFor(() => expect(input.checked).toBe(false))
        expect(input.getAttribute('aria-readonly')).toBe('true')
        expect(onChange).not.toHaveBeenCalled()
    })

    it('restores the latest controlled value after a read-only click', async () => {
        const ReadOnlySwitch = () => {
            const [checked, setChecked] = React.useState(false)

            return <PneSwitch
                aria-label='Externally updated read-only switch'
                checked={checked}
                onClick={() => setChecked(true)}
                readOnly
            />
        }

        render(<ReadOnlySwitch/>)

        const input = screen.getByRole('switch', {
            name: 'Externally updated read-only switch',
        }) as HTMLInputElement

        fireEvent.click(input)

        await waitFor(() => expect(input.checked).toBe(true))
        expect(input.closest('.MuiSwitch-switchBase')?.classList.contains('Mui-checked')).toBe(true)
    })
})

describe('PneLabeledCheckbox', () => {
    it('associates helper and error state while preserving explicit and slot descriptions', () => {
        render(<>
            <span id='external-help'>External help</span>
            <span id='slot-help'>Slot help</span>
            <PneLabeledCheckbox
                aria-describedby='external-help'
                error
                helperText='Choose carefully'
                helperTextProps={{id: 'selection-helper'}}
                label='Select all'
                slotProps={{
                    input: {
                        'aria-describedby': 'slot-help',
                    },
                }}
            />
        </>)

        const input = screen.getByRole('checkbox', {name: 'Select all'}) as HTMLInputElement
        const helper = screen.getByText('Choose carefully')

        expect(helper.id).toBe('selection-helper')
        expect(getDescriptionIds(input)).toEqual([
            'external-help',
            'selection-helper',
            'slot-help',
        ])
        expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('generates a stable helper id and exposes the corrected span ref', () => {
        const rootRef = React.createRef<HTMLSpanElement>()
        const view = render(<PneLabeledCheckbox
            helperText='Generated helper'
            label='Remember choice'
            ref={rootRef}
        />)
        const input = screen.getByRole('checkbox', {name: 'Remember choice'}) as HTMLInputElement
        const firstHelperId = screen.getByText('Generated helper').id

        view.rerender(<PneLabeledCheckbox
            helperText='Generated helper'
            label='Remember choice'
            ref={rootRef}
        />)

        expect(firstHelperId).not.toBe('')
        expect(screen.getByText('Generated helper').id).toBe(firstHelperId)
        expect(input.getAttribute('aria-describedby')).toBe(firstHelperId)
        expect(rootRef.current?.tagName).toBe('SPAN')
    })
})
