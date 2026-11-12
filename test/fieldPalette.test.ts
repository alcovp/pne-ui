import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneFieldPalette} from '../src/fieldPalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneFieldPalette(createPneBrandRamp(skinColor), mode)

const NONE = 'transparent'

describe('createPneFieldPalette', () => {
    it('reproduces the UI Kit light field tokens for the UI Kit brand colour', () => {
        const colors = palette('#026fd7')

        expect(colors.fill.default).toEqual({fill: '#F0F4F8', ring: '#F0F4F8'})
        expect(colors.fill.hover).toEqual({fill: '#F7FBFF', ring: '#E2E9F0'})
        expect(colors.fill.active).toEqual({fill: '#F0F4F8', ring: '#8D9399'})
        expect(colors.fill.focus).toEqual({fill: '#F0F4F8', ring: '#026FD7'})
        expect(colors.fill.error).toEqual({fill: '#F0F4F8', ring: '#CC2538'})
        expect(colors.fill.disabled).toEqual({fill: '#F0F4F8', ring: '#F0F4F8'})
        expect(colors.outlined.default).toEqual({fill: '#FFFFFF', ring: '#E2E9F0'})
        expect(colors.outlined.hover.ring).toBe('#8D9399')
        expect(colors.outlined.active).toEqual({fill: '#FFFFFF', ring: '#8D9399'})
        expect(colors.outlined.focus.ring).toBe('#026FD7')
        expect(colors.outlined.error.ring).toBe('#CC2538')
        expect(colors.outlined.disabled.ring).toBe('#F0F4F8')
        expect(colors.text).toEqual({
            value: '#2C3136',
            placeholder: '#8D9399',
            disabled: '#B2B8BF',
            label: '#565B61',
            mark: '#2C3136',
        })
        expect(colors.helper).toEqual({text: '#565B61', error: '#B1182C'})
    })

    it('is exposed through the theme', () => {
        const theme = createPneTheme({experimentalColor: '#026fd7'} as Skin)

        expect(theme.palette.pne.field.outlined.default.ring).toBe('#E2E9F0')
    })

    it('takes the focus ring from the brand step that reads on the page (rule 1)', () => {
        for (const skin of ['#026fd7', '#79ceef', '#f0b90a']) {
            const colors = palette(skin)
            expect(colors.fill.focus.ring).toBe(colors.outlined.focus.ring)
            expect(getContrastRatio(colors.outlined.focus.ring, '#FFFFFF')).toBeGreaterThanOrEqual(3)
        }
        expect(getContrastRatio(palette('#000000', 'dark').outlined.focus.ring, '#121212')).toBeGreaterThanOrEqual(3)
    })

    it('keeps the dark theme on pne-ui neutrals', () => {
        const colors = palette('#026fd7', 'dark')

        expect(colors.outlined.default).toEqual({fill: NONE, ring: '#484848'})
        expect(colors.fill.default.fill).toBe('#292929')
        expect(colors.text.value).toBe('#F2F2F2')
        expect(colors.helper.error).toBe('#FEBEBB')
    })
})
