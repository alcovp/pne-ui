/**
 * CSSOM integer measurements such as clientWidth/scrollWidth can disagree with
 * fractional DOMRect widths by less than one CSS pixel. Treat that difference
 * as fitting so nested responsive controls cannot oscillate at a rounding edge.
 */
export const TABLE_LAYOUT_MEASUREMENT_TOLERANCE = 1

/**
 * Extra width a stacked control band must regain before it returns to a wider
 * layout. A layout switch changes the band height, which can add or remove the
 * document scrollbar and therefore change the available width by up to a
 * scrollbar. Without this dead zone those two effects chase each other every
 * frame and the whole table jumps.
 */
export const TABLE_LAYOUT_HYSTERESIS = 24

export const measuredLayoutWidthFits = (
    requiredWidth: number,
    availableWidth: number,
): boolean => requiredWidth < availableWidth + TABLE_LAYOUT_MEASUREMENT_TOLERANCE

/**
 * Width a control group needs to render on a single row, independent of the
 * layout it currently renders in.
 *
 * Reading `scrollWidth`/`getBoundingClientRect()` off the live element only
 * reports how wide it *already* is: once the group has been squeezed, wrapped or
 * ellipsised into the space it was given, its measured width equals that space
 * and every fit check becomes tautological. The off-screen clone is therefore
 * forced into an unconstrained single row, and grid/flow containers are
 * normalised to a non-wrapping flex row so the result does not depend on the
 * responsive state the caller is trying to decide.
 */
export const measureSingleRowWidth = (
    element: HTMLElement | null | undefined,
    ownerDocument?: Document | null,
): number => {
    if (!element) {
        return 0
    }

    const renderedWidth = Math.max(
        element.scrollWidth,
        element.getBoundingClientRect().width,
    )
    const measurementDocument = ownerDocument ?? element.ownerDocument

    if (!measurementDocument?.body) {
        return renderedWidth
    }

    const clone = element.cloneNode(true) as HTMLElement
    Object.assign(clone.style, {
        display: 'flex',
        flexWrap: 'nowrap',
        height: 'auto',
        left: '-100000px',
        maxWidth: 'none',
        minWidth: '0',
        pointerEvents: 'none',
        position: 'fixed',
        top: '0',
        visibility: 'hidden',
        width: 'max-content',
    })
    clone.setAttribute('aria-hidden', 'true')
    measurementDocument.body.appendChild(clone)

    try {
        return Math.max(
            renderedWidth,
            clone.scrollWidth,
            clone.getBoundingClientRect().width,
        )
    } finally {
        clone.remove()
    }
}

/**
 * Width available to a responsive band. The band itself is `width: max-content`
 * in its widest layout, so its own box only reports how much space its content
 * already took; the offered space lives on the parent.
 */
export const measureAvailableWidth = (element: HTMLElement | null): number => {
    if (!element) {
        return 0
    }

    const parent = element.parentElement
    const parentWidth = parent
        ? parent.clientWidth || parent.getBoundingClientRect().width
        : 0

    return parentWidth || element.clientWidth || element.getBoundingClientRect().width
}
