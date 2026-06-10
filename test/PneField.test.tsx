import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {PneField, PneSelect, PneTextField} from '../src'

describe('PneField', () => {
    it('renders the external label and child control', () => {
        render(<PneField label='Report file name'>
            <PneTextField id='report-file-name'/>
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
                value=''
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
                value=''
                onChange={() => undefined}
            />
        </PneField>)

        const select = screen.getByRole('combobox', {name: 'Message server'})
        const helperText = screen.getByText('Required')

        expect(select.getAttribute('aria-describedby')).toBe(helperText.id)
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
