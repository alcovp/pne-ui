import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {createPneTheme, PneButton, PneThemeProvider, type PneButtonStyle, type Skin} from '../src'

const expectComputedStyle = (
    element: HTMLElement,
    expectedStyle: Record<string, string>,
) => {
    const computedStyle = window.getComputedStyle(element)

    Object.entries(expectedStyle).forEach(([property, value]) => {
        expect([property, computedStyle.getPropertyValue(property)]).toEqual([property, value])
    })
}

const UI_KIT_SKIN = {experimentalColor: '#007dff'} as Skin

const renderWithSkin = (ui: React.ReactElement, skin: Skin = UI_KIT_SKIN) =>
    render(<PneThemeProvider skin={skin}>{ui}</PneThemeProvider>)

describe('PneButton', () => {
    it('keeps large as the default size', () => {
        render(<PneButton>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(button.getAttribute('data-pne-size')).toBe('large')
        expectComputedStyle(button, {'min-height': '40px'})
    })

    it.each([
        {pneStyle: 'contained', variant: 'primary'},
        {pneStyle: 'outlined', variant: 'outline'},
        {pneStyle: 'text', variant: 'text'},
        {pneStyle: 'error', variant: 'destructive'},
        {pneStyle: 'warning', variant: 'warning'},
        {pneStyle: 'neutral', variant: 'soft'},
        {pneStyle: 'neutralText', variant: 'soft'},
        {pneStyle: 'primaryLight', variant: 'soft'},
        {pneStyle: 'white', variant: 'soft'},
    ] satisfies Array<{pneStyle: PneButtonStyle, variant: string}>)(
        'maps $pneStyle to the UI Kit $variant variant',
        ({pneStyle, variant}) => {
            render(<PneButton pneStyle={pneStyle}>Button</PneButton>)

            expect(screen.getByRole('button', {name: 'Button'}).getAttribute('data-pne-variant')).toBe(variant)
        },
    )

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

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {width: '100%'})
    })

    it.each([
        {fontSize: '12px', lineHeight: '16px', minHeight: '24px', paddingBlock: '4px', paddingInline: '8px', size: 'small'},
        {fontSize: '13px', lineHeight: '18px', minHeight: '32px', paddingBlock: '6px', paddingInline: '12px', size: 'medium'},
        {fontSize: '14px', lineHeight: '20px', minHeight: '40px', paddingBlock: '10px', paddingInline: '16px', size: 'large'},
    ] as const)('applies the UI Kit $size geometry and label', ({fontSize, lineHeight, minHeight, paddingBlock, paddingInline, size}) => {
        render(<PneButton size={size}>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'border-radius': '4px',
            'font-size': fontSize,
            'font-weight': '500',
            'height': 'auto',
            'line-height': lineHeight,
            'min-height': minHeight,
            'min-width': '0px',
            'padding-bottom': paddingBlock,
            'padding-left': paddingInline,
            'padding-right': paddingInline,
            'padding-top': paddingBlock,
            'text-transform': 'none',
        })
    })

    it('keeps the outlined geometry equal to the filled one, as the ring is inset', () => {
        render(<PneButton pneStyle='outlined' size='medium'>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'min-height': '32px',
            'padding-left': '12px',
            'padding-top': '6px',
        })
    })

    it.each([
        {icon: '14px', size: 'small'},
        {icon: '16px', size: 'medium'},
        {icon: '18px', size: 'large'},
    ] as const)('sizes a $size start icon to the UI Kit glyph with a 4px gap', ({icon, size}) => {
        render(<PneButton size={size} startIcon={<svg data-testid='start-icon'/>}>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {gap: '4px'})
        expectComputedStyle(screen.getByTestId('start-icon'), {height: icon, width: icon})
    })

    it.each([
        {height: '24px', size: 'small'},
        {height: '32px', size: 'medium'},
        {height: '40px', size: 'large'},
    ] as const)('makes an icon-only $size button a square without padding', ({height, size}) => {
        render(<PneButton aria-label='Icon only' size={size} startIcon={<span/>}/>)

        expectComputedStyle(screen.getByRole('button', {name: 'Icon only'}), {
            'height': height,
            'min-height': height,
            'min-width': height,
            'padding-left': '0px',
            'width': height,
        })
    })

    it('takes the skin colours from the theme and darkens the filled button under the pointer', () => {
        renderWithSkin(<PneButton>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expectComputedStyle(button, {'background-color': 'rgb(0, 125, 255)', color: 'rgb(255, 255, 255)'})
        fireEvent.mouseOver(button)
        expect(window.getComputedStyle(button).getPropertyValue('background-color')).toBe('rgb(0, 125, 255)')
    })

    it.each([
        {fill: 'rgb(9, 114, 222)', state: 'hover'},
        {fill: 'rgb(18, 102, 189)', state: 'pressed'},
    ] as const)('pins the $state specimen state through data-pne-state', ({fill, state}) => {
        renderWithSkin(<PneButton data-pne-state={state}>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {'background-color': fill})
    })

    it('draws the outlined button as a brand ring on a transparent fill', () => {
        renderWithSkin(<PneButton pneStyle='outlined'>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'transparent',
            'box-shadow': 'inset 0 0 0 1px #007DFF',
            color: 'rgb(0, 125, 255)',
        })
    })

    it('shows the focus ring on the pinned focus state', () => {
        renderWithSkin(<PneButton data-pne-state='focus'>Button</PneButton>)

        // jsdom drops the space after the comma of a box-shadow list.
        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'box-shadow': '0 0 0 2px #fff,0 0 0 4px #0972DE',
        })
    })

    it('greys a disabled button out', () => {
        renderWithSkin(<PneButton disabled>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'rgb(162, 174, 185)',
            color: 'rgb(255, 255, 255)',
        })
    })

    it('replaces the start icon with a spinner while loading and blocks clicks', () => {
        const onClick = jest.fn()
        renderWithSkin(
            <PneButton loading onClick={onClick} startIcon={<svg data-testid='start-icon'/>} endIcon={<svg data-testid='end-icon'/>}>
                Save
            </PneButton>,
        )

        const button = screen.getByRole('button', {name: 'Save'})

        expect(button.getAttribute('aria-busy')).toBe('true')
        expect(screen.getByRole('progressbar')).not.toBeNull()
        expect(screen.queryByTestId('start-icon')).toBeNull()
        expect(screen.queryByTestId('end-icon')).toBeNull()
        expect(button.hasAttribute('disabled')).toBe(false)
        fireEvent.click(button)
        expect(onClick).not.toHaveBeenCalled()
        expectComputedStyle(button, {'background-color': 'rgb(0, 125, 255)', 'pointer-events': 'none'})
    })

    it('renders without PneThemeProvider from the MUI primary colour', () => {
        render(<PneButton pneStyle='outlined'>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(window.getComputedStyle(button).getPropertyValue('box-shadow')).toMatch(/^inset 0 0 0 1px #/)
    })

    it('keeps a readable brand text for a light skin', () => {
        const theme = createPneTheme({experimentalColor: '#79ceef'} as Skin)

        expect(theme.palette.pne.button.outline.default.text).not.toBe('#79CEEF')
    })
})
