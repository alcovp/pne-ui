import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneSwitchPalette} from '../src/switchPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneSwitchPalette(createPneBrandRamp(skinColor), mode)

const NONE = 'transparent'

describe('createPneSwitchPalette', () => {
    it('reproduces the UI Kit light switch tokens for the UI Kit brand colour', () => {
        const colors = palette('#026fd7')

        expect(colors.off.default).toEqual({track: '#CED5DC', ring: NONE, knob: '#FFFFFF'})
        expect(colors.off.hover).toEqual({track: '#B2B8BF', ring: NONE, knob: '#FFFFFF'})
        expect(colors.off.pressed).toEqual({track: '#026FD7', ring: NONE, knob: '#FFFFFF'})
        expect(colors.off.disabled).toEqual({track: '#CED5DC', ring: NONE, knob: '#B2B8BF'})
        expect(colors.off.readOnly).toEqual({track: '#E2E9F0', ring: NONE, knob: '#6E747A'})
        expect(colors.on.default).toEqual({track: '#026FD7', ring: NONE, knob: '#FFFFFF'})
        expect(colors.on.hover.track).toBe('#005EB9')
        expect(colors.on.pressed.track).toBe('#004B96')
        expect(colors.on.disabled).toEqual({track: '#CED5DC', ring: NONE, knob: '#B2B8BF'})
        expect(colors.on.readOnly).toEqual({track: '#6E747A', ring: NONE, knob: '#FFFFFF'})
        expect(colors.spinner).toEqual({on: '#026FD7', off: '#026FD7'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)

        expect(theme.palette.pne.switch.on.default.track).toBe('#026FD7')
    })

    it('puts a dark knob on the on track of a light skin, with a white spinner in it (rule 3)', () => {
        const colors = palette('#f0b90a')

        expect(colors.on.default).toEqual({track: '#F0B90A', ring: NONE, knob: 'rgba(0, 0, 0, 0.87)'})
        expect(colors.on.pressed.knob).toBe('rgba(0, 0, 0, 0.87)')
        expect(colors.off.default.knob).toBe('#FFFFFF')
        expect(colors.spinner.on).toBe('#FFFFFF')
        expect(getContrastRatio(colors.spinner.off, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    })

    it('lightens a black skin under the pointer (rule 2)', () => {
        const colors = palette('#000000')

        expect(colors.on.default.track).toBe('#000000')
        expect(colors.on.hover.track).toBe('#252525')
        expect(colors.on.pressed.track).toBe('#606060')
    })

    it('rings the on track of a black skin in the dark theme and keeps the off track neutral', () => {
        const colors = palette('#000000', 'dark')

        expect(colors.on.default.ring).not.toBe(NONE)
        expect(getContrastRatio(colors.on.default.ring, '#292929')).toBeGreaterThanOrEqual(3)
        expect(palette('#026fd7', 'dark').on.default.ring).toBe(NONE)
        expect(palette('#026fd7', 'dark').off.default).toEqual({track: '#707070', ring: NONE, knob: '#FFFFFF'})
    })
})
