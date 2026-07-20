import {act, fireEvent, render, screen} from '@testing-library/react'
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

    it('preserves theme input defaults under a functional consumer slot', () => {
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

        expect(input.checked).toBe(true)
        expect(onChange).not.toHaveBeenCalled()
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

    it('prevents direct activation of a read-only switch', () => {
        const onChange = jest.fn()

        render(<PneSwitch
            aria-label='Locked switch'
            defaultChecked={false}
            onChange={onChange}
            readOnly
        />)

        const input = screen.getByRole('switch', {name: 'Locked switch'}) as HTMLInputElement

        fireEvent.click(input)

        expect(input.checked).toBe(false)
        expect(input.getAttribute('aria-readonly')).toBe('true')
        expect(onChange).not.toHaveBeenCalled()
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
