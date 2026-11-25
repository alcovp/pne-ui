import type {CSSObject} from '@mui/material/styles'

/**
 * A one-line label in a box of a fixed height: a button, a chip, a tile.
 *
 * A browser centres the line of the label, not its letters. Where the letters stand inside the line comes from
 * the ascent and the descent of the font, and Chrome rounds both at every screen scale. At a scale of 125 % the
 * letters of a 14/20 label end up 2px over the middle of a 32px button, at 150 % 1px over it; at 100 % nothing
 * shows, which is why a screenshot taken at 100 % looks right.
 *
 * `text-box` trims the line to the band of capital letters, from the cap height down to the baseline, so the
 * browser centres the letters themselves and the rounding of the font metrics no longer matters. A browser
 * without `text-box` (Firefox for now) keeps the old way.
 */
export const PNE_LABEL_TRIM_SUPPORT = '@supports (text-box: trim-both cap alphabetic)'

/** For the element that holds the text of the label itself. */
export const PNE_LABEL_TRIM: CSSObject = {textBox: 'trim-both cap alphabetic'}

/**
 * The `vertical-align` of an inline icon of `size` px beside a trimmed label: its middle stands on the middle of
 * the capital band.
 */
export const pneIconOnCapitals = (size: number | string): string =>
    `calc((1cap - ${typeof size === 'number' ? `${size}px` : size}) / 2)`
