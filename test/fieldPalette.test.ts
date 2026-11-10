import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneFieldPalette} from '../src/fieldPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneFieldPalette(createPneBrandRamp(skinColor), mode)

describe('createPneFieldPalette', () => {
    it('reproduces the UI Kit light field tokens for the UI Kit seed', () => {
        const colors = palette('#007dff')

        expect(colors.fill.default).toEqual({fill: '#F5F6F7', ring: '#EBEDF0'})
        expect(colors.fill.hover).toEqual({fill: '#F5F6F7', ring: '#C9D2D9'})
        expect(colors.fill.focus.fill).toBe('#EBEDF0')
        expect(colors.fill.error).toEqual({fill: '#EBEDF0', ring: '#EC4B5D'})
        expect(colors.fill.disabled).toEqual({fill: '#EBEDF0', ring: '#EBEDF0'})
        expect(colors.outlined.default).toEqual({fill: '#FFFFFF', ring: '#C9D2D9'})
        expect(colors.outlined.hover.ring).toBe('#8F9CAA')
        expect(colors.text).toEqual({value: '#41556B', placeholder: '#7C8B9B', disabled: '#A2AEB9', label: '#41556B'})
        expect(colors.helper).toEqual({text: '#7C8B9B', error: '#C8283B'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#007dff'} as Skin)

        expect(theme.palette.pne.field.outlined.default.ring).toBe('#C9D2D9')
    })

    it('takes the focus ring from the brand step that reads on the page (rule 1)', () => {
        for (const skin of ['#007dff', '#79ceef', '#f0b90a']) {
            const colors = palette(skin)
            expect(colors.fill.focus.ring).toBe(colors.outlined.focus.ring)
            expect(getContrastRatio(colors.outlined.focus.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        }
        expect(getContrastRatio(palette('#000000', 'dark').outlined.focus.ring, '#121212')).toBeGreaterThanOrEqual(3)
    })

    it('keeps the dark theme on pne-ui neutrals', () => {
        const colors = palette('#007dff', 'dark')

        expect(colors.outlined.default).toEqual({fill: 'transparent', ring: '#484848'})
        expect(colors.fill.default.fill).toBe('#292929')
        expect(colors.text.value).toBe('#F2F2F2')
        expect(colors.helper.error).toBe('#F7B7BE')
    })
})
