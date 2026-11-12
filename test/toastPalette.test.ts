import {createPneTheme, type Skin} from '../src'
import {createPneToastPalette} from '../src/toastPalette'

describe('createPneToastPalette', () => {
    it('fills a toast with the border colour of its tone and writes in its text colour (UI Kit Toast)', () => {
        const colors = createPneToastPalette('light')

        expect(colors.success).toEqual({fill: '#96E7A7', text: '#017433', bannerFill: '#DFFBE4'})
        expect(colors.error).toEqual({fill: '#FEBEBB', text: '#B1182C', bannerFill: '#FFEEED'})
        expect(colors.warning).toEqual({fill: '#FFC393', text: '#8E4E01', bannerFill: '#FEEFE4'})
        expect(colors.info).toEqual({fill: '#B3D4FF', text: '#005EB9', bannerFill: '#EBF3FF'})
        expect(colors.title).toBe('#2C3136')
        expect(colors.shadow).toMatch(/^0 -1px 12px rgba\(0,0,0,0\.03\)/)
    })

    it('turns the tones over in the dark theme', () => {
        const colors = createPneToastPalette('dark')

        expect(colors.error).toEqual({fill: '#B1182C', text: '#FEBEBB', bannerFill: '#6C0816'})
        expect(colors.info).toEqual({fill: '#005EB9', text: '#B3D4FF', bannerFill: '#003670'})
        expect(colors.title).toBe('#F2F2F2')
    })

    it('is the same for every skin and is exposed through the theme', () => {
        const blue = createPneTheme({experimentalColor: '#026fd7'} as Skin)
        const green = createPneTheme({experimentalColor: '#2e7d32'} as Skin)

        expect(blue.palette.pne.toast).toEqual(createPneToastPalette('light'))
        expect(green.palette.pne.toast).toEqual(blue.palette.pne.toast)
    })
})
