import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneButtonPalette, createPneTheme, type Skin} from '../src'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneButtonPalette(createPneBrandRamp(skinColor), mode)

describe('createPneButtonPalette', () => {
    it('reproduces the UI Kit light button tokens for the UI Kit seed', () => {
        const buttons = palette('#007dff')

        expect(buttons.primary.default).toEqual({fill: '#007DFF', border: 'transparent', text: '#FFFFFF'})
        expect(buttons.primary.hover.fill).toBe('#0972DE')
        expect(buttons.primary.pressed.fill).toBe('#1266BD')
        expect(buttons.primary.disabled).toEqual({fill: '#A2AEB9', border: 'transparent', text: '#FFFFFF'})
        expect(buttons.outline.default).toEqual({fill: 'transparent', border: '#007DFF', text: '#007DFF'})
        expect(buttons.outline.hover).toEqual({fill: 'transparent', border: '#1266BD', text: '#007DFF'})
        expect(buttons.outline.pressed).toEqual({fill: 'transparent', border: '#1266BD', text: '#1266BD'})
        expect(buttons.outline.disabled).toEqual({fill: 'transparent', border: '#A2AEB9', text: '#A2AEB9'})
        expect(buttons.text.default).toEqual({fill: '#F5F6F7', border: 'transparent', text: '#55677B'})
        expect(buttons.text.hover).toEqual({fill: '#EBEDF0', border: 'transparent', text: '#41556B'})
        expect(buttons.text.pressed).toEqual({fill: '#C9D2D9', border: 'transparent', text: '#55677B'})
        expect(buttons.text.disabled).toEqual({fill: 'transparent', border: 'transparent', text: '#A2AEB9'})
        expect(buttons.soft.default).toEqual({fill: 'transparent', border: 'transparent', text: '#007DFF'})
        expect(buttons.soft.hover).toEqual({fill: '#F2F8FF', border: 'transparent', text: '#007DFF'})
        expect(buttons.soft.pressed).toEqual({fill: '#CCE5FF', border: 'transparent', text: '#1266BD'})
        expect(buttons.destructive.default.fill).toBe('#C8283B')
        expect(buttons.destructive.hover.fill).toBe('#A8202F')
        expect(buttons.destructive.pressed.fill).toBe('#8A1A27')
        expect(buttons.destructive.disabled).toEqual({fill: '#F7B7BE', border: 'transparent', text: '#FFFFFF'})
        expect(buttons.warning.default.fill).toBe('#B24A12')
        expect(buttons.warning.hover.fill).toBe('#923B0D')
        expect(buttons.warning.pressed.fill).toBe('#742F0A')
        expect(buttons.warning.disabled.fill).toBe('#FFCCB9')
    })

    it('exposes the UI Kit focus ring and link colours through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#007dff'} as Skin)

        expect(theme.palette.pne.ramp[500]).toBe('#007DFF')
        expect(theme.palette.pne.focusRing).toBe('#0972DE')
        // UI Kit links are step 400, which reads at 2.98:1 on white; rule 1 takes the next step.
        expect(theme.palette.pne.link).toBe('#007DFF')
    })

    describe('rule 1: brand as text or ring reads on the page', () => {
        it.each(['#79ceef', '#f0b90a', '#58bd5f', '#ff6600'])('darkens the outline and soft text of %s', skinColor => {
            const buttons = palette(skinColor)
            const ramp = createPneBrandRamp(skinColor)

            expect(buttons.outline.default.text).not.toBe(ramp[500])
            ;[buttons.outline.default.text, buttons.outline.default.border, buttons.soft.default.text].forEach(color => {
                expect(getContrastRatio(color, '#FFFFFF')).toBeGreaterThanOrEqual(3)
            })
            expect(getContrastRatio(buttons.outline.pressed.text, '#FFFFFF'))
                .toBeGreaterThanOrEqual(getContrastRatio(buttons.outline.default.text, '#FFFFFF'))
        })

        it('leaves a skin that already reads alone', () => {
            const buttons = palette('#174f98')

            expect(buttons.outline.default.text).toBe('#174F98')
            expect(buttons.soft.pressed.text).toBe(createPneBrandRamp('#174f98')[700])
        })

        it('lightens the brand text in the dark theme instead', () => {
            const buttons = palette('#000000', 'dark')

            ;[buttons.outline.default.text, buttons.outline.default.border, buttons.soft.default.text].forEach(color => {
                expect(getContrastRatio(color, '#121212')).toBeGreaterThanOrEqual(3)
            })
        })
    })

    describe('rule 2: a near-black skin lightens under the pointer', () => {
        it('goes to steps 400 and 300 for black', () => {
            const buttons = palette('#000000')

            expect(buttons.primary.default.fill).toBe('#000000')
            expect(buttons.primary.hover.fill).toBe('#333333')
            expect(buttons.primary.pressed.fill).toBe('#666666')
        })

        it('keeps the darker steps for a skin whose darker steps are distinct', () => {
            const buttons = palette('#0a91bc')
            const ramp = createPneBrandRamp('#0a91bc')

            expect(buttons.primary.hover.fill).toBe(ramp[600])
            expect(buttons.primary.pressed.fill).toBe(ramp[700])
        })
    })

    describe('rule 3: the label on a fill', () => {
        it('is dark on a light fill and white on a dark one', () => {
            expect(palette('#f0b90a').primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(palette('#79ceef').primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(palette('#174f98').primary.default.text).toBe('#FFFFFF')
            expect(palette('#ca3827').primary.default.text).toBe('#FFFFFF')
        })

        it('is checked for each fill state separately', () => {
            const buttons = palette('#ff6600')

            expect(buttons.primary.default.text).toBe('rgba(0, 0, 0, 0.87)')
            expect(buttons.primary.pressed.text).toBe('#FFFFFF')
        })
    })

    it('rings a dark-theme fill that does not read on the dark surfaces', () => {
        const buttons = palette('#000000', 'dark')

        expect(buttons.primary.default.border).not.toBe('transparent')
        expect(getContrastRatio(buttons.primary.default.border, '#292929')).toBeGreaterThanOrEqual(3)
        expect(palette('#007dff', 'dark').primary.default.border).toBe('transparent')
    })
})
