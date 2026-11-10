import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {createAutoTestAttributes} from '../src'

describe('createAutoTestAttributes', () => {
    it('creates the stable identifier without an absent value', () => {
        expect(createAutoTestAttributes('orders.submit')).toEqual({
            'data-autotest': 'orders.submit',
        })
    })

    it.each([
        ['an empty string', ''],
        ['zero', 0],
        ['false', false],
    ] as const)('preserves %s as an explicit value', (_name, value) => {
        expect(createAutoTestAttributes('criterion.option', value)).toEqual({
            'data-autotest': 'criterion.option',
            'data-autotest-value': value,
        })
    })

    it('can be attached directly to the intended DOM node', () => {
        render(
            <button {...createAutoTestAttributes('orders.submit', false)}>
                Submit
            </button>,
        )

        const button = screen.getByRole('button', {name: 'Submit'})

        expect(button.getAttribute('data-autotest')).toBe('orders.submit')
        expect(button.getAttribute('data-autotest-value')).toBe('false')
        expect(button.parentElement?.querySelectorAll('[data-autotest]')).toHaveLength(1)
    })

    it('keeps attributes enabled when the legacy environment flag is false', () => {
        const previousValue = process.env.PUBLIC_AUTOTEST_ATTRIBUTES
        process.env.PUBLIC_AUTOTEST_ATTRIBUTES = 'false'

        try {
            expect(createAutoTestAttributes('orders.always-visible')).toEqual({
                'data-autotest': 'orders.always-visible',
            })
        } finally {
            if (previousValue === undefined) {
                delete process.env.PUBLIC_AUTOTEST_ATTRIBUTES
            } else {
                process.env.PUBLIC_AUTOTEST_ATTRIBUTES = previousValue
            }
        }
    })
})
