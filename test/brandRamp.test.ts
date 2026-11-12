import {getContrastRatio} from '@mui/material/styles'

import {createPneBrandRamp, PNE_BRAND_RAMP_STEPS} from '../src'

// UI Kit (Claude) tokens.css: the brand ramp.
const UI_KIT_BRAND_RAMP = {
    0: '#FFFFFF',
    50: '#F7FAFE',
    100: '#EBF3FF',
    200: '#D7E8FF',
    300: '#B3D4FF',
    400: '#80B7FE',
    500: '#3E95FE',
    600: '#026FD7',
    700: '#005EB9',
    800: '#004B96',
    900: '#003670',
    950: '#002552',
} as const

// Skin colours of different classes: teal, yellow, purple, red, light blue, black.
const SKIN_COLORS = ['#0a91bc', '#f0b90a', '#4c176e', '#ca3827', '#79ceef', '#000000']

const contrastWithBlack = (color: string): number => getContrastRatio(color, '#000000')
const contrastWithWhite = (color: string): number => getContrastRatio(color, '#FFFFFF')

describe('createPneBrandRamp', () => {
    it('reproduces the UI Kit brand ramp from the UI Kit brand colour', () => {
        const ramp = createPneBrandRamp('#026fd7')

        Object.entries(UI_KIT_BRAND_RAMP).forEach(([step, color]) => {
            expect([step, ramp[Number(step) as keyof typeof UI_KIT_BRAND_RAMP]]).toEqual([step, color])
        })
    })

    it('goes from white to dark', () => {
        SKIN_COLORS.forEach(skinColor => {
            const ramp = createPneBrandRamp(skinColor)
            const lightness = PNE_BRAND_RAMP_STEPS.map(step => contrastWithBlack(ramp[step]))

            expect(ramp[0]).toBe('#FFFFFF')
            lightness.slice(1).forEach((value, index) => {
                expect(value).toBeLessThanOrEqual(lightness[index])
            })
        })
    })

    describe('step 600, the fill', () => {
        it.each(['#174f98', '#087962', '#ca3827', '#af176a', '#4c176e', '#000000'])(
            'is the skin colour %s itself when a white label reads on it at 4.5:1',
            skinColor => {
                expect(contrastWithWhite(skinColor)).toBeGreaterThanOrEqual(4.5)
                expect(createPneBrandRamp(skinColor)[600]).toBe(skinColor.toUpperCase())
            },
        )

        it.each(['#58bd5f', '#f0b90a', '#ff6600', '#79ceef'])(
            'is the light skin colour %s itself: it takes a dark label',
            skinColor => {
                expect(contrastWithWhite(skinColor)).toBeLessThan(3)
                expect(createPneBrandRamp(skinColor)[600]).toBe(skinColor.toUpperCase())
            },
        )

        it.each(['#007dff', '#0a91bc', '#7a7a7a'])(
            'is the mid-tone skin colour %s made darker until a white label reads on it at 4.5:1',
            skinColor => {
                const fill = createPneBrandRamp(skinColor)[600]

                expect(contrastWithWhite(skinColor)).toBeLessThan(4.5)
                expect(fill).not.toBe(skinColor.toUpperCase())
                expect(contrastWithWhite(fill)).toBeGreaterThanOrEqual(4.5)
            },
        )

        it('takes the old UI Kit blue to the lightness of the new one', () => {
            expect(createPneBrandRamp('#007dff')[600]).toBe('#006CDF')
        })
    })

    it('keeps the hover and pressed steps of a dark skin apart from its fill', () => {
        const ramp = createPneBrandRamp('#4c176e')

        expect(getContrastRatio(ramp[600], ramp[700])).toBeGreaterThanOrEqual(1.15)
        expect(getContrastRatio(ramp[700], ramp[800])).toBeGreaterThanOrEqual(1.15)
    })

    it('has nothing darker than black, so a black skin gets its lighter steps under the pointer', () => {
        const ramp = createPneBrandRamp('#000000')

        expect([ramp[700], ramp[800], ramp[950]]).toEqual(['#000000', '#000000', '#000000'])
        expect([ramp[500], ramp[400]]).toEqual(['#252525', '#606060'])
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
        expect(createPneBrandRamp('#147')[600]).toBe('#114477')
        expect(createPneBrandRamp('')).toEqual(createPneBrandRamp('#FF00DC'))
        expect(createPneBrandRamp('blue')).toEqual(createPneBrandRamp('#FF00DC'))
    })
})
