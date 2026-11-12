/** The sizes of a field (UI Kit Fields): small 24px, medium 32px (the default), large 40px. */
export type PneFieldSize = 'small' | 'medium' | 'large'

export const PNE_FIELD_DEFAULT_SIZE: PneFieldSize = 'medium'

export type PneFieldSizeConfig = {
    /** The height of the box and of a row in the list that opens under it. */
    height: number
    fontSize: number
    lineHeight: number
    /** From the edge of the box to the text. */
    paddingInline: number
    /** From the icons at the end of the box to its edge. */
    paddingEnd: number
    /** Between the text and an icon or a label inside the box. */
    gap: number
    icon: number
    /** The button of the chevron and of the clear cross. */
    iconButton: number
    /** A picked value inside the box (UI Kit Badge): the field less 8px. */
    chip: {height: number, paddingInline: number, gap: number, remove: number, cross: number}
    /** The box of PneCheckbox in a row of a multiple list. */
    checkbox: number
    /** The caption of a group in the list. */
    groupHeight: number
}

export const PNE_FIELD_SIZE: Record<PneFieldSize, PneFieldSizeConfig> = {
    small: {
        height: 24, fontSize: 12, lineHeight: 16, paddingInline: 8, paddingEnd: 4, gap: 4, icon: 14, iconButton: 16,
        chip: {height: 16, paddingInline: 4, gap: 4, remove: 12, cross: 12}, checkbox: 14, groupHeight: 20,
    },
    medium: {
        height: 32, fontSize: 14, lineHeight: 20, paddingInline: 8, paddingEnd: 6, gap: 8, icon: 16, iconButton: 20,
        chip: {height: 24, paddingInline: 8, gap: 4, remove: 16, cross: 14}, checkbox: 16, groupHeight: 24,
    },
    large: {
        height: 40, fontSize: 14, lineHeight: 20, paddingInline: 12, paddingEnd: 10, gap: 8, icon: 18, iconButton: 20,
        chip: {height: 32, paddingInline: 10, gap: 6, remove: 18, cross: 16}, checkbox: 20, groupHeight: 28,
    },
}

export const PNE_FIELD_SIZES = Object.keys(PNE_FIELD_SIZE) as PneFieldSize[]

/** Any other value (MUI's own sizes included) falls back to the default size. */
export const resolvePneFieldSize = (size: unknown): PneFieldSize =>
    size === 'small' || size === 'medium' || size === 'large' ? size : PNE_FIELD_DEFAULT_SIZE

/** The list under a field shows this many rows, then scrolls (UI Kit Dropdown list). */
export const PNE_LIST_MAX_ROWS = 8
