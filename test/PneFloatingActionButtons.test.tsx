import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { PneFloatingActionButtons } from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

describe('PneFloatingActionButtons', () => {
    it('does not run a disabled action from the desktop fab stack', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
        const onClick = jest.fn()

        render(<PneFloatingActionButtons actions={[{ id: 'save', label: 'Save', onClick, disabled: true }]}/>)

        const fab = screen.getByRole('button', { name: 'Save' })
        fireEvent.click(fab)

        expect(onClick).not.toHaveBeenCalled()
        expect(fab.hasAttribute('disabled')).toBe(true)
    })
})
