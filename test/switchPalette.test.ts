import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneSwitchPalette} from '../src/switchPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneSwitchPalette(createPneBrandRamp(skinColor), mode)

describe('createPneSwitchPalette', () => {
    it('reproduces the UI Kit light switch tokens for the UI Kit seed', () => {
        const colors = palette('#007dff')

        expect(colors.off.default).toEqual({track: '#F2F8FF', ring: '#C9D2D9', knob: '#007DFF'})
        expect(colors.off.hover).toEqual({track: '#CCE5FF', ring: '#007DFF', knob: '#0972DE'})
        expect(colors.off.pressed).toEqual({track: '#CCE5FF', ring: '#1266BD', knob: '#1266BD'})
        expect(colors.off.disabled).toEqual({track: '#EBEDF0', ring: '#EBEDF0', knob: '#A2AEB9'})
        expect(colors.off.readOnly).toEqual({track: '#F5F6F7', ring: '#C9D2D9', knob: '#8F9CAA'})
        expect(colors.on.default).toEqual({track: '#007DFF', ring: 'transparent', knob: '#FFFFFF'})
        expect(colors.on.hover.track).toBe('#0972DE')
        expect(colors.on.pressed.track).toBe('#1266BD')
        expect(colors.on.disabled).toEqual({track: '#A2AEB9', ring: 'transparent', knob: '#FFFFFF'})
        expect(colors.on.readOnly).toEqual({track: '#8F9CAA', ring: 'transparent', knob: '#FFFFFF'})
        expect(colors.spinner).toEqual({on: '#007DFF', off: '#FFFFFF'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#007dff'} as Skin)

        expect(theme.palette.pne.switch.on.default.track).toBe('#007DFF')
    })

    it('darkens the off knob of a light skin until it reads on white (rule 1)', () => {
        const colors = palette('#79ceef')
        const ramp = createPneBrandRamp('#79ceef')

        expect(colors.off.default.knob).not.toBe(ramp[500])
        expect(getContrastRatio(colors.off.default.knob, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        expect(getContrastRatio(colors.off.hover.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
    })

    it('lightens a black skin under the pointer (rule 2)', () => {
        const colors = palette('#000000')

        expect(colors.on.default.track).toBe('#000000')
        expect(colors.on.hover.track).toBe('#333333')
        expect(colors.on.pressed.track).toBe('#666666')
        expect(colors.off.hover.knob).toBe('#333333')
    })

    it('rings the on track of a black skin in the dark theme and keeps the off knob readable', () => {
        const colors = palette('#000000', 'dark')

        expect(colors.on.default.ring).not.toBe('transparent')
        expect(getContrastRatio(colors.off.default.knob, '#121212')).toBeGreaterThanOrEqual(3)
        expect(palette('#007dff', 'dark').on.default.ring).toBe('transparent')
    })
})
