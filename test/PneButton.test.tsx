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

// The last value of `property` among the rules of the button's own css- class whose selector ends
// with `selectorSuffix` (compared without whitespace). The rules of a waiting button are read only
// when the suffix names them.
const ruleValue = (root: HTMLElement, selectorSuffix: string, property: string): string | undefined => {
    const rootClasses = Array.from(root.classList).filter(className => className.startsWith('css-'))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => {
            const selector = rule.selectorText.replace(/\s+/g, '')
            return rootClasses.some(className => selector.startsWith(`.${className}`) && selector.endsWith(selectorSuffix))
                && (selectorSuffix.includes('data-pne-loading') || !selector.includes('data-pne-loading'))
        })
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderWithSkin = (ui: React.ReactElement, skin: Skin = UI_KIT_SKIN) =>
    render(<PneThemeProvider skin={skin}>{ui}</PneThemeProvider>)

describe('PneButton', () => {
    it('is medium unless a size is given, as the UI Kit button and the fields are', () => {
        render(<PneButton>Button</PneButton>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(button.getAttribute('data-pne-size')).toBe('medium')
        expectComputedStyle(button, {'min-height': '32px'})
    })

    it.each([
        {pneStyle: 'contained', variant: 'primary'},
        {pneStyle: 'outlined', variant: 'outline'},
        {pneStyle: 'text', variant: 'text'},
        {pneStyle: 'errorText', variant: 'textDanger'},
        {pneStyle: 'successText', variant: 'textSuccess'},
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
        {fontSize: '14px', lineHeight: '20px', minHeight: '32px', paddingBlock: '6px', paddingInline: '12px', size: 'medium'},
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
        {gap: '4px', icon: '14px', pull: '-2px', size: 'small'},
        {gap: '4px', icon: '16px', pull: '-2px', size: 'medium'},
        {gap: '8px', icon: '18px', pull: '0px', size: 'large'},
    ] as const)('sizes a $size icon to the UI Kit glyph and sets it $gap from the label, pulled by $pull', ({gap, icon, pull, size}) => {
        render(
            <PneButton size={size} startIcon={<svg data-testid='start-icon'/>} endIcon={<svg data-testid='end-icon'/>}>
                Button
            </PneButton>,
        )

        const button = screen.getByRole('button', {name: 'Button'})
        expectComputedStyle(button, {gap})
        expectComputedStyle(screen.getByTestId('start-icon'), {height: icon, width: icon})
        // jsdom ignores selector specificity, so the pull is read from the button's own rules.
        expect(ruleValue(button, '.MuiButton-startIcon', 'margin-right')).toBe(pull)
        expect(ruleValue(button, '.MuiButton-endIcon', 'margin-left')).toBe(pull)
        // The spinner of a waiting button fills its box, so it keeps the whole gap.
        expect(ruleValue(button, '[data-pne-loading="true"].MuiButton-startIcon', 'margin-right')).toBe('0px')
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

        expectComputedStyle(button, {'background-color': 'rgb(2, 111, 215)', color: 'rgb(255, 255, 255)'})
        fireEvent.mouseOver(button)
        expect(window.getComputedStyle(button).getPropertyValue('background-color')).toBe('rgb(2, 111, 215)')
    })

    it.each([
        {fill: 'rgb(0, 94, 185)', state: 'hover'},
        {fill: 'rgb(0, 75, 150)', state: 'pressed'},
    ] as const)('pins the $state specimen state through data-pne-state', ({fill, state}) => {
        renderWithSkin(<PneButton data-pne-state={state}>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {'background-color': fill})
    })

    it('draws the outlined button as a brand ring on a transparent fill that tints under the pointer', () => {
        renderWithSkin(<>
            <PneButton pneStyle='outlined'>Button</PneButton>
            <PneButton pneStyle='outlined' data-pne-state='hover'>Hover</PneButton>
            <PneButton pneStyle='outlined' data-pne-state='pressed'>Pressed</PneButton>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'transparent',
            'box-shadow': 'inset 0 0 0 1px #026FD7',
            color: 'rgb(0, 94, 185)',
        })
        expectComputedStyle(screen.getByRole('button', {name: 'Hover'}), {
            'background-color': 'rgb(235, 243, 255)',
            'box-shadow': 'inset 0 0 0 1px #005EB9',
            color: 'rgb(0, 94, 185)',
        })
        expectComputedStyle(screen.getByRole('button', {name: 'Pressed'}), {
            'background-color': 'rgb(215, 232, 255)',
            color: 'rgb(0, 75, 150)',
        })
    })

    it('keeps the sunken fill of the text and soft buttons at rest and under the pointer', () => {
        renderWithSkin(<>
            <PneButton pneStyle='text'>Text</PneButton>
            <PneButton pneStyle='text' data-pne-state='hover'>Text hover</PneButton>
            <PneButton pneStyle='neutral'>Soft</PneButton>
            <PneButton pneStyle='neutral' data-pne-state='hover'>Soft hover</PneButton>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Text'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(86, 91, 97)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Text hover'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(0, 94, 185)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Soft'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(0, 94, 185)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Soft hover'}), {'background-color': 'rgb(235, 243, 255)', color: 'rgb(0, 94, 185)'})
    })

    it('colours the label of the errorText and successText buttons and tints them under the pointer', () => {
        renderWithSkin(<>
            <PneButton pneStyle='errorText'>Delete</PneButton>
            <PneButton pneStyle='errorText' data-pne-state='hover'>Delete hover</PneButton>
            <PneButton pneStyle='successText'>Activate</PneButton>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Delete'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(177, 24, 44)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Delete hover'}), {'background-color': 'rgb(235, 243, 255)', color: 'rgb(177, 24, 44)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Activate'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(1, 116, 51)'})
    })

    it('draws an active button as the lifted white Tertiary, whatever its style, and keeps the look under the pointer', () => {
        renderWithSkin(<>
            <PneButton pneStyle='text' active aria-current='page'>1</PneButton>
            <PneButton pneStyle='contained' active data-pne-state='hover'>2</PneButton>
        </>)

        const expected = {
            'background-color': 'rgb(255, 255, 255)',
            'box-shadow': '0px 0px 4px 0px rgba(0,0,0,0.04),0px 4px 8px 0px rgba(0,0,0,0.06)',
            color: 'rgb(86, 91, 97)',
        }
        const current = screen.getByRole('button', {name: '1'})
        expect(current.getAttribute('data-pne-active')).toBe('true')
        expect(current.getAttribute('data-pne-variant')).toBe('text')
        expectComputedStyle(current, expected)
        expectComputedStyle(screen.getByRole('button', {name: '2'}), expected)
    })

    it('turns an activated successText button into a green status that takes no clicks and no focus', () => {
        const onClick = jest.fn()
        renderWithSkin(<>
            <PneButton pneStyle='successText' activated onClick={onClick}>Active</PneButton>
            <PneButton pneStyle='text' activated>Not a status</PneButton>
        </>)

        const status = screen.getByRole('button', {name: 'Active'})
        expectComputedStyle(status, {
            'background-color': 'rgb(223, 251, 228)',
            'box-shadow': 'inset 0 0 0 1px #96E7A7',
            color: 'rgb(1, 116, 51)',
            'pointer-events': 'none',
        })
        expect(status.getAttribute('tabindex')).toBe('-1')
        expect(status.getAttribute('aria-disabled')).toBe('true')
        fireEvent.click(status)
        expect(onClick).not.toHaveBeenCalled()
        expect(screen.getByRole('button', {name: 'Not a status'}).hasAttribute('data-pne-activated')).toBe(false)
    })

    it('shows the focus ring on the pinned focus state', () => {
        renderWithSkin(<PneButton data-pne-state='focus'>Button</PneButton>)

        // jsdom drops the space after the comma of a box-shadow list.
        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'box-shadow': '0 0 0 2px #fff,0 0 0 4px #026FD7',
        })
    })

    it('greys a disabled button out', () => {
        renderWithSkin(<PneButton disabled>Button</PneButton>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'rgb(178, 184, 191)',
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
        expectComputedStyle(button, {'background-color': 'rgb(2, 111, 215)', 'pointer-events': 'none'})
    })

    it('gives a waiting or focused outlined button the canvas fill', () => {
        renderWithSkin(<>
            <PneButton pneStyle='outlined' loading startIcon={<svg/>}>Save</PneButton>
            <PneButton pneStyle='outlined' data-pne-state='focus'>Focus</PneButton>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Save'}), {'background-color': 'rgb(247, 251, 255)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Focus'}), {
            'background-color': 'rgb(247, 251, 255)',
            'box-shadow': 'inset 0 0 0 1px #026FD7,0 0 0 2px #fff,0 0 0 4px #026FD7',
        })
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
