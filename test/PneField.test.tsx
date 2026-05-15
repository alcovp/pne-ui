import * as React from 'react'
import {render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {PneField, PneTextField} from '../src'

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

    it('links the label only when htmlFor is provided explicitly', () => {
        render(<PneField
            htmlFor='report-file-name'
            label='Report file name'
        >
            <PneTextField id='report-file-name'/>
        </PneField>)

        expect(screen.getByLabelText('Report file name')).toBeTruthy()
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
