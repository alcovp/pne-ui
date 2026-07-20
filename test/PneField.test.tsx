import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {ToggleButton, ToggleButtonGroup} from '@mui/material'

import 'jest-canvas-mock'

import {PneField, PneSelect, PneTextField, usePneFieldControl} from '../src'

const FieldAwareInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const field = usePneFieldControl()
    const controlProps = field?.getControlProps(props) ?? props

    return <input {...controlProps}/>
}

describe('PneField', () => {
    it('renders the external label and child control', () => {
        render(<PneField controlId='report-file-name' label='Report file name'>
            <PneTextField/>
        </PneField>)

        expect(screen.getByText('Report file name')).toBeTruthy()
        expect(screen.getByRole('textbox')).toBeTruthy()
    })

    it('renders helper text', () => {
        render(<PneField
            helperText='Required'
            id='report-file-field'
            label='Report file name'
        >
            <PneTextField/>
        </PneField>)

        const helperText = screen.getByText('Required')

        expect(helperText).toBeTruthy()
        expect(helperText.id).toBe('report-file-field-helper-text')
    })

    it('links helper text to a generated text input', () => {
        render(<PneField
            helperText='Required'
            id='report-file-field'
            label='Report file name'
        >
            <PneTextField/>
        </PneField>)

        const input = screen.getByLabelText('Report file name')
        const helperText = screen.getByText('Required')

        expect(input.getAttribute('aria-describedby')).toBe(helperText.id)
    })

    it('keeps child text field helper text visible when field provides error state', () => {
        render(<PneField
            error
            id='report-file-field'
            label='Report file name'
        >
            <PneTextField helperText='Required'/>
        </PneField>)

        expect(screen.getByText('Required')).toBeTruthy()
    })

    it('merges field helper text with child text field helper text', () => {
        render(<PneField
            helperText='Field helper'
            id='report-file-field'
            label='Report file name'
        >
            <PneTextField helperText='Child helper'/>
        </PneField>)

        const input = screen.getByLabelText('Report file name')

        expect(screen.getByText('Field helper')).toBeTruthy()
        expect(screen.getByText('Child helper')).toBeTruthy()
        expect(input.getAttribute('aria-describedby')).toBe('report-file-field-control-helper-text report-file-field-helper-text')
    })

    it('merges existing text input descriptions with the field helper text', () => {
        render(<>
            <div id='custom-help'>Custom help</div>
            <PneField
                helperText='Required'
                id='report-file-field'
                label='Report file name'
            >
                <PneTextField
                    slotProps={{
                        htmlInput: {
                            'aria-describedby': 'custom-help',
                        },
                    }}
                />
            </PneField>
        </>)

        const input = screen.getByLabelText('Report file name')
        const helperText = screen.getByText('Required')

        expect(input.getAttribute('aria-describedby')).toBe(`custom-help ${helperText.id}`)
    })

    it('links the label when htmlFor is provided explicitly', () => {
        render(<PneField
            htmlFor='report-file-name'
            label='Report file name'
        >
            <PneTextField id='report-file-name'/>
        </PneField>)

        expect(screen.getByLabelText('Report file name')).toBeTruthy()
    })

    it('generates text input ids and propagates non-native field state to pne controls', () => {
        render(<PneField
            disabled
            error
            label='Report file name'
            required
        >
            <PneTextField/>
        </PneField>)

        const input = screen.getByLabelText(/Report file name/)

        expect(input.hasAttribute('disabled')).toBe(true)
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(input.getAttribute('aria-required')).toBe('true')
        expect(input.hasAttribute('required')).toBe(false)
    })

    it('does not use field required as native input validation', () => {
        render(<PneField
            label='Report file name'
            required
        >
            <PneTextField/>
        </PneField>)

        const input = screen.getByLabelText(/Report file name/)

        expect(input.getAttribute('aria-required')).toBe('true')
        expect(input.hasAttribute('required')).toBe(false)
    })

    it('keeps explicit text input required as native input validation', () => {
        render(<PneField label='Report file name'>
            <PneTextField required/>
        </PneField>)

        const input = screen.getByLabelText(/Report file name/)

        expect(input.hasAttribute('required')).toBe(true)
    })

    it('associates the generated field label with the generated text input', () => {
        render(<PneField label='Report file name'>
            <PneTextField/>
        </PneField>)

        const input = screen.getByLabelText('Report file name')
        const label = screen.getByText('Report file name') as HTMLLabelElement

        expect(label.control).toBe(input)
    })

    it('links an external field label to PneSelect via labelId', () => {
        render(<PneField label='Message server'>
            <PneSelect
                options={['Email', 'SFTP']}
                placeholder='Please select'
                value={null}
                onChange={() => undefined}
            />
        </PneField>)

        const select = screen.getByRole('combobox', {name: 'Message server'})

        fireEvent.click(screen.getByText('Message server'))

        expect(document.activeElement).toBe(select)
    })

    it('links helper text to PneSelect', () => {
        render(<PneField
            helperText='Required'
            id='message-server-field'
            label='Message server'
        >
            <PneSelect
                options={['Email', 'SFTP']}
                placeholder='Please select'
                value={null}
                onChange={() => undefined}
            />
        </PneField>)

        const select = screen.getByRole('combobox', {name: 'Message server'})
        const helperText = screen.getByText('Required')

        expect(select.getAttribute('aria-describedby')).toBe(helperText.id)
    })

    it('composes external field state and caller ARIA with PneSelect', () => {
        render(<>
            <div id='custom-select-help'>Custom help</div>
            <div id='display-select-help'>Display help</div>
            <div id='replacement-select-label'>Replacement label</div>
            <PneField
                disabled
                error
                fullWidth={false}
                helperText='Required'
                id='message-server-field'
                label='Message server'
                required
            >
                <PneSelect
                    aria-describedby='custom-select-help'
                    options={['Email', 'SFTP']}
                    placeholder='Please select'
                    SelectDisplayProps={{
                        'aria-describedby': 'display-select-help',
                        'aria-disabled': 'false',
                        'aria-invalid': 'false',
                        'aria-labelledby': 'replacement-select-label',
                        'aria-required': 'false',
                        id: 'replacement-select-id',
                    }}
                    value={null}
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const select = screen.getByRole('combobox', {name: /Message server/})
        const helperText = screen.getByText('Required')
        const selectFormControl = select.closest('.MuiFormControl-root')

        expect(select.getAttribute('aria-describedby')).toBe(
            `custom-select-help ${helperText.id} display-select-help`,
        )
        expect(select.getAttribute('aria-disabled')).toBe('true')
        expect(select.getAttribute('aria-invalid')).toBe('true')
        expect(select.getAttribute('aria-required')).toBe('true')
        expect(select.getAttribute('aria-labelledby')?.split(' ')).toEqual([
            'message-server-field-label',
            'message-server-field-control',
            'replacement-select-label',
        ])
        expect(select.id).toBe('message-server-field-control')
        expect(selectFormControl?.classList.contains('MuiFormControl-fullWidth')).toBe(false)
    })

    it('provides DOM-ready render bindings to a generic control group', () => {
        const labelRef = React.createRef<HTMLLabelElement>()
        const helperTextRef = React.createRef<HTMLParagraphElement>()

        render(<>
            <div id='custom-period-help'>Custom help</div>
            <PneField
                controlId='period-control'
                disabled
                error
                helperText='Choose one period'
                label='Period'
                required
                slotProps={{
                    helperText: {
                        'aria-live': 'polite',
                        'data-slot': 'helper',
                        id: 'period-help',
                        ref: helperTextRef,
                    },
                    label: {
                        'data-slot': 'label',
                        id: 'period-label',
                        ref: labelRef,
                    },
                }}
            >
                {field => <ToggleButtonGroup
                    {...field.getControlProps({
                        'aria-describedby': 'custom-period-help',
                        'aria-disabled': false,
                        'aria-invalid': false,
                        disabled: false,
                    })}
                    exclusive
                    value='weeks'
                >
                    <ToggleButton value='days'>Days</ToggleButton>
                    <ToggleButton value='weeks'>Weeks</ToggleButton>
                </ToggleButtonGroup>}
            </PneField>
        </>)

        const group = screen.getByRole('group', {name: 'Period'})

        expect(group.id).toBe('period-control')
        expect(group.getAttribute('aria-describedby')).toBe('custom-period-help period-help')
        expect(group.getAttribute('aria-disabled')).toBe('true')
        expect(group.getAttribute('aria-invalid')).toBe('true')
        expect(group.getAttribute('aria-required')).toBe('true')
        expect(screen.getAllByRole('button').every(button => button.hasAttribute('disabled'))).toBe(true)
        expect(labelRef.current?.dataset.slot).toBe('label')
        expect(helperTextRef.current?.dataset.slot).toBe('helper')
        expect(helperTextRef.current?.getAttribute('aria-live')).toBe('polite')
    })

    it('exports reusable field bindings without injecting native required', () => {
        render(<>
            <div id='existing-input-help'>Existing help</div>
            <div id='supplemental-input-label'>Supplemental name</div>
            <PneField
                controlId='custom-input'
                disabled
                error
                helperText='Field help'
                id='custom-field'
                label='Account'
                required
            >
                <FieldAwareInput
                    aria-describedby='existing-input-help'
                    aria-labelledby='supplemental-input-label'
                />
            </PneField>
        </>)

        const input = screen.getByRole('textbox', {
            name: 'Account Supplemental name',
        }) as HTMLInputElement

        expect(input.id).toBe('custom-input')
        expect(input.disabled).toBe(true)
        expect(input.hasAttribute('required')).toBe(false)
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(input.getAttribute('aria-required')).toBe('true')
        expect(input.getAttribute('aria-describedby')).toBe(
            'existing-input-help custom-field-helper-text',
        )
    })

    it('keeps an explicit aria-label as the generic control naming override', () => {
        render(<PneField label='Field-owned name'>
            {field => <div
                {...field.getControlProps({
                    'aria-label': 'Explicit group name',
                    'aria-labelledby': 'ignored-label-reference',
                    role: 'group',
                })}
            />}
        </PneField>)

        const group = screen.getByRole('group', {name: 'Explicit group name'})

        expect(group.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('keeps the field-owned control ID when a child provides a conflicting ID', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        render(<PneField controlId='expected-control' label='Report file name'>
            <PneTextField id='unexpected-control'/>
        </PneField>)

        expect(screen.getByRole('textbox', {name: 'Report file name'}).id).toBe('expected-control')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Move the ID to PneField controlId'))

        warn.mockRestore()
    })

    it('does not mistake a wrapper ID for the nested control ID', () => {
        const {container} = render(<PneField id='field-root' label='Report file name'>
            <div id='layout-wrapper'>
                <PneTextField/>
            </div>
        </PneField>)

        const input = screen.getByRole('textbox', {name: 'Report file name'})

        expect(container.querySelector('.MuiFormControl-root')?.id).toBe('field-root')
        expect(screen.getByText('Report file name').getAttribute('for')).toBe('field-root-control')
        expect(document.getElementById('layout-wrapper')).toBeTruthy()
        expect(input.id).toBe('field-root-control')
    })

    it('rejects multiple direct logical controls from untyped callers', () => {
        const children = [
            <PneTextField key='first'/>,
            <PneTextField key='second'/>,
        ] as unknown as React.ReactElement

        expect(() => render(<PneField>{children}</PneField>)).toThrow(
            'PneField expects exactly one logical control or group.',
        )
    })

    it('renders numeric label and helper content', () => {
        render(<PneField helperText={0} label={0}>
            {field => <input {...field.getControlProps()}/>}
        </PneField>)

        const input = screen.getByRole('textbox', {name: '0'})
        const helperTextId = input.getAttribute('aria-describedby')

        expect(helperTextId).toBeTruthy()
        expect(document.getElementById(helperTextId!)?.textContent).toBe('0')
    })

    it('keeps a polymorphic root and ref contract', () => {
        const rootRef = React.createRef<HTMLFieldSetElement>()

        render(<PneField component='fieldset' ref={rootRef}>
            <input aria-label='Standalone control'/>
        </PneField>)

        expect(rootRef.current?.tagName).toBe('FIELDSET')
    })

    it('does not inject input props into generic children', () => {
        const receivedProps: Record<string, unknown>[] = []
        const GenericControl = (props: Record<string, unknown>) => {
            receivedProps.push(props)

            return <div data-testid='generic-control'/>
        }

        render(<PneField
            disabled
            error
            label='Period'
            required
        >
            <GenericControl/>
        </PneField>)

        expect(screen.getByTestId('generic-control')).toBeTruthy()
        expect(receivedProps[0]).toEqual({})
    })
})
