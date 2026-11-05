import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, PNE_BRAND_RAMP_STEPS} from '../src'

// UI Kit (Claude) tokens.css: the brand ramp of its seed #007DFF.
const UI_KIT_BRAND_RAMP = {
    0: '#FFFFFF',
    50: '#F2F8FF',
    100: '#CCE5FF',
    200: '#99CBFF',
    300: '#66B1FF',
    400: '#3397FF',
    500: '#007DFF',
    600: '#0972DE',
    700: '#1266BD',
    800: '#1C5B9D',
    900: '#254F7C',
    950: '#2C4763',
    1000: '#2E445B',
} as const

// Skin colours of different classes: teal, yellow, purple, red, light blue, black.
const SKIN_COLORS = ['#0a91bc', '#f0b90a', '#4c176e', '#ca3827', '#79ceef', '#000000']

const contrastWithBlack = (color: string): number => getContrastRatio(color, '#000000')

describe('createPneBrandRamp', () => {
    it('reproduces the UI Kit brand ramp from the UI Kit seed', () => {
        const ramp = createPneBrandRamp('#007dff')

        Object.entries(UI_KIT_BRAND_RAMP).forEach(([step, color]) => {
            expect([step, ramp[Number(step) as keyof typeof UI_KIT_BRAND_RAMP]]).toEqual([step, color])
        })
    })

    it('keeps the skin colour as step 500 and goes from white to dark', () => {
        SKIN_COLORS.forEach(skinColor => {
            const ramp = createPneBrandRamp(skinColor)
            const lightness = PNE_BRAND_RAMP_STEPS.map(step => contrastWithBlack(ramp[step]))

            expect(ramp[0]).toBe('#FFFFFF')
            expect(ramp[500]).toBe(skinColor.toUpperCase())
            lightness.slice(1).forEach((value, index) => {
                expect(value).toBeLessThanOrEqual(lightness[index])
            })
        })
    })

    it('makes every step a distinct colour for a chromatic skin', () => {
        const ramp = createPneBrandRamp('#0a91bc')

        expect(new Set(PNE_BRAND_RAMP_STEPS.map(step => ramp[step])).size).toBe(PNE_BRAND_RAMP_STEPS.length)
    })

    it('builds a grey ramp for an achromatic skin', () => {
        const ramp = createPneBrandRamp('#7a7a7a')

        PNE_BRAND_RAMP_STEPS.forEach(step => {
            const [red, green, blue] = [1, 3, 5].map(index => ramp[step].slice(index, index + 2))
            expect([step, green, blue]).toEqual([step, red, red])
        })
    })

    it('accepts short hex and marks a missing colour like the theme does', () => {
        expect(createPneBrandRamp('#07f')[500]).toBe('#0077FF')
        expect(createPneBrandRamp('')[500]).toBe('#FF00DC')
        expect(createPneBrandRamp('blue')[500]).toBe('#FF00DC')
    })
})
