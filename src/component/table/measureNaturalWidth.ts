/**
 * Width an element needs to lay its content out on a single row.
 *
 * This is deliberately *not* the measurement that made the control bands flap
 * before. That code measured the elements it had just laid out, so the answer
 * described the space the band had already been given and every fit check was
 * self-confirming; with two such bands measuring each other, fractional CSS
 * pixels were enough to start an endless ResizeObserver cycle.
 *
 * A natural width does not depend on the space offered: it is a property of the
 * content alone. A layout decision taken from it therefore cannot feed back into
 * the measurement, which is what lets the bands place their rows from CSS and
 * measure only when their content changes - never on resize.
 *
 * The element is measured in place, by briefly taking it out of flow rather than
 * by cloning it into `document.body`. A clone leaves inherited styles and
 * ancestor selectors behind, so it measures a different element than the one on
 * screen; taken out of flow, the element keeps its own cascade. Callers must run
 * this inside `useLayoutEffect`, where the swap happens before paint.
 */
export const measureNaturalWidth = (element: HTMLElement | null | undefined): number => {
    if (!element) {
        return 0
    }

    const savedCssText = element.style.cssText

    Object.assign(element.style, {
        left: '-99999px',
        maxWidth: 'none',
        position: 'fixed',
        top: '0',
        visibility: 'hidden',
        width: 'max-content',
    })

    const naturalWidth = element.getBoundingClientRect().width

    element.style.cssText = savedCssText

    return naturalWidth
}
