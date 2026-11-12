/** Shown in place of a skin colour that is missing or not a hex colour, so the gap is visible. */
export const MISSING_COLOR = '#FF00DC'

export const normalizeHexColor = (value: string | undefined): string => {
    const color = value?.trim()
    if (!color) return MISSING_COLOR

    const shortMatch = /^#([0-9a-f]{3})$/i.exec(color)
    if (shortMatch) {
        return `#${shortMatch[1].split('').map(part => `${part}${part}`).join('')}`.toUpperCase()
    }

    return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : MISSING_COLOR
}

export const hexToRgb = (color: string): [number, number, number] => {
    const value = Number.parseInt(color.slice(1), 16)
    return [value >> 16, (value >> 8) & 255, value & 255]
}

export const rgbToHex = (red: number, green: number, blue: number): string =>
    `#${[red, green, blue]
        .map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase()

/** Moves `color` towards `target` by `amount` (0…1) in sRGB. */
export const mixHex = (color: string, target: string, amount: number): string => {
    const sourceChannels = hexToRgb(color)
    const targetChannels = hexToRgb(target)
    return rgbToHex(
        sourceChannels[0] + (targetChannels[0] - sourceChannels[0]) * amount,
        sourceChannels[1] + (targetChannels[1] - sourceChannels[1]) * amount,
        sourceChannels[2] + (targetChannels[2] - sourceChannels[2]) * amount,
    )
}

const toLinear = (channel: number): number => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const fromLinear = (value: number): number =>
    255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055)

/** WCAG relative luminance, 0 for black and 1 for white. */
export const relativeLuminance = (color: string): number => {
    const [red, green, blue] = hexToRgb(color).map(toLinear)
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** WCAG contrast ratio of two hex colours, 1…21. */
export const contrastRatio = (first: string, second: string): number => {
    const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
    const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
    return (lighter + 0.05) / (darker + 0.05)
}

type Triple = [number, number, number]

const linearToOklab = ([red, green, blue]: Triple): Triple => {
    const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
    const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
    const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
    return [
        0.2104542553 * long + 0.7936177850 * medium - 0.0040720468 * short,
        1.9779984951 * long - 2.4285922050 * medium + 0.4505937099 * short,
        0.0259040371 * long + 0.7827717662 * medium - 0.8086757660 * short,
    ]
}

const oklabToLinear = ([lightness, greenRed, blueYellow]: Triple): Triple => {
    const long = (lightness + 0.3963377774 * greenRed + 0.2158037573 * blueYellow) ** 3
    const medium = (lightness - 0.1055613458 * greenRed - 0.0638541728 * blueYellow) ** 3
    const short = (lightness - 0.0894841775 * greenRed - 1.2914855480 * blueYellow) ** 3
    return [
        4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
        -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
        -0.0041960863 * long - 0.7034186147 * medium + 1.7076147010 * short,
    ]
}

/** OKLCH: lightness 0…1, chroma from 0 (grey), hue in radians. */
export const hexToOklch = (color: string): Triple => {
    const [lightness, greenRed, blueYellow] = linearToOklab(hexToRgb(color).map(toLinear) as Triple)
    return [lightness, Math.hypot(greenRed, blueYellow), Math.atan2(blueYellow, greenRed)]
}

const GAMUT_TOLERANCE = 1e-7

const oklchToLinear = (lightness: number, chroma: number, hue: number): Triple =>
    oklabToLinear([lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)])

const fitsSrgb = (channels: Triple): boolean =>
    channels.every(channel => channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE)

/** The sRGB colour of an OKLCH one; a chroma the screen cannot show is reduced until it can. */
export const oklchToHex = (lightness: number, chroma: number, hue: number): string => {
    let channels = oklchToLinear(lightness, chroma, hue)
    if (!fitsSrgb(channels)) {
        let fitting = 0
        let excessive = chroma
        for (let iteration = 0; iteration < 30; iteration += 1) {
            const middle = (fitting + excessive) / 2
            if (fitsSrgb(oklchToLinear(lightness, middle, hue))) fitting = middle
            else excessive = middle
        }
        channels = oklchToLinear(lightness, fitting, hue)
    }
    const [red, green, blue] = channels.map(channel => fromLinear(Math.max(0, Math.min(1, channel))))
    return rgbToHex(red, green, blue)
}
