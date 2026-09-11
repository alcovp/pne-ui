import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {AutoTestAttribute, createAutoTestAttributes} from '../src'

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
})

describe('AutoTestAttribute', () => {
    it('clones an intrinsic element without adding a DOM node or losing its props', () => {
        const onClick = jest.fn()

        render(
            <AutoTestAttribute id="orders.submit" value={0}>
                <button className="primary" onClick={onClick} type="button">
                    Submit
                </button>
            </AutoTestAttribute>,
        )

        const button = screen.getByRole('button', {name: 'Submit'})

        fireEvent.click(button)

        expect(button.classList.contains('primary')).toBe(true)
        expect(onClick).toHaveBeenCalledTimes(1)
        expect(button.getAttribute('data-autotest')).toBe('orders.submit')
        expect(button.getAttribute('data-autotest-value')).toBe('0')
        expect(button.parentElement?.querySelectorAll('[data-autotest]')).toHaveLength(1)
    })

    it('works with a custom component that forwards DOM props', () => {
        const ForwardingButton = (props: React.ComponentPropsWithoutRef<'button'>) => (
            <button {...props} />
        )

        render(
            <AutoTestAttribute id="orders.cancel">
                <ForwardingButton type="button">Cancel</ForwardingButton>
            </AutoTestAttribute>,
        )

        expect(
            screen.getByRole('button', {name: 'Cancel'}).getAttribute('data-autotest'),
        ).toBe('orders.cancel')
    })

    it('keeps attributes enabled when the legacy environment flag is false', () => {
        const previousValue = process.env.PUBLIC_AUTOTEST_ATTRIBUTES
        process.env.PUBLIC_AUTOTEST_ATTRIBUTES = 'false'

        try {
            render(
                <AutoTestAttribute id="orders.always-visible">
                    <button type="button">Always visible</button>
                </AutoTestAttribute>,
            )

            expect(
                screen.getByRole('button', {name: 'Always visible'})
                    .getAttribute('data-autotest'),
            ).toBe('orders.always-visible')
        } finally {
            if (previousValue === undefined) {
                delete process.env.PUBLIC_AUTOTEST_ATTRIBUTES
            } else {
                process.env.PUBLIC_AUTOTEST_ATTRIBUTES = previousValue
            }
        }
    })

    it('preserves the legacy Fragment wrapper until consumer usages are migrated', () => {
        const {container} = render(
            <AutoTestAttribute id="orders.actions">
                <>
                    <button type="button">Submit</button>
                    <button type="button">Cancel</button>
                </>
            </AutoTestAttribute>,
        )

        const wrapper = container.querySelector('[data-autotest="orders.actions"]')

        expect(wrapper?.tagName).toBe('DIV')
        expect(wrapper?.querySelectorAll('button')).toHaveLength(2)
        expect(container.querySelectorAll('[data-autotest]')).toHaveLength(1)
    })
})
