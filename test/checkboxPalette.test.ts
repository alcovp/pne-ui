import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneCheckboxPalette} from '../src/checkboxPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneCheckboxPalette(createPneBrandRamp(skinColor), mode)

describe('createPneCheckboxPalette', () => {
    it('reproduces the UI Kit light checkbox tokens for the UI Kit seed', () => {
        const colors = palette('#007dff')

        expect(colors.off.default).toEqual({fill: '#FFFFFF', ring: '#A2AEB9', mark: 'transparent'})
        expect(colors.off.hover).toEqual({fill: '#FFFFFF', ring: '#007DFF', mark: 'transparent'})
        expect(colors.off.pressed).toEqual({fill: '#F2F8FF', ring: '#1266BD', mark: 'transparent'})
        expect(colors.off.error).toEqual({fill: '#FFFFFF', ring: '#EC4B5D', mark: 'transparent'})
        expect(colors.off.disabled).toEqual({fill: '#EBEDF0', ring: '#C9D2D9', mark: 'transparent'})
        expect(colors.off.readOnly).toEqual({fill: '#F5F6F7', ring: '#C9D2D9', mark: 'transparent'})
        expect(colors.on.default).toEqual({fill: '#007DFF', ring: 'transparent', mark: '#FFFFFF'})
        expect(colors.on.hover.fill).toBe('#0972DE')
        expect(colors.on.pressed.fill).toBe('#1266BD')
        expect(colors.on.error).toEqual({fill: '#EC4B5D', ring: 'transparent', mark: '#FFFFFF'})
        expect(colors.on.disabled).toEqual({fill: '#A2AEB9', ring: 'transparent', mark: '#FFFFFF'})
        expect(colors.on.readOnly).toEqual({fill: '#8F9CAA', ring: 'transparent', mark: '#FFFFFF'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#007dff'} as Skin)

        expect(theme.palette.pne.checkbox.on.default.fill).toBe('#007DFF')
    })

    it('darkens the hover and pressed rings of a light skin until they read on white (rule 1)', () => {
        const colors = palette('#79ceef')

        expect(getContrastRatio(colors.off.hover.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        expect(getContrastRatio(colors.off.pressed.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    })

    it('lightens a black skin under the pointer (rule 2)', () => {
        const colors = palette('#000000')

        expect(colors.on.default.fill).toBe('#000000')
        expect(colors.on.hover.fill).toBe('#333333')
        expect(colors.on.pressed.fill).toBe('#666666')
    })

    it('puts a dark mark on a fill that a white one does not read on (rule 3)', () => {
        const colors = palette('#f0b90a')

        expect(colors.on.default.mark).toBe('rgba(0, 0, 0, 0.87)')
        expect(colors.on.disabled.mark).toBe('#FFFFFF')
    })

    it('rings the on box of a black skin in the dark theme and marks neutral fills with the page colour', () => {
        const black = palette('#000000', 'dark')
        const blue = palette('#007dff', 'dark')

        expect(black.on.default.ring).not.toBe('transparent')
        expect(getContrastRatio(black.on.default.ring, '#121212')).toBeGreaterThanOrEqual(3)
        expect(blue.on.default.ring).toBe('transparent')
        expect(blue.off.default).toEqual({fill: 'transparent', ring: '#707070', mark: 'transparent'})
        expect(blue.on.disabled.mark).toBe('#121212')
    })
})
