import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneButtonPalette} from '../src/buttonPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneButtonPalette(createPneBrandRamp(skinColor), mode)

const NONE = 'transparent'

describe('createPneButtonPalette', () => {
    it('reproduces the UI Kit light button tokens for the UI Kit brand colour', () => {
        const buttons = palette('#026fd7')

        expect(buttons.primary.default).toEqual({fill: '#026FD7', border: NONE, text: '#FFFFFF'})
        expect(buttons.primary.hover.fill).toBe('#005EB9')
        expect(buttons.primary.pressed.fill).toBe('#004B96')
        expect(buttons.primary.focus).toEqual(buttons.primary.default)
        expect(buttons.primary.disabled).toEqual({fill: '#B2B8BF', border: NONE, text: '#FFFFFF'})
        expect(buttons.outline.default).toEqual({fill: NONE, border: '#026FD7', text: '#005EB9'})
        expect(buttons.outline.hover).toEqual({fill: '#EBF3FF', border: '#005EB9', text: '#005EB9'})
        expect(buttons.outline.pressed).toEqual({fill: '#D7E8FF', border: '#005EB9', text: '#004B96'})
        expect(buttons.outline.focus).toEqual({fill: '#F7FBFF', border: '#026FD7', text: '#005EB9'})
        expect(buttons.outline.disabled).toEqual({fill: '#F7FBFF', border: '#B2B8BF', text: '#B2B8BF'})
        expect(buttons.text.default).toEqual({fill: '#F0F4F8', border: NONE, text: '#565B61'})
        expect(buttons.text.hover).toEqual({fill: '#F0F4F8', border: NONE, text: '#005EB9'})
        expect(buttons.text.pressed).toEqual({fill: '#E2E9F0', border: NONE, text: '#004B96'})
        expect(buttons.text.disabled).toEqual({fill: '#F0F4F8', border: NONE, text: '#B2B8BF'})
        expect(buttons.soft.default).toEqual({fill: '#F0F4F8', border: NONE, text: '#005EB9'})
        expect(buttons.soft.hover).toEqual({fill: '#EBF3FF', border: NONE, text: '#005EB9'})
        expect(buttons.soft.pressed).toEqual({fill: '#D7E8FF', border: NONE, text: '#004B96'})
        expect(buttons.soft.disabled).toEqual({fill: '#F0F4F8', border: NONE, text: '#B2B8BF'})
        expect(buttons.destructive.default).toEqual({fill: '#CC2538', border: NONE, text: '#FFFFFF'})
        expect(buttons.destructive.hover.fill).toBe('#B1182C')
        expect(buttons.destructive.pressed.fill).toBe('#900F21')
        expect(buttons.destructive.disabled).toEqual({fill: '#FEBEBB', border: NONE, text: '#FFFFFF'})
        expect(buttons.warning.default).toEqual({fill: '#A65C03', border: NONE, text: '#FFFFFF'})
        expect(buttons.warning.hover.fill).toBe('#8E4E01')
        expect(buttons.warning.pressed.fill).toBe('#733E01')
        expect(buttons.warning.disabled.fill).toBe('#FFC393')
    })

    it('gives Tertiary its tones and its Active and Activated looks', () => {
        const buttons = palette('#026fd7')

        expect(buttons.textDanger.default).toEqual({fill: '#F0F4F8', border: NONE, text: '#B1182C'})
        expect(buttons.textDanger.hover).toEqual({fill: '#EBF3FF', border: NONE, text: '#B1182C'})
        expect(buttons.textDanger.pressed).toEqual({fill: '#E2E9F0', border: NONE, text: '#B1182C'})
        expect(buttons.textDanger.disabled).toEqual({fill: '#F0F4F8', border: NONE, text: '#B2B8BF'})
        expect(buttons.textSuccess.default).toEqual({fill: '#F0F4F8', border: NONE, text: '#017433'})
        expect(buttons.textSuccess.hover.fill).toBe('#EBF3FF')
        expect(buttons.textSuccess.activated).toEqual({fill: '#DFFBE4', border: '#96E7A7', text: '#017433'})
        expect(buttons.text.active).toEqual({
            fill: '#FFFFFF',
            border: NONE,
            text: '#565B61',
            shadow: '0px 0px 4px 0px rgba(0,0,0,0.04), 0px 4px 8px 0px rgba(0,0,0,0.06)',
        })
        expect(buttons.primary.active).toBeUndefined()
        expect(buttons.text.activated).toBeUndefined()
    })

    it('exposes the UI Kit focus ring and link colours through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)

        expect(theme.palette.pne.ramp[600]).toBe('#026FD7')
        expect(theme.palette.pne.focusRing).toBe('#026FD7')
        expect(theme.palette.pne.link).toBe('#005EB9')
    })

    describe('rule 1: brand as text or ring reads on the page', () => {
        it.each(['#79ceef', '#f0b90a', '#58bd5f', '#ff6600'])('darkens the outline and soft text of %s', skinColor => {
            const buttons = palette(skinColor)

            ;[buttons.outline.default.text, buttons.soft.default.text, buttons.text.hover.text].forEach(color => {
                expect(getContrastRatio(color, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
                expect(getContrastRatio(color, '#F0F4F8')).toBeGreaterThanOrEqual(4.5)
            })
            expect(getContrastRatio(buttons.outline.default.border, '#FFFFFF')).toBeGreaterThanOrEqual(3)
            expect(getContrastRatio(buttons.outline.pressed.text, '#FFFFFF'))
                .toBeGreaterThanOrEqual(getContrastRatio(buttons.outline.default.text, '#FFFFFF'))
        })

        it('leaves a skin that already reads alone: the ring is its fill, the text one step darker', () => {
            const buttons = palette('#174f98')
            const ramp = createPneBrandRamp('#174f98')

            expect(buttons.outline.default.border).toBe('#174F98')
            expect(buttons.outline.default.text).toBe(ramp[700])
            expect(buttons.soft.pressed.text).toBe(ramp[800])
        })

        it('lightens the brand text in the dark theme instead', () => {
            const buttons = palette('#000000', 'dark')

            ;[buttons.outline.default.text, buttons.soft.default.text].forEach(color => {
                expect(getContrastRatio(color, '#292929')).toBeGreaterThanOrEqual(4.5)
            })
            expect(getContrastRatio(buttons.outline.default.border, '#292929')).toBeGreaterThanOrEqual(3)
        })
    })

    describe('rule 2: a near-black skin lightens under the pointer', () => {
        it('goes to steps 500 and 400 for black', () => {
            const buttons = palette('#000000')

            expect(buttons.primary.default.fill).toBe('#000000')
            expect(buttons.primary.hover.fill).toBe('#252525')
            expect(buttons.primary.pressed.fill).toBe('#606060')
        })

        it('keeps the darker steps for a skin whose darker steps are distinct', () => {
            for (const skinColor of ['#0a91bc', '#4c176e']) {
                const buttons = palette(skinColor)
                const ramp = createPneBrandRamp(skinColor)

                expect(buttons.primary.hover.fill).toBe(ramp[700])
                expect(buttons.primary.pressed.fill).toBe(ramp[800])
            }
        })
    })

    describe('rule 3: the label on a fill', () => {
        it('is dark on a light fill and white on a fill it reads on at 4.5:1', () => {
            expect(palette('#f0b90a').primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(palette('#79ceef').primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(palette('#174f98').primary.default.text).toBe('#FFFFFF')
            expect(palette('#ca3827').primary.default.text).toBe('#FFFFFF')
        })

        it.each(['#007dff', '#0a91bc', '#7a7a7a', '#026fd7', '#174f98', '#000000'])(
            'is white at 4.5:1 on every state of the fill of %s',
            skinColor => {
                const {primary} = palette(skinColor)

                ;[primary.default, primary.hover, primary.pressed].forEach(state => {
                    expect(state.text).toBe('#FFFFFF')
                    expect(getContrastRatio(state.fill, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
                })
            },
        )

        it('is the stronger of dark and white on the darker states of a light fill', () => {
            const buttons = palette('#ff6600')

            expect(buttons.primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(buttons.primary.hover.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(buttons.primary.pressed.text).toBe('#FFFFFF')
        })
    })

    it('rings a dark-theme fill that does not read on the dark surfaces', () => {
        const buttons = palette('#000000', 'dark')

        expect(buttons.primary.default.border).not.toBe(NONE)
        expect(getContrastRatio(buttons.primary.default.border, '#292929')).toBeGreaterThanOrEqual(3)
        expect(palette('#026fd7', 'dark').primary.default.border).toBe(NONE)
    })

    it('fills with the lighter step 500 on the dark surfaces', () => {
        const buttons = palette('#026fd7', 'dark')

        expect(buttons.primary.default.fill).toBe('#3E95FE')
        expect(buttons.primary.hover.fill).toBe('#80B7FE')
        expect(buttons.primary.pressed.fill).toBe('#026FD7')
    })
})
