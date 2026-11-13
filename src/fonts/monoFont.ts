import {ROBOTO_MONO_LATIN_400} from './robotoMonoLatin400'

/** The UI Kit mono font: digits of one width, so the numbers of a column stand under each other. */
export const PNE_MONO_FONT = '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

// The Latin subset of Google Fonts: what a number, an amount or a currency code is written with.
const LATIN_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,'
    + 'U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

let registered = false

/**
 * Registers Roboto Mono in the document, once. The font travels inside the library as a data URI,
 * so an application needs no font files, no bundler rule and no stylesheet of its own; a content
 * security policy has to allow `font-src data:`. Where the document cannot take a font (tests, old
 * browsers) the text stays in the next font of `PNE_MONO_FONT`.
 */
export const ensurePneMonoFont = (): void => {
    if (registered || typeof document === 'undefined' || typeof FontFace === 'undefined' || !document.fonts?.add) {
        return
    }
    registered = true
    try {
        document.fonts.add(new FontFace('Roboto Mono', `url(${ROBOTO_MONO_LATIN_400}) format("woff2")`, {
            style: 'normal',
            unicodeRange: LATIN_RANGE,
            weight: '400',
        }))
    } catch {
        // The fallback fonts of the stack take over.
    }
}
