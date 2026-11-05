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

/** Hue in degrees, saturation and lightness in 0…1. */
export const hexToHsl = (color: string): [number, number, number] => {
    const [red, green, blue] = hexToRgb(color).map(channel => channel / 255)
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const lightness = (max + min) / 2
    if (max === min) return [0, 0, lightness]

    const delta = max - min
    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    const hue = max === red
        ? 60 * (((green - blue) / delta + 6) % 6)
        : max === green
            ? 60 * ((blue - red) / delta + 2)
            : 60 * ((red - green) / delta + 4)
    return [hue, saturation, lightness]
}

export const hslToHex = (hue: number, saturation: number, lightness: number): string => {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
    const sector = hue / 60
    const second = chroma * (1 - Math.abs(sector % 2 - 1))
    const [red, green, blue] = sector < 1 ? [chroma, second, 0]
        : sector < 2 ? [second, chroma, 0]
            : sector < 3 ? [0, chroma, second]
                : sector < 4 ? [0, second, chroma]
                    : sector < 5 ? [second, 0, chroma]
                        : [chroma, 0, second]
    const offset = lightness - chroma / 2
    return rgbToHex((red + offset) * 255, (green + offset) * 255, (blue + offset) * 255)
}
