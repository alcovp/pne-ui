/**
 * CSSOM integer measurements such as clientWidth/scrollWidth can disagree with
 * fractional DOMRect widths by less than one CSS pixel. Treat that difference
 * as fitting so nested responsive controls cannot oscillate at a rounding edge.
 */
export const TABLE_LAYOUT_MEASUREMENT_TOLERANCE = 1

export const measuredLayoutWidthFits = (
    requiredWidth: number,
    availableWidth: number,
): boolean => requiredWidth < availableWidth + TABLE_LAYOUT_MEASUREMENT_TOLERANCE
