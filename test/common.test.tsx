import * as React from 'react'
import {render} from '@testing-library/react'

import 'jest-canvas-mock'

import {Button} from '@mui/material'

describe('Common render', () => {
    it('renders without crashing', () => {
        render(<Button
            variant='contained'
            title={'Push!'}
        />)
    })
})
