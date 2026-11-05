import {hexToHsl, hexToRgb, hslToHex, normalizeHexColor, rgbToHex} from './color'

/** Steps of the brand ramp as in UI Kit (Claude): 0 is white, 500 is the skin colour, 1000 the darkest. */
export const PNE_BRAND_RAMP_STEPS = [
    0, 50, 100, 150, 200, 300, 400, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
] as const

export type PneBrandRampStep = typeof PNE_BRAND_RAMP_STEPS[number]

export type PneBrandRamp = Readonly<Record<PneBrandRampStep, string>>

// UI Kit mixes its seed with white for the lighter steps and with step 1000 for the darker ones.
const WHITE_SHARE: Partial<Record<PneBrandRampStep, number>> = {
    0: 1, 50: 0.95, 100: 0.8, 150: 0.7, 200: 0.6, 300: 0.4, 400: 0.2,
}
const ANCHOR_SHARE: Partial<Record<PneBrandRampStep, number>> = {
    550: 0.1, 600: 0.2, 650: 0.3, 700: 0.4, 750: 0.5, 800: 0.6, 850: 0.7, 900: 0.8, 950: 0.95, 1000: 1,
}

// UI Kit's step 1000 for its seed #007DFF is #2E445B: the seed's hue at 45/137 of its
// saturation and 137/255 of its lightness. Scaling keeps the same relation for any skin.
const ANCHOR_SATURATION = 45 / 137
const ANCHOR_LIGHTNESS = 137 / 255

// UI Kit rounds halves to even (green of #007DFF step 50 is 248.5 → 248), so the ramp does too.
const roundHalfToEven = (value: number): number => {
    const floor = Math.floor(value)
    if (Math.abs(value - floor - 0.5) > 1e-9) return Math.round(value)
    return floor % 2 === 0 ? floor : floor + 1
}

const mix = (color: string, target: string, share: number): string => {
    const source = hexToRgb(color)
    const goal = hexToRgb(target)
    const [red, green, blue] = source.map((channel, index) =>
        roundHalfToEven(channel + (goal[index] - channel) * share))
    return rgbToHex(red, green, blue)
}

/**
 * Builds the brand ramp from the one colour a Paynet skin has (`experimentalColor`), the way
 * UI Kit builds its own: the skin colour is step 500. For the UI Kit seed #007DFF the result
 * is exactly the UI Kit brand ramp.
 */
export const createPneBrandRamp = (skinColor: string): PneBrandRamp => {
    const seed = normalizeHexColor(skinColor)
    const [hue, saturation, lightness] = hexToHsl(seed)
    const anchor = hslToHex(hue, saturation * ANCHOR_SATURATION, lightness * ANCHOR_LIGHTNESS)

    const entries = PNE_BRAND_RAMP_STEPS.map(step => {
        const whiteShare = WHITE_SHARE[step]
        if (whiteShare !== undefined) return [step, mix(seed, '#FFFFFF', whiteShare)]
        return [step, mix(seed, anchor, ANCHOR_SHARE[step] ?? 0)]
    })
    return Object.freeze(Object.fromEntries(entries)) as PneBrandRamp
}
