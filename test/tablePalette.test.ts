import {createPneBrandRamp, createPneTheme, type Skin} from '../src'
import {createPneTablePalette} from '../src/tablePalette'

const palette = (skinColor: string, mode: 'light' | 'dark' = 'light') =>
    createPneTablePalette(createPneBrandRamp(skinColor), mode)

describe('createPneTablePalette', () => {
    it('reproduces the UI Kit table colours for the UI Kit brand colour', () => {
        expect(palette('#026fd7')).toEqual({
            text: '#2C3136',
            line: '#E2E9F0',
            row: {hover: '#F0F4F8', selected: '#EBF3FF'},
            header: {text: '#2C3136', island: {fill: '#F0F4F8', text: '#565B61'}},
            sort: {active: '#005EB9', inactive: '#B2B8BF', idle: '#6E747A'},
            band: {
                shell: {fill: '#FFFFFF', ring: '#E2E9F0'},
                tabs: {fill: '#F0F4F8', ring: '#E2E9F0'},
            },
            skeleton: '#F0F4F8',
            empty: {fill: '#F0F4F8', icon: '#565B61'},
        })
    })

    it('tints the picked row and the sort sign by the skin and keeps the neutrals', () => {
        const green = palette('#2e7d32')

        expect(green.row.selected).not.toBe('#EBF3FF')
        expect(green.sort.active).not.toBe('#005EB9')
        expect(green.line).toBe('#E2E9F0')
        expect(green.row.hover).toBe('#F0F4F8')
    })

    it('keeps the dark theme on pne-ui neutrals and is exposed through the theme', () => {
        const dark = palette('#026fd7', 'dark')

        expect(dark.text).toBe('#F2F2F2')
        expect(dark.line).toBe('#484848')
        expect(createPneTheme({experimentalColor: '#026fd7'} as Skin).palette.pne.table.line).toBe('#E2E9F0')
    })
})
