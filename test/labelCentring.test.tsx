import type {CSSObject} from '@mui/material/styles'

import {createPneTheme, type Skin} from '../src'
import {createPneButtonOverrides, PNE_BUTTON_SIZE} from '../src/buttonLook'
import {createPneChipOverrides} from '../src/chipLook'
import {tableControlTextButtonLook} from '../src/component/table/tableControlLook'
import {resolvePneSemanticPalette} from '../src/createTheme'
import {PNE_LABEL_TRIM_SUPPORT, pneIconOnCapitals} from '../src/labelCentring'

// jsdom lays nothing out and knows no `text-box`, so the rules are read from the style objects of the theme.
// Where the letters really stand is measured in a browser at real screen scales (see labelCentring.ts).
const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)
const TRIM = 'trim-both cap alphabetic'

const buttonStyle = (size: 'small' | 'medium' | 'large'): CSSObject => {
    const root = createPneButtonOverrides(resolvePneSemanticPalette).styleOverrides?.root
    if (typeof root !== 'function') throw new Error('the button look is a function of the owner state')
    return root({ownerState: {size, variant: 'contained', color: 'primary'}, theme} as never) as CSSObject
}

const only = (style: CSSObject, part: string): CSSObject => {
    const key = Object.keys(style).find(candidate => candidate.includes(part))
    if (!key) throw new Error(`no rule with ${part}`)
    return style[key] as CSSObject
}

describe('label centring', () => {
    it('raises an icon to the middle of the capital band', () => {
        expect(pneIconOnCapitals(16)).toBe('calc((1cap - 16px) / 2)')
        expect(pneIconOnCapitals('1em')).toBe('calc((1cap - 1em) / 2)')
    })

    it.each(['small', 'medium', 'large'] as const)('makes a %s button with nothing but its label a centred, trimmed block', size => {
        const config = PNE_BUTTON_SIZE[size]
        const supported = buttonStyle(size)[PNE_LABEL_TRIM_SUPPORT] as CSSObject
        // Only a button that holds its label and MUI's own slots: any other child keeps the flex layout.
        // `:where` keeps the rule as light as one class: `display` set by the `sx` of a page still wins.
        const labelOnly = only(supported, '&:where(:not(:has(> :not(.MuiButton-startIcon, .MuiButton-endIcon, .MuiButton-loadingWrapper, .MuiTouchRipple-root))))')

        expect(labelOnly).toMatchObject({alignContent: 'center', display: 'inline-block', textBox: TRIM})
        // The padding takes over the room the trim removed, so a label of two lines keeps its air.
        expect(labelOnly['--pne-button-padding-block']).toBe(`calc((${config.height}px - 1cap) / 2 - 1px)`)
        // The padding itself is a plain declaration of the button, so a padding from the `sx` of a page wins.
        expect(buttonStyle(size).paddingTop).toBe(`var(--pne-button-padding-block, ${config.paddingBlock}px)`)
        expect(buttonStyle(size).paddingBottom).toBe(`var(--pne-button-padding-block, ${config.paddingBlock}px)`)
        expect(labelOnly['&.MuiButton-fullWidth']).toEqual({display: 'block'})
        // The gap of the flex layout and the pull of the icon become one margin of the same size.
        expect(only(labelOnly, '.MuiButton-startIcon, &&& .MuiButton-endIcon')).toMatchObject({
            display: 'inline',
            verticalAlign: `calc((1cap - ${config.icon}px) / 2)`,
            whiteSpace: 'nowrap',
        })
        // A word joiner inside the slot glues the icon to the label: no icon on a line of its own.
        expect(labelOnly['&&& .MuiButton-startIcon::after, &&& .MuiButton-endIcon::before']).toEqual({content: '"\\2060"'})
        expect(labelOnly['&&& .MuiButton-startIcon']).toEqual({marginRight: `${config.gap - config.iconPull}px`})
        expect(labelOnly['&&& .MuiButton-endIcon']).toEqual({marginLeft: `${config.gap - config.iconPull}px`})
        // MUI's zero-width strut is a flex item and took a whole gap before a start icon.
        expect(labelOnly['&::before']).toEqual({content: 'none'})
    })

    it('trims the label of a chip and clips it along the line only', () => {
        const root = createPneChipOverrides(resolvePneSemanticPalette).styleOverrides?.root
        if (typeof root !== 'function') throw new Error('the chip look is a function of the owner state')
        const style = root({ownerState: {size: 'medium', variant: 'filled', color: 'default'}, theme} as never) as CSSObject
        const label = style['& .MuiChip-label'] as CSSObject

        expect(label[PNE_LABEL_TRIM_SUPPORT]).toEqual({textBox: TRIM, overflowX: 'clip', overflowY: 'visible'})
    })

    it('trims the label of a text button of a table band', () => {
        const supported = tableControlTextButtonLook(theme, resolvePneSemanticPalette(theme), 'medium')[PNE_LABEL_TRIM_SUPPORT] as CSSObject

        expect(supported['&:where(:not(:has(> :not(.MuiTouchRipple-root))))']).toEqual({
            alignContent: 'center',
            display: 'inline-block',
            textAlign: 'center',
            textBox: TRIM,
        })
    })
})
