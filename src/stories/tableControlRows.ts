/**
 * Geometry helpers for the responsive table control bands.
 *
 * The bands carry no layout state to assert against: they are laid out by CSS
 * from the width their parent offers and from the intrinsic width of their
 * content. The only thing worth asserting is therefore the geometry a user
 * actually sees - which control shares a row with which, and whether the band
 * keeps still.
 */

/** True when two controls are laid out on the same visual row. */
export const sharesRow = (first: HTMLElement, second: HTMLElement): boolean => {
    const firstRect = first.getBoundingClientRect()
    const secondRect = second.getBoundingClientRect()

    return Math.min(firstRect.bottom, secondRect.bottom)
        - Math.max(firstRect.top, secondRect.top) > 0
}

/**
 * Height signature of the given bands. Flapping showed up as a band growing and
 * shrinking by a whole row between frames, so a signature that stays constant
 * across frames is exactly the property the regression stories need.
 */
export const heightSignature = (...bands: HTMLElement[]): string => bands
    .map(band => Math.round(band.getBoundingClientRect().height))
    .join('/')
