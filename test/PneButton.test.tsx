import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {PneButton, type PneButtonStyle} from '../src'

const expectComputedStyle = (
    element: HTMLElement,
    expectedStyle: Record<string, string>,
) => {
    const computedStyle = window.getComputedStyle(element)

    Object.entries(expectedStyle).forEach(([property, value]) => {
        expect(computedStyle.getPropertyValue(property)).toBe(value)
    })
}

describe('PneButton', () => {
    it('keeps large as the default size', () => {
        render(<PneButton>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(button.classList.contains('MuiButton-sizeLarge')).toBe(true)
    })

    it.each([
        {color: 'Primary', pneStyle: 'contained', variant: 'contained'},
        {color: 'Primary', pneStyle: 'outlined', variant: 'outlined'},
        {color: 'Primary', pneStyle: 'text', variant: 'text'},
        {color: 'Error', pneStyle: 'error', variant: 'outlined'},
        {color: 'PneNeutral', pneStyle: 'neutral', variant: 'contained'},
        {color: 'PneNeutral', pneStyle: 'neutralText', variant: 'text'},
        {color: 'PnePrimaryLight', pneStyle: 'primaryLight', variant: 'contained'},
        {color: 'PneWarningLight', pneStyle: 'warning', variant: 'contained'},
        {color: 'PneWhite', pneStyle: 'white', variant: 'contained'},
    ] satisfies Array<{
        color: string
        pneStyle: PneButtonStyle
        variant: 'contained' | 'outlined' | 'text'
    }>)('maps $pneStyle to the canonical PNE preset', ({color, pneStyle, variant}) => {
        render(<PneButton pneStyle={pneStyle}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(button.classList.contains(`MuiButton-${variant}`)).toBe(true)
        expect(button.classList.contains(`MuiButton-color${color}`)).toBe(true)
    })

    it('keeps the native button root and ref contract under React 19', () => {
        const ref = React.createRef<HTMLButtonElement>()
        render(<PneButton ref={ref}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(ref.current).toBe(button)
        expect((button as HTMLButtonElement).type).toBe('button')
    })

    it('keeps the href overload and anchor ref contract', () => {
        const ref = React.createRef<HTMLAnchorElement>()
        render(<PneButton href='/target' ref={ref}>Target</PneButton>)

        const link = screen.getByRole('link', {name: 'Target'})

        expect(ref.current).toBe(link)
        expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/target')
    })

    it('preserves MUI fullWidth behavior', () => {
        render(<PneButton fullWidth>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expectComputedStyle(button, {
            'width': '100%',
        })
    })

    it('preserves MUI minimum width for non icon-only buttons', () => {
        render(<PneButton>OK</PneButton>)

        const button = screen.getByRole('button', {name: 'OK'})

        expectComputedStyle(button, {
            'min-width': '64px',
        })
    })

    it.each([
        {minHeight: '28px', name: 'small', paddingBlock: '4px', paddingInline: '16px', size: 'small'},
        {minHeight: '32px', name: 'medium', paddingBlock: '6px', paddingInline: '20px', size: 'medium'},
        {minHeight: '40px', name: 'large', paddingBlock: '10px', paddingInline: '20px', size: 'large'},
    ] as const)('keeps $name text buttons auto-growing above their Figma minimum', ({minHeight, paddingBlock, paddingInline, size}) => {
        render(<PneButton size={size}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expectComputedStyle(button, {
            'border-radius': '4px',
            'font-size': '14px',
            'font-weight': '400',
            'height': 'auto',
            'line-height': '20px',
            'min-height': minHeight,
            'min-width': '64px',
            'padding-bottom': paddingBlock,
            'padding-left': paddingInline,
            'padding-right': paddingInline,
            'padding-top': paddingBlock,
            'text-transform': 'none',
        })
    })

    it.each([
        {minHeight: '28px', name: 'small', paddingBlock: '3px', paddingInline: '15px', size: 'small'},
        {minHeight: '32px', name: 'medium', paddingBlock: '5px', paddingInline: '19px', size: 'medium'},
        {minHeight: '40px', name: 'large', paddingBlock: '9px', paddingInline: '19px', size: 'large'},
    ] as const)('keeps outlined $name text buttons auto-growing while compensating their border', ({minHeight, paddingBlock, paddingInline, size}) => {
        render(<PneButton pneStyle='outlined' size={size}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expectComputedStyle(button, {
            'height': 'auto',
            'min-height': minHeight,
            'min-width': '64px',
            'padding-bottom': paddingBlock,
            'padding-left': paddingInline,
            'padding-right': paddingInline,
            'padding-top': paddingBlock,
        })
    })

    it.each([
        {gap: '4px', name: 'small', paddingLeft: '12px', paddingRight: '16px', size: 'small'},
        {gap: '8px', name: 'medium', paddingLeft: '16px', paddingRight: '20px', size: 'medium'},
        {gap: '8px', name: 'large', paddingLeft: '16px', paddingRight: '20px', size: 'large'},
    ] as const)('applies Figma start icon geometry for $name size', ({gap, paddingLeft, paddingRight, size}) => {
        render(<PneButton size={size} startIcon={<span data-testid='start-icon'/>}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})
        const icon = screen.getByTestId('start-icon').parentElement

        expectComputedStyle(button, {
            'gap': gap,
            'padding-left': paddingLeft,
            'padding-right': paddingRight,
        })
        expect(icon).not.toBeNull()
    })

    it.each([
        {gap: '4px', name: 'small', paddingLeft: '16px', paddingRight: '12px', size: 'small'},
        {gap: '8px', name: 'medium', paddingLeft: '20px', paddingRight: '16px', size: 'medium'},
        {gap: '8px', name: 'large', paddingLeft: '20px', paddingRight: '16px', size: 'large'},
    ] as const)('applies Figma end icon geometry for $name size', ({gap, paddingLeft, paddingRight, size}) => {
        render(<PneButton size={size} endIcon={<span data-testid='end-icon'/>}>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})
        const icon = screen.getByTestId('end-icon').parentElement

        expectComputedStyle(button, {
            'gap': gap,
            'padding-left': paddingLeft,
            'padding-right': paddingRight,
        })
        expect(icon).not.toBeNull()
    })

    it.each([
        {height: '28px', name: 'contained small', pneStyle: 'contained', size: 'small', width: '28px'},
        {height: '32px', name: 'contained medium', pneStyle: 'contained', size: 'medium', width: '32px'},
        {height: '36px', name: 'contained large', pneStyle: 'contained', size: 'large', width: '36px'},
        {height: '28px', name: 'outlined small', pneStyle: 'outlined', size: 'small', width: '28px'},
        {height: '32px', name: 'outlined medium', pneStyle: 'outlined', size: 'medium', width: '32px'},
        {height: '36px', name: 'outlined large', pneStyle: 'outlined', size: 'large', width: '36px'},
        {height: '28px', name: 'text small', pneStyle: 'text', size: 'small', width: '28px'},
        {height: '32px', name: 'text medium', pneStyle: 'text', size: 'medium', width: '32px'},
        {height: '36px', name: 'text large', pneStyle: 'text', size: 'large', width: '36px'},
    ] as const)('applies Figma icon-only geometry for $name', ({height, pneStyle, size, width}) => {
        render(
            <PneButton
                aria-label='Icon only'
                pneStyle={pneStyle}
                size={size}
                startIcon={<span/>}
            />,
        )

        const button = screen.getByRole('button', {name: 'Icon only'})

        expectComputedStyle(button, {
            'height': height,
            'min-height': height,
            'min-width': width,
            'width': width,
        })
    })
})
