import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneDropdownPalette, createPneTheme, type Skin} from '../src'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneDropdownPalette(createPneBrandRamp(skinColor), mode)

describe('createPneDropdownPalette', () => {
    it('reproduces the UI Kit light Dropdown list tokens for the UI Kit seed', () => {
        const colors = palette('#007dff')

        expect(colors.panel.fill).toBe('#FFFFFF')
        expect(colors.panel.ring).toBe('#EBEDF0')
        expect(colors.panel.shadow).toContain('0 17px 36px rgba(0,0,0,0.07)')
        expect(colors.option).toEqual({
            text: '#41556B',
            disabled: '#A2AEB9',
            hover: '#F5F6F7',
            selected: '#F2F8FF',
            check: '#007DFF',
        })
        expect(colors.chevron).toEqual({default: '#41556B', disabled: '#A2AEB9'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#007dff'} as Skin)

        expect(theme.palette.pne.dropdown.option.selected).toBe('#F2F8FF')
    })

    it('takes the check from the brand step that reads on the page (rule 1)', () => {
        for (const skin of ['#007dff', '#79ceef', '#f0b90a']) {
            expect(getContrastRatio(palette(skin).option.check, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        }
        expect(getContrastRatio(palette('#000000', 'dark').option.check, '#1C1C1C')).toBeGreaterThanOrEqual(3)
    })

    it('keeps the dark theme on pne-ui neutrals with a deep brand tint for the picked row', () => {
        const colors = palette('#007dff', 'dark')

        expect(colors.panel.fill).toBe('#1C1C1C')
        expect(colors.panel.ring).toBe('#484848')
        expect(colors.option.text).toBe('#F2F2F2')
        expect(colors.option.hover).toBe('#292929')
        expect(colors.option.selected).toBe('#254F7C')
    })
})
