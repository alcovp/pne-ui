import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneDropdownPalette} from '../src/dropdownPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneDropdownPalette(createPneBrandRamp(skinColor), mode)

describe('createPneDropdownPalette', () => {
    it('reproduces the UI Kit light Dropdown list tokens for the UI Kit brand colour', () => {
        const colors = palette('#026fd7')

        expect(colors.panel.fill).toBe('#FFFFFF')
        expect(colors.panel.ring).toBe('#E2E9F0')
        expect(colors.panel.shadow).toContain('0 17px 36px rgba(0,0,0,0.07)')
        expect(colors.option).toEqual({
            text: '#2C3136',
            disabled: '#B2B8BF',
            hover: '#F0F4F8',
            selected: '#EBF3FF',
            check: '#026FD7',
        })
        expect(colors.chevron).toEqual({default: '#2C3136', disabled: '#B2B8BF'})
        expect(colors.status).toEqual({text: '#6E747A', error: '#B1182C'})
        expect(colors.chip).toEqual({fill: '#F7FBFF', ring: '#CED5DC', text: '#2C3136', remove: '#6E747A'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)

        expect(theme.palette.pne.dropdown.option.selected).toBe('#EBF3FF')
    })

    it('takes the check from a brand step that reads on the page (rule 1) and on the picked row tint', () => {
        for (const skin of ['#026fd7', '#79ceef', '#f0b90a']) {
            const light = palette(skin)
            expect(getContrastRatio(light.option.check, '#FFFFFF')).toBeGreaterThanOrEqual(3)
            expect(getContrastRatio(light.option.check, light.option.selected)).toBeGreaterThanOrEqual(3)
            const dark = palette(skin, 'dark')
            expect(getContrastRatio(dark.option.check, '#1C1C1C')).toBeGreaterThanOrEqual(3)
            expect(getContrastRatio(dark.option.check, dark.option.selected)).toBeGreaterThanOrEqual(3)
        }
        expect(getContrastRatio(palette('#000000', 'dark').option.check, '#1C1C1C')).toBeGreaterThanOrEqual(3)
    })

    it('keeps the dark theme on pne-ui neutrals with a deep brand tint for the picked row', () => {
        const colors = palette('#026fd7', 'dark')

        expect(colors.panel.fill).toBe('#1C1C1C')
        expect(colors.panel.ring).toBe('#484848')
        expect(colors.option.text).toBe('#F2F2F2')
        expect(colors.option.hover).toBe('#292929')
        expect(colors.option.selected).toBe('#003670')
    })
})
