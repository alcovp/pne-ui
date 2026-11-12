import {createPneTheme, type Skin} from '../src'
import {createPneModalPalette} from '../src/modalPalette'

describe('createPneModalPalette', () => {
    it('reproduces the UI Kit modal colours in the light theme', () => {
        expect(createPneModalPalette('light')).toEqual({
            fill: '#FFFFFF',
            ring: '#E2E9F0',
            shadow: '0 8px 24px rgba(13, 26, 51, 0.12)',
            divider: '#E2E9F0',
            title: '#2C3136',
            subtitle: '#565B61',
            text: '#2C3136',
        })
    })

    it('keeps the dark theme on pne-ui neutrals', () => {
        const colors = createPneModalPalette('dark')

        expect(colors.fill).toBe('#1C1C1C')
        expect(colors.ring).toBe('#484848')
        expect(colors.title).toBe('#F2F2F2')
        expect(colors.subtitle).toBe('#B8B8B8')
    })

    it('is the same for every skin and is exposed through the theme', () => {
        const blue = createPneTheme({experimentalColor: '#026fd7'} as Skin)
        const green = createPneTheme({experimentalColor: '#2e7d32'} as Skin)

        expect(blue.palette.pne.modal).toEqual(createPneModalPalette('light'))
        expect(green.palette.pne.modal).toEqual(blue.palette.pne.modal)
    })
})
