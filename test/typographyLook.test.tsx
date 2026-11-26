import * as React from 'react'
import {Box, Typography} from '@mui/material'
import {render} from '@testing-library/react'

import {PneThemeProvider, type Skin} from '../src'

const SKIN = {experimentalColor: '#0a91bc'} as Skin
const SKIN_HEADING_COLOR = 'rgb(6, 63, 83)'
const PAGE_TEXT_COLOR = 'rgb(18, 52, 86)'

const matches = (element: Element, selector: string) => {
    try {
        return element.matches(selector)
    } catch {
        // A selector jsdom cannot read, such as MUI's ::-moz-focus-inner, is no heading's.
        return false
    }
}

// The colour a browser applies: the last matching declaration, the theme's class rule winning over
// the skin's element rule as it does by specificity. jsdom does not resolve `inherit` for colour.
const declaredColor = (element: Element) =>
    Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter(
            (rule): rule is CSSStyleRule =>
                rule instanceof CSSStyleRule && matches(element, rule.selectorText) && rule.style.color !== '',
        )
        .at(-1)?.style.color

const renderOnPage = (mode: 'light' | 'dark', children: React.ReactNode) =>
    render(
        <PneThemeProvider mode={mode} skin={SKIN}>
            <Box sx={{color: PAGE_TEXT_COLOR}}>{children}</Box>
        </PneThemeProvider>,
    )

describe('Typography headings under the Paynet skin', () => {
    let skinHeadings: HTMLStyleElement

    // What the Paynet skin's main.css, loaded before the application's own styles, does to every
    // heading of the document. Once for the file: jsdom lists a sheet added later after emotion's,
    // whatever its place in <head>.
    beforeAll(() => {
        skinHeadings = document.createElement('style')
        skinHeadings.textContent = 'h1, h2, h3, h4, h5, h6 { color: #063f53; } h2 { padding-top: 1.3em; }'
        document.head.prepend(skinHeadings)
    })

    afterAll(() => {
        skinHeadings.remove()
    })

    it('keeps the skin colour of a heading in the light theme', () => {
        const {getByRole} = renderOnPage('light', <Typography component='h3'>No widgets are shown</Typography>)

        expect(getComputedStyle(getByRole('heading', {level: 3})).color).toBe(SKIN_HEADING_COLOR)
    })

    // QA7 (#171684): in the dark theme a heading stood #063f53 on #1C1C1C, 1.5:1.
    it.each([
        {name: 'a component', heading: <Typography component='h3'>No widgets are shown</Typography>, level: 3},
        {name: 'a variant', heading: <Typography variant='h5'>Totals</Typography>, level: 5},
        {name: 'a subtitle, which is an h6', heading: <Typography variant='subtitle2'>Details</Typography>, level: 6},
    ])('gives a heading made by $name the text colour around it in the dark theme', ({heading, level}) => {
        const {getByRole} = renderOnPage('dark', heading)

        expect(declaredColor(getByRole('heading', {level}))).toBe('inherit')
    })

    // QA7: the skin's h2 padding-top of 1.3em put the titles of side sheets 23px low.
    it.each(['light', 'dark'] as const)('keeps no skin padding on a heading in %s', mode => {
        const {getByRole} = renderOnPage(
            mode,
            <Typography component='h2' sx={{fontSize: 18}}>
                Widget help
            </Typography>,
        )

        expect(getComputedStyle(getByRole('heading', {level: 2})).paddingTop).toBe('0px')
    })

    it.each(['light', 'dark'] as const)('leaves a heading the colour and the padding the page gave it in %s', mode => {
        const {getByRole} = renderOnPage(
            mode,
            <>
                <Typography component='h2' sx={{color: 'rgb(10, 145, 188)', pt: '12px'}}>
                    Documents
                </Typography>
                <Typography color='error' component='h4'>
                    Failed
                </Typography>
            </>,
        )

        expect(getComputedStyle(getByRole('heading', {level: 2})).color).toBe('rgb(10, 145, 188)')
        expect(getComputedStyle(getByRole('heading', {level: 2})).paddingTop).toBe('12px')
        const paletteColour = getComputedStyle(getByRole('heading', {level: 4})).color
        expect(paletteColour).not.toBe(SKIN_HEADING_COLOR)
        expect(paletteColour).not.toBe(PAGE_TEXT_COLOR)
    })

    it('leaves text that is not a heading alone', () => {
        const {getByText} = renderOnPage('dark', <Typography sx={{pt: '12px'}}>Exchange rate</Typography>)

        expect(getComputedStyle(getByText('Exchange rate')).paddingTop).toBe('12px')
        expect(declaredColor(getByText('Exchange rate'))).not.toBe('inherit')
    })
})
