import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {createAutoTestAttributes, PneSelect} from '../src'

describe('PneSelect', () => {
    it('renders placeholder text for an empty value without a floating label', () => {
        render(<PneSelect
            options={['Email', 'SFTP']}
            placeholder='Please select'
            value=''
            onChange={() => undefined}
        />)

        expect(screen.getByText('Please select')).toBeTruthy()
    })

    it('forwards caller-owned attributes to each semantic option', () => {
        render(<PneSelect
            options={['Email', 'SFTP']}
            value='Email'
            onChange={() => undefined}
            getOptionProps={option => createAutoTestAttributes('delivery-option', option.value)}
            SelectDisplayProps={{'aria-label': 'Delivery type'}}
        />)

        fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Delivery type'}))

        expect(document.querySelector(
            '[role="option"][data-autotest="delivery-option"][data-autotest-value="Email"]',
        )).not.toBeNull()
        expect(document.querySelector(
            '[role="option"][data-autotest="delivery-option"][data-autotest-value="SFTP"]',
        )).not.toBeNull()
    })
})
