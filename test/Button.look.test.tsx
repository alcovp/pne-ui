import * as React from 'react'
import {Button} from '@mui/material'
import {render, screen} from '@testing-library/react'

import {createPneTheme, PneThemeProvider, type Skin} from '../src'
import {resolvePneButtonVariant} from '../src/buttonLook'

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
                && (selectorSuffix.includes('MuiButton-loading') || !selector.includes('MuiButton-loading'))
        })
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderWithSkin = (ui: React.ReactElement, skin: Skin = UI_KIT_SKIN) =>
    render(<PneThemeProvider skin={skin}>{ui}</PneThemeProvider>)

describe('MUI Button under the pne-ui theme', () => {
    it('is medium unless a size is given, as the UI Kit button and the fields are', () => {
        renderWithSkin(<Button>Button</Button>)

        const button = screen.getByRole('button', {name: 'Button'})

        expect(button.classList.contains('MuiButton-sizeMedium')).toBe(true)
        expectComputedStyle(button, {'min-height': '32px'})
    })

    it.each([
        {variant: 'contained', color: undefined, look: 'primary'},
        {variant: 'contained', color: 'primary', look: 'primary'},
        {variant: 'contained', color: 'error', look: 'destructive'},
        {variant: 'contained', color: 'warning', look: 'warning'},
        {variant: 'outlined', color: 'primary', look: 'outline'},
        {variant: 'text', color: 'primary', look: 'text'},
        {variant: undefined, color: undefined, look: 'text'},
        {variant: 'text', color: 'error', look: 'textDanger'},
        {variant: 'text', color: 'success', look: 'textSuccess'},
        {variant: 'soft', color: 'primary', look: 'soft'},
        // A pair the UI Kit does not draw is its variant in the default colour.
        {variant: 'contained', color: 'success', look: 'primary'},
        {variant: 'outlined', color: 'error', look: 'outline'},
        {variant: 'text', color: 'warning', look: 'text'},
        {variant: 'soft', color: 'error', look: 'soft'},
        {variant: 'contained', color: 'inherit', look: undefined},
    ])('draws $variant $color as the UI Kit $look variant', ({variant, color, look}) => {
        expect(resolvePneButtonVariant(variant, color)).toBe(look)
    })

    it.each([
        {fontSize: '12px', lineHeight: '16px', minHeight: '24px', paddingBlock: '4px', paddingInline: '8px', size: 'small'},
        {fontSize: '14px', lineHeight: '20px', minHeight: '32px', paddingBlock: '6px', paddingInline: '12px', size: 'medium'},
        {fontSize: '14px', lineHeight: '20px', minHeight: '40px', paddingBlock: '10px', paddingInline: '16px', size: 'large'},
    ] as const)('applies the UI Kit $size geometry and label', ({fontSize, lineHeight, minHeight, paddingBlock, paddingInline, size}) => {
        renderWithSkin(<Button variant='contained' size={size}>Button</Button>)

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

    it.each(['contained', 'outlined', 'text', 'soft'] as const)(
        'keeps the %s geometry equal to the others: the ring is inset and MUI\'s own paddings do not show',
        variant => {
            renderWithSkin(<>
                <Button variant={variant} size='medium'>Button</Button>
                <Button variant={variant} size='medium' disabled>Disabled</Button>
            </>)

            expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
                'border-bottom-width': '',
                'min-height': '32px',
                'padding-left': '12px',
                'padding-top': '6px',
            })
            // MUI gives a disabled outlined button a 1px border of its own.
            expect(ruleValue(screen.getByRole('button', {name: 'Disabled'}), '.Mui-disabled', 'border')).toMatch(/^(none|0px)/)
        },
    )

    it.each([
        {gap: '4px', icon: '14px', pull: '-2px', size: 'small'},
        {gap: '4px', icon: '16px', pull: '-2px', size: 'medium'},
        {gap: '8px', icon: '18px', pull: '0px', size: 'large'},
    ] as const)('sizes a $size icon to the UI Kit glyph and sets it $gap from the label, pulled by $pull', ({gap, icon, pull, size}) => {
        renderWithSkin(
            <Button size={size} startIcon={<svg data-testid='start-icon'/>} endIcon={<svg data-testid='end-icon'/>}>
                Button
            </Button>,
        )

        const button = screen.getByRole('button', {name: 'Button'})
        expectComputedStyle(button, {gap})
        expectComputedStyle(screen.getByTestId('start-icon'), {height: icon, width: icon})
        // jsdom ignores selector specificity, so the pull is read from the button's own rules.
        expect(ruleValue(button, '.MuiButton-startIcon', 'margin-right')).toBe(pull)
        expect(ruleValue(button, '.MuiButton-endIcon', 'margin-left')).toBe(pull)
    })

    it('takes the skin colours from the theme', () => {
        renderWithSkin(<Button variant='contained'>Button</Button>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'rgb(2, 111, 215)',
            'box-shadow': 'none',
            color: 'rgb(255, 255, 255)',
        })
    })

    it.each([
        {fill: 'rgb(0, 94, 185)', state: 'hover'},
        {fill: 'rgb(0, 75, 150)', state: 'pressed'},
    ] as const)('pins the $state specimen state through data-pne-state', ({fill, state}) => {
        renderWithSkin(<Button variant='contained' data-pne-state={state}>Button</Button>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {'background-color': fill})
    })

    it('draws the outlined button as a brand ring on a transparent fill that tints under the pointer', () => {
        renderWithSkin(<>
            <Button variant='outlined'>Button</Button>
            <Button variant='outlined' data-pne-state='hover'>Hover</Button>
            <Button variant='outlined' data-pne-state='pressed'>Pressed</Button>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'rgba(0, 0, 0, 0)',
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
            <Button variant='text'>Text</Button>
            <Button variant='text' data-pne-state='hover'>Text hover</Button>
            <Button variant='soft'>Soft</Button>
            <Button variant='soft' data-pne-state='hover'>Soft hover</Button>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Text'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(86, 91, 97)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Text hover'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(0, 94, 185)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Soft'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(0, 94, 185)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Soft hover'}), {'background-color': 'rgb(235, 243, 255)', color: 'rgb(0, 94, 185)'})
    })

    it('colours the label of the text error and text success buttons and tints them under the pointer', () => {
        renderWithSkin(<>
            <Button variant='text' color='error'>Delete</Button>
            <Button variant='text' color='error' data-pne-state='hover'>Delete hover</Button>
            <Button variant='text' color='success'>Activate</Button>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Delete'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(177, 24, 44)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Delete hover'}), {'background-color': 'rgb(235, 243, 255)', color: 'rgb(177, 24, 44)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Activate'}), {'background-color': 'rgb(240, 244, 248)', color: 'rgb(1, 116, 51)'})
    })

    it('draws the picked item of a set as the lifted white Tertiary and keeps the look under the pointer', () => {
        renderWithSkin(<>
            <Button variant='text' aria-current='page'>1</Button>
            <Button variant='text' aria-pressed data-pne-state='hover'>2</Button>
            <Button variant='text' aria-selected>3</Button>
            <Button variant='text' aria-current={false} aria-pressed={false}>4</Button>
            <Button variant='contained' aria-pressed>5</Button>
        </>)

        const picked = {
            'background-color': 'rgb(255, 255, 255)',
            'box-shadow': '0px 0px 4px 0px rgba(0,0,0,0.04),0px 4px 8px 0px rgba(0,0,0,0.06)',
            color: 'rgb(86, 91, 97)',
        }
        expectComputedStyle(screen.getByRole('button', {name: '1'}), picked)
        expectComputedStyle(screen.getByRole('button', {name: '2'}), picked)
        expectComputedStyle(screen.getByRole('button', {name: '3'}), picked)
        expectComputedStyle(screen.getByRole('button', {name: '4'}), {'background-color': 'rgb(240, 244, 248)', 'box-shadow': 'none'})
        // Only the text button has the look: a filled button that is pressed stays filled.
        expectComputedStyle(screen.getByRole('button', {name: '5'}), {'background-color': 'rgb(2, 111, 215)'})
    })

    it('turns an aria-disabled text success button into a green status that takes no clicks', () => {
        renderWithSkin(<>
            <Button variant='text' color='success' aria-disabled tabIndex={-1}>Active</Button>
            <Button variant='text' aria-disabled>Not a status</Button>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: 'Active'}), {
            'background-color': 'rgb(223, 251, 228)',
            'box-shadow': 'inset 0 0 0 1px #96E7A7',
            color: 'rgb(1, 116, 51)',
            'pointer-events': 'none',
        })
        expectComputedStyle(screen.getByRole('button', {name: 'Not a status'}), {'background-color': 'rgb(240, 244, 248)'})
    })

    it('shows the focus ring on the pinned focus state', () => {
        renderWithSkin(<Button variant='contained' data-pne-state='focus'>Button</Button>)

        // jsdom drops the space after the comma of a box-shadow list.
        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'box-shadow': '0 0 0 2px #fff,0 0 0 4px #026FD7',
        })
    })

    it('greys a disabled button out', () => {
        renderWithSkin(<Button variant='contained' disabled>Button</Button>)

        expectComputedStyle(screen.getByRole('button', {name: 'Button'}), {
            'background-color': 'rgb(178, 184, 191)',
            'box-shadow': 'none',
            color: 'rgb(255, 255, 255)',
        })
    })

    it('puts the spinner of a waiting button into the slot of its start icon and keeps the colours', () => {
        renderWithSkin(
            <Button variant='contained' loading startIcon={<svg data-testid='start-icon'/>} endIcon={<svg data-testid='end-icon'/>}>
                Save
            </Button>,
        )

        const button = screen.getByRole('button', {name: /Save/})
        const spinner = screen.getByRole('progressbar')
        const indicator = spinner.closest('.MuiButton-loadingIndicator') as HTMLElement

        // MUI's own waiting: the button is disabled, the spinner stands at the start.
        expect(button.hasAttribute('disabled')).toBe(true)
        expect(button.classList.contains('MuiButton-loadingPositionStart')).toBe(true)
        expect(spinner.style.width).toBe('1em')
        // One rule hides both icons; its selector list ends with the end icon.
        expect(ruleValue(button, '.MuiButton-loading:not(.MuiButton-loadingPositionCenter).MuiButton-endIcon', 'display')).toBe('none')
        expect(ruleValue(button, '.MuiButton-loading:not(.MuiButton-loadingPositionCenter).MuiButton-loadingIndicator', 'position')).toBe('static')
        expect(ruleValue(button, '.MuiButton-loading:not(.MuiButton-loadingPositionCenter).MuiButton-loadingIndicator', 'font-size')).toBe('16px')
        expect(indicator).not.toBeNull()
        expectComputedStyle(button, {'background-color': 'rgb(2, 111, 215)', color: 'rgb(255, 255, 255)'})
    })

    it('gives a waiting or focused outlined button the canvas fill', () => {
        renderWithSkin(<>
            <Button variant='outlined' loading startIcon={<svg/>}>Save</Button>
            <Button variant='outlined' data-pne-state='focus'>Focus</Button>
        </>)

        expectComputedStyle(screen.getByRole('button', {name: /Save/}), {'background-color': 'rgb(247, 251, 255)'})
        expectComputedStyle(screen.getByRole('button', {name: 'Focus'}), {
            'background-color': 'rgb(247, 251, 255)',
            'box-shadow': 'inset 0 0 0 1px #026FD7,0 0 0 2px #fff,0 0 0 4px #026FD7',
        })
    })

    it('leaves the colour of the place to a button with color="inherit"', () => {
        renderWithSkin(<Button color='inherit' size='small'>Undo</Button>)

        const button = screen.getByRole('button', {name: 'Undo'})

        // The fill and the ring of a look are not drawn; the size is the theme's.
        expectComputedStyle(button, {'background-color': 'rgba(0, 0, 0, 0)', 'box-shadow': 'none', 'min-height': '24px'})
    })

    it('builds the style of a size and look once per theme', () => {
        const theme = createPneTheme(UI_KIT_SKIN)
        const root = theme.components?.MuiButton?.styleOverrides?.root as (props: object) => unknown
        const props = {ownerState: {variant: 'contained', size: 'small'}, theme}

        expect(root(props)).toBe(root(props))
        expect(root({...props, ownerState: {variant: 'outlined', size: 'small'}})).not.toBe(root(props))
        expect(root({...props, theme: createPneTheme(UI_KIT_SKIN)})).not.toBe(root(props))
    })

    it('keeps a readable brand text for a light skin', () => {
        const theme = createPneTheme({experimentalColor: '#79ceef'} as Skin)

        expect(theme.palette.pne.button.outline.default.text).not.toBe('#79CEEF')
    })
})
