import React, {ReactNode, RefObject, useState} from 'react'
import {fireEvent, render, screen, within} from '@testing-library/react'
import {IconButton} from '@mui/material'
import {
    PneTableViewOption,
    PneTableViewSelector,
} from '../src'

type ViewId = 'brief' | 'full' | 'risk'

const views: readonly PneTableViewOption<ViewId>[] = [
    {id: 'brief', label: 'Brief'},
    {id: 'full', label: 'Full'},
    {id: 'risk', label: 'Risk', disabled: true},
]

const ControlledSelector = (props: {
    ariaLabel: string
    actions?: ReactNode
    autoTestId: string
    disabled?: boolean
    onChange?: (value: ViewId) => void
    rootRef?: RefObject<HTMLDivElement | null>
}) => {
    const [value, setValue] = useState<ViewId>('brief')

    return <PneTableViewSelector
        aria-label={props.ariaLabel}
        actions={props.actions}
        autoTestId={props.autoTestId}
        disabled={props.disabled}
        onChange={nextValue => {
            props.onChange?.(nextValue)
            setValue(nextValue)
        }}
        value={value}
        views={views}
        ref={props.rootRef}
    />
}

describe('PneTableViewSelector', () => {
    it('renders arbitrary controlled views and exposes raw IDs to assistive and test APIs', () => {
        const onChange = jest.fn()
        const onAction = jest.fn()
        const rootRef = React.createRef<HTMLDivElement>()

        render(<ControlledSelector
            ariaLabel='Order table view'
            actions={<button onClick={onAction} type='button'>Settings</button>}
            autoTestId='orders'
            onChange={onChange}
            rootRef={rootRef}
        />)

        const group = screen.getByRole('group', {name: 'Order table view'})
        const buttons = within(group).getAllByRole('button')

        expect(buttons.map(button => button.textContent)).toEqual(['Brief', 'Full', 'Risk'])
        expect(buttons.map(button => button.getAttribute('aria-pressed'))).toEqual([
            'true',
            'false',
            'false',
        ])
        const root = document.querySelector(
            '[data-autotest="table-views"][data-autotest-value="orders"]',
        )
        expect(root).not.toBeNull()
        expect(rootRef.current).toBe(root)
        expect(Array.from(document.querySelectorAll('[data-autotest="table-view"]'))
            .map(option => option.getAttribute('data-autotest-value'))).toEqual([
            'brief',
            'full',
            'risk',
        ])

        fireEvent.click(within(group).getByRole('button', {name: 'Full'}))

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenLastCalledWith('full')
        expect(within(group).getByRole('button', {name: 'Full'}).getAttribute('aria-pressed')).toBe('true')

        fireEvent.click(within(group).getByRole('button', {name: 'Full'}))
        fireEvent.click(screen.getByRole('button', {name: 'Settings'}))

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onAction).toHaveBeenCalledTimes(1)
        expect(document.querySelector('[data-autotest="table-view-actions"]')).not.toBeNull()
    })

    it('supports per-view and selector disabled states', () => {
        const onChange = jest.fn()
        const {rerender} = render(<ControlledSelector
            ariaLabel='Merchant table view'
            autoTestId='merchants'
            onChange={onChange}
        />)

        const group = screen.getByRole('group', {name: 'Merchant table view'})
        const risk = within(group).getByRole('button', {name: 'Risk'}) as HTMLButtonElement

        expect(risk.disabled).toBe(true)
        fireEvent.click(risk)
        expect(onChange).not.toHaveBeenCalled()

        rerender(<ControlledSelector
            ariaLabel='Merchant table view'
            actions={<button type='button'>Settings</button>}
            autoTestId='merchants'
            disabled
            onChange={onChange}
        />)

        for (const button of within(group).getAllByRole('button') as HTMLButtonElement[]) {
            expect(button.disabled).toBe(true)
        }
        expect((screen.getByRole('button', {name: 'Settings'}) as HTMLButtonElement).disabled).toBe(false)
        fireEvent.click(screen.getByRole('button', {name: 'Settings'}))
        expect(onChange).not.toHaveBeenCalled()
    })

    it('keeps simultaneous selectors isolated and preserves the Orders geometry', () => {
        render(<>
            <ControlledSelector
                actions={<span><IconButton
                    aria-label='First settings'
                    sx={{borderRadius: '4px'}}
                >S</IconButton></span>}
                ariaLabel='First table view'
                autoTestId='first'
            />
            <ControlledSelector ariaLabel='Second table view' autoTestId='second'/>
        </>)

        const first = screen.getByRole('group', {name: 'First table view'})
        const second = screen.getByRole('group', {name: 'Second table view'})

        fireEvent.click(within(first).getByRole('button', {name: 'Full'}))

        expect(within(first).getByRole('button', {name: 'Full'}).getAttribute('aria-pressed')).toBe('true')
        expect(within(second).getByRole('button', {name: 'Brief'}).getAttribute('aria-pressed')).toBe('true')

        const firstRoot = document.querySelector(
            '[data-autotest="table-views"][data-autotest-value="first"]',
        ) as HTMLElement
        const firstButton = within(first).getByRole('button', {name: 'Brief'})
        const rootStyle = window.getComputedStyle(firstRoot)
        const groupStyle = window.getComputedStyle(first)
        const buttonStyle = window.getComputedStyle(firstButton)
        const selectedButtonStyle = window.getComputedStyle(
            within(first).getByRole('button', {name: 'Full'}),
        )
        const dividerStyle = window.getComputedStyle(screen.getByRole('separator'))
        const settingsButtonStyle = window.getComputedStyle(
            screen.getByRole('button', {name: 'First settings'}),
        )

        expect(rootStyle.height).toBe('40px')
        expect(rootStyle.maxWidth).toBe('100%')
        expect(rootStyle.minWidth).toBe('0')
        expect(rootStyle.padding).toBe('')
        expect(rootStyle.borderWidth).toBe('')
        expect(groupStyle.minWidth).toBe('0')
        expect(groupStyle.height).toBe('40px')
        expect(buttonStyle.borderRadius).toBe('4px')
        expect(buttonStyle.height).toBe('40px')
        expect(buttonStyle.color).toBe('rgb(128, 158, 174)')
        expect(buttonStyle.overflow).toBe('hidden')
        expect(buttonStyle.textTransform).toBe('none')
        expect(selectedButtonStyle.backgroundColor).toBe('rgb(241, 245, 250)')
        expect(selectedButtonStyle.color).toBe('rgb(128, 158, 174)')
        expect(dividerStyle.height).toBe('24px')
        expect(dividerStyle.marginLeft).toBe('4px')
        expect(dividerStyle.marginRight).toBe('4px')
        expect({
            borderRadius: settingsButtonStyle.borderRadius,
            height: settingsButtonStyle.height,
            width: settingsButtonStyle.width,
        }).toEqual({
            borderRadius: '4px',
            height: '40px',
            width: '40px',
        })
        expect(window.getComputedStyle(
            within(first).getByRole('button', {name: 'Full'}),
        ).borderLeftWidth).toBe('0px')
    })

    it('supports labelled-by naming and omits false action placeholders', () => {
        render(<>
            <span id='reseller-view-label'>Reseller table view</span>
            <PneTableViewSelector
                aria-labelledby='reseller-view-label'
                actions={false}
                onChange={() => undefined}
                value='brief'
                views={views}
            />
        </>)

        expect(screen.getByRole('group', {name: 'Reseller table view'})).toBeTruthy()
        expect(document.querySelector('[data-autotest="table-view-actions"]')).toBeNull()
        expect(screen.queryByRole('separator')).toBeNull()
    })
})
