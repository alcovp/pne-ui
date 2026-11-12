import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneCheckboxPalette} from '../src/checkboxPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneCheckboxPalette(createPneBrandRamp(skinColor), mode)

const NONE = 'transparent'

describe('createPneCheckboxPalette', () => {
    it('reproduces the UI Kit light checkbox tokens for the UI Kit brand colour', () => {
        const colors = palette('#026fd7')

        expect(colors.off.default).toEqual({fill: '#F7FBFF', ring: '#B2B8BF', mark: NONE})
        expect(colors.off.hover).toEqual({fill: '#F7FBFF', ring: '#026FD7', mark: NONE})
        expect(colors.off.pressed).toEqual({fill: '#EBF3FF', ring: '#004B96', mark: NONE})
        expect(colors.off.error).toEqual({fill: '#F7FBFF', ring: '#CC2538', mark: NONE})
        expect(colors.off.disabled).toEqual({fill: '#F0F4F8', ring: '#E2E9F0', mark: NONE})
        expect(colors.off.readOnly).toEqual({fill: '#F0F4F8', ring: '#E2E9F0', mark: NONE})
        expect(colors.on.default).toEqual({fill: '#026FD7', ring: NONE, mark: '#F7FBFF'})
        expect(colors.on.hover.fill).toBe('#005EB9')
        expect(colors.on.pressed.fill).toBe('#004B96')
        expect(colors.on.error).toEqual({fill: '#CC2538', ring: NONE, mark: '#F7FBFF'})
        expect(colors.on.disabled).toEqual({fill: '#B2B8BF', ring: NONE, mark: '#F7FBFF'})
        expect(colors.on.readOnly).toEqual({fill: '#8D9399', ring: NONE, mark: '#F7FBFF'})
    })

    it('gives the labelled checkbox its text and its card by UI Kit role', () => {
        const colors = palette('#026fd7')

        expect(colors.text).toEqual({label: '#2C3136', helper: '#6E747A', error: '#B1182C', disabled: '#B2B8BF'})
        expect(colors.card).toEqual({
            fill: '#F0F4F8',
            fillOn: '#EBF3FF',
            ringOn: '#026FD7',
            ringHover: '#E2E9F0',
            ringError: '#CC2538',
        })
        expect(getContrastRatio(palette('#f0b90a').card.ringOn, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)

        expect(theme.palette.pne.checkbox.on.default.fill).toBe('#026FD7')
    })

    it('darkens the hover and pressed rings of a light skin until they read on white (rule 1)', () => {
        const colors = palette('#79ceef')

        expect(getContrastRatio(colors.off.hover.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        expect(getContrastRatio(colors.off.pressed.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    })

    it('lightens a black skin under the pointer (rule 2)', () => {
        const colors = palette('#000000')

        expect(colors.on.default.fill).toBe('#000000')
        expect(colors.on.hover.fill).toBe('#252525')
        expect(colors.on.pressed.fill).toBe('#606060')
    })

    it('puts a dark mark on a fill that a white one does not read on (rule 3)', () => {
        const colors = palette('#f0b90a')

        expect(colors.on.default.mark).toBe('rgba(0, 0, 0, 0.87)')
        expect(colors.on.disabled.mark).toBe('#F7FBFF')
    })

    it('rings the on box of a black skin in the dark theme and marks neutral fills with the page colour', () => {
        const black = palette('#000000', 'dark')
        const blue = palette('#026fd7', 'dark')

        expect(black.on.default.ring).not.toBe(NONE)
        expect(getContrastRatio(black.on.default.ring, '#292929')).toBeGreaterThanOrEqual(3)
        expect(blue.on.default.ring).toBe(NONE)
        expect(blue.off.default).toEqual({fill: NONE, ring: '#707070', mark: NONE})
        expect(blue.on.disabled.mark).toBe('#121212')
    })
})
