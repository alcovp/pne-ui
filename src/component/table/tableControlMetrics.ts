/**
 * Height of a control of the table bands - page buttons, page sizes, views, selection actions - and
 * the width of the square ones: the small step of the PNE buttons (24/32/40), as the UI Kit draws the
 * controls of a table. WCAG 2.2 asks for at least 24px.
 */
export const TABLE_CONTROL_SIZE = 24

/**
 * Height of a band row and of a group shell: the pagination, the page sizes and the views stand in
 * shells that keep 4px around their 24px controls.
 */
export const TABLE_CONTROL_BAND_SIZE = 32

/** The inset of a group shell around its controls. */
export const TABLE_CONTROL_SHELL_PADDING = 4

/**
 * Space between neighbouring controls of one group, and between the rows a band wraps onto on a narrow
 * screen. Groups standing in one row keep 8px between them.
 */
export const TABLE_CONTROL_GAP = 4
