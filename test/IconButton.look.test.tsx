import * as React from 'react'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {IconButton} from '@mui/material'
import type {IconButtonProps} from '@mui/material'
import {styled} from '@mui/material/styles'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneThemeProvider, type Skin} from '../src'
import {pneIconActionSx} from '../src/component/iconActionLook'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderButton = (
    props: IconButtonProps = {},
    icon: React.ReactNode = <SettingsOutlinedIcon/>,
    mode: 'light' | 'dark' = 'light',
) => {
    const view = render(
        <PneThemeProvider mode={mode} skin={UI_KIT_SKIN}>
            <IconButton aria-label='settings' {...props}>{icon}</IconButton>
        </PneThemeProvider>,
    )
    const root = view.container.querySelector<HTMLElement>('.MuiIconButton-root')!
    return {...view, root, icon: root.querySelector<HTMLElement>('.MuiSvgIcon-root')}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the checks read the
// element's own rules (those of its css- class). `&` stands for that class; selectors are compared
// without whitespace.
const ruleValue = (element: HTMLElement, selector: string, property: string): string | undefined => {
    const wanted = Array.from(element.classList)
        .filter(className => className.startsWith('css-'))
        .map(className => selector.replace(/&/g, `.${className}`).replace(/\s+/g, ''))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => wanted.includes(rule.selectorText.replace(/\s+/g, '')))
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

describe('MUI IconButton under the pne-ui theme', () => {
    it.each([
        {size: undefined, box: '32px', glyph: '16px'},
        {size: 'medium', box: '32px', glyph: '16px'},
        {size: 'small', box: '24px', glyph: '14px'},
        {size: 'large', box: '40px', glyph: '18px'},
    ] as const)('is the UI Kit icon action of size $size: a $box box whatever the glyph', ({size, box, glyph}) => {
        const {root} = renderButton({size})

        expect(ruleValue(root, '&', 'width')).toBe(box)
        expect(ruleValue(root, '&', 'height')).toBe(box)
        expect(ruleValue(root, '&', 'padding')).toMatch(/^0/)
        expect(ruleValue(root, '&', 'border-radius')).toBe('4px')
        expect(ruleValue(root, '&', '--pne-icon-size')).toBe(glyph)
    })

    it('has no fill and no ripple: the pointer colours only the icon', () => {
        const {root} = renderButton()

        expect(ruleValue(root, '&', 'background-color')).toBe('transparent')
        expect(ruleValue(root, '&', 'color')).toBe('#6E747A')
        expect(ruleValue(root, '&:hover', 'background-color')).toBe('transparent')
        expect(ruleValue(root, '&:hover', 'color')).toBeTruthy()
        expect(ruleValue(root, '&:hover', 'color')).not.toBe(ruleValue(root, '&', 'color'))
        expect(ruleValue(root, '&.Mui-focusVisible', 'box-shadow')).toMatch(/0 0 0 4px/)
        expect(ruleValue(root, '&.Mui-disabled', 'color')).toBe('#B2B8BF')
        expect(root.querySelector('.MuiTouchRipple-root')).toBeNull()
    })

    it('gives a MUI icon of the default size the size the button names, without outweighing the icon', () => {
        const {icon} = renderButton()

        expect(ruleValue(icon!, '&', 'font-size')).toBe('var(--pne-icon-size, 1.5rem)')
    })

    it('leaves an icon the page sized itself alone', () => {
        const small = renderButton({}, <SettingsOutlinedIcon fontSize='small'/>).icon!
        const own = renderButton({}, <SettingsOutlinedIcon sx={{fontSize: 22}}/>).icon!

        expect(ruleValue(small, '&', 'font-size')).toBe('1.25rem')
        expect(ruleValue(own, '&', 'font-size')).toBe('22px')
    })

    it('keeps 24px for an icon that stands outside an icon button', () => {
        const view = render(<PneThemeProvider skin={UI_KIT_SKIN}><SettingsOutlinedIcon/></PneThemeProvider>)
        const icon = view.container.querySelector<HTMLElement>('.MuiSvgIcon-root')!

        // No button above names a size, so the fallback of the property applies.
        expect(ruleValue(icon, '&', 'font-size')).toBe('var(--pne-icon-size, 1.5rem)')
        expect(icon.closest('.MuiIconButton-root')).toBeNull()
    })

    it('draws `error` as the danger tone: neutral at rest, the error text under the pointer', () => {
        const plain = renderButton().root
        const danger = renderButton({color: 'error'}).root

        expect(ruleValue(danger, '&', 'color')).toBe(ruleValue(plain, '&', 'color'))
        expect(ruleValue(danger, '&:hover', 'color')).not.toBe(ruleValue(plain, '&:hover', 'color'))
    })

    it('draws `primary` in the brand text at rest', () => {
        const plain = renderButton().root
        const primary = renderButton({color: 'primary'}).root

        expect(ruleValue(primary, '&', 'color')).toBe(ruleValue(plain, '&:hover', 'color'))
    })

    it('draws `pnePrimary` and `pneNeutral` as filled squares of the button variants', () => {
        const primary = renderButton({color: 'pnePrimary', size: 'large'}).root
        const neutral = renderButton({color: 'pneNeutral', size: 'large'}).root

        expect(ruleValue(primary, '&', 'width')).toBe('40px')
        expect(ruleValue(primary, '&', 'background-color')).toBe('#026FD7')
        expect(ruleValue(primary, '&', 'color')).toBe('#FFFFFF')
        expect(ruleValue(neutral, '&', 'background-color')).toBeTruthy()
        expect(ruleValue(neutral, '&', 'background-color')).not.toBe('transparent')
        expect(ruleValue(neutral, '&', 'stroke')).toBe('currentColor')
    })

    it('pulls a button at an edge out by the air around its glyph', () => {
        expect(ruleValue(renderButton({edge: 'end'}).root, '&', 'margin-right')).toBe('-8px')
        expect(ruleValue(renderButton({edge: 'start', size: 'small'}).root, '&', 'margin-left')).toBe('-5px')
    })

    it('lets the size a page set by `sx` or `styled` win', () => {
        const Styled = styled(IconButton)`
            width: 26px;
            height: 26px;
        `
        const bySx = renderButton({sx: {height: '40px', width: '40px'}}).root
        const view = render(<PneThemeProvider skin={UI_KIT_SKIN}><Styled aria-label='node'/></PneThemeProvider>)
        const byStyled = view.container.querySelector<HTMLElement>('.MuiIconButton-root')!

        expect(ruleValue(bySx, '&', 'width')).toBe('40px')
        expect(ruleValue(byStyled, '&', 'width')).toBe('26px')
    })

    it('is the dark action on a dark page', () => {
        const {root} = renderButton({}, undefined, 'dark')

        expect(ruleValue(root, '&', 'background-color')).toBe('transparent')
        expect(ruleValue(root, '&', 'color')).not.toBe('#6E747A')
    })

    it('still clicks', () => {
        const onClick = jest.fn()
        renderButton({onClick})

        fireEvent.click(screen.getByRole('button', {name: 'settings'}))

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('gives the components of the library the same look without the theme', () => {
        const themed = renderButton({size: 'small'}).root
        const bare = render(
            <IconButton aria-label='row action' size='small' sx={pneIconActionSx('small')}>
                <SettingsOutlinedIcon/>
            </IconButton>,
        ).container.querySelector<HTMLElement>('.MuiIconButton-root')!

        for (const property of ['width', 'height', 'border-radius', 'background-color']) {
            expect(ruleValue(bare, '&', property)).toBe(ruleValue(themed, '&', property))
        }
        expect(ruleValue(bare, '& .MuiSvgIcon-root', 'font-size')).toBe('14px')
    })
})
