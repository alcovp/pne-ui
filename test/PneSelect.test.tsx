import * as React from 'react'
import {render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {PneSelect} from '../src'

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
})
