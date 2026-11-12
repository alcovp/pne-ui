import {contrastRatio, hexToOklch, normalizeHexColor, oklchToHex} from './color'

/** Steps of the brand ramp as in UI Kit (Claude): 0 is white, 600 is the fill, 950 the darkest. */
export const PNE_BRAND_RAMP_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export type PneBrandRampStep = typeof PNE_BRAND_RAMP_STEPS[number]

export type PneBrandRamp = Readonly<Record<PneBrandRampStep, string>>

/** The UI Kit brand ramp. Its steps share one hue and go down in even OKLCH lightness. */
const UI_KIT_BRAND_RAMP: PneBrandRamp = Object.freeze({
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
})

const FILL_STEP = 600
const WHITE = '#FFFFFF'

/** A white label reads on a fill from this contrast on (WCAG AA). */
export const PNE_LABEL_CONTRAST = 4.5

/**
 * Below this contrast with white a skin colour is a light one: it stays the fill as it is and
 * carries a dark label. From it on the fill carries a white label.
 */
export const PNE_LIGHT_FILL_CONTRAST = 3

const [UI_KIT_FILL_LIGHTNESS, UI_KIT_FILL_CHROMA, UI_KIT_FILL_HUE] = hexToOklch(UI_KIT_BRAND_RAMP[FILL_STEP])

const LIGHTNESS_STEP = 0.005

/**
 * The fill of a skin, step 600. A skin colour on which a white label reads at 4.5:1 is the fill
 * itself, and so is a light one, which takes a dark label. A mid-tone in between goes down to the
 * lightness of the UI Kit fill, and further if white still does not read on it at 4.5:1.
 */
const createFill = (skinColor: string): string => {
    const whiteContrast = contrastRatio(skinColor, WHITE)
    if (whiteContrast >= PNE_LABEL_CONTRAST || whiteContrast < PNE_LIGHT_FILL_CONTRAST) return skinColor

    const [skinLightness, chroma, hue] = hexToOklch(skinColor)
    let lightness = Math.min(skinLightness, UI_KIT_FILL_LIGHTNESS)
    let fill = oklchToHex(lightness, chroma, hue)
    while (contrastRatio(fill, WHITE) < PNE_LABEL_CONTRAST && lightness > 0) {
        lightness -= LIGHTNESS_STEP
        fill = oklchToHex(lightness, chroma, hue)
    }
    return fill
}

/**
 * Builds the brand ramp from the one colour a Paynet skin has (`experimentalColor`): the UI Kit
 * brand ramp moved to the fill of the skin. The lighter steps keep their share of the way from the
 * fill to white. The darker ones keep their distance from the fill, or their ratio to it when that
 * is darker. Chroma and hue follow the fill the way the UI Kit steps follow the UI Kit fill. For
 * the UI Kit brand colour #026FD7 the result is exactly the UI Kit brand ramp.
 */
export const createPneBrandRamp = (skinColor: string): PneBrandRamp => {
    const fill = createFill(normalizeHexColor(skinColor))
    const [fillLightness, fillChroma, fillHue] = hexToOklch(fill)

    const entries = PNE_BRAND_RAMP_STEPS.map(step => {
        if (step === 0) return [step, WHITE]
        if (step === FILL_STEP) return [step, fill]

        const [lightness, chroma, hue] = hexToOklch(UI_KIT_BRAND_RAMP[step])
        const stepLightness = step < FILL_STEP
            ? 1 - (1 - fillLightness) * (1 - lightness) / (1 - UI_KIT_FILL_LIGHTNESS)
            : Math.max(0, Math.min(
                fillLightness - (UI_KIT_FILL_LIGHTNESS - lightness),
                fillLightness * lightness / UI_KIT_FILL_LIGHTNESS,
            ))
        return [step, oklchToHex(
            stepLightness,
            chroma * fillChroma / UI_KIT_FILL_CHROMA,
            fillHue + hue - UI_KIT_FILL_HUE,
        )]
    })
    return Object.freeze(Object.fromEntries(entries)) as PneBrandRamp
}
