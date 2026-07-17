import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    createAutoTestAttributes,
    PneAutocomplete,
} from '../src'

describe('PneAutocomplete', () => {
    it('forwards caller attributes to the native input without replacing MUI handlers', () => {
        const callerOnChange = jest.fn()
        const onInputChange = jest.fn()

        render(<PneAutocomplete
            options={['Email', 'SFTP']}
            value={null}
            onChange={() => undefined}
            onInputChange={onInputChange}
            htmlInputProps={{
                ...createAutoTestAttributes('delivery-input'),
                'aria-label': 'Delivery channel',
                onChange: callerOnChange,
            }}
        />)

        const input = screen.getByRole('combobox', {name: 'Delivery channel'}) as HTMLInputElement

        expect(input.tagName).toBe('INPUT')
        expect(input.getAttribute('data-autotest')).toBe('delivery-input')

        fireEvent.change(input, {target: {value: 'SFT'}})

        expect(onInputChange).toHaveBeenCalledWith(expect.anything(), 'SFT', 'input')
        expect(callerOnChange).not.toHaveBeenCalled()
    })
})
