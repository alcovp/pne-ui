import type {Components, CSSObject, Theme} from '@mui/material/styles'
import * as React from 'react'
import type {PneBrandRamp} from './brandRamp'
import type {PneButtonPalette} from './buttonPalette'
import {PneCloseIcon} from './component/PneCloseIcon'
import type {PneDropdownPalette} from './dropdownPalette'
import {PNE_DARK_COLORS, PNE_NEUTRAL_RAMP, PNE_STATUS_COLORS} from './themeColors'

/**
 * The look of the MUI `Chip` under the PNE UI theme (UI Kit Badge: radius 4, lead icon · label · ×).
 * The library has no chip of its own: `variant` and `color` of the MUI chip pick the UI Kit tone.
 *
 * | `variant`  | `color`                          | UI Kit tone                                         |
 * |------------|----------------------------------|-----------------------------------------------------|
 * | `filled`   | `default`                        | Neutral: a value or a tag outside a field           |
 * | `outlined` | `default`                        | Surface: the canvas fill in a ring                  |
 * | `filled`   | `primary`                        | Active: the picked chip of a toggle, the brand fill |
 * | `outlined` | `primary`                        | Surface with the brand ring and text                |
 * | `filled`   | `success`, `error`, `warning`    | A status tint with the status text                  |
 * | `filled`   | `info`, `secondary`              | Accent: the brand tint                              |
 * | `outlined` | a status colour                  | Surface with the status ring and text               |
 *
 * `size='medium'` (MUI's default) is the 32px chip of lists and table cells, `size='small'` the 24px
 * one. A chip with `onDelete` ends with the UI Kit cross; a clickable chip answers the pointer and
 * shows the focus ring. Chips inside a field of the library are drawn by the field (same tones).
 */
type ChipTone = {
    fill: string
    fillHover: string
    /** The 1px inset ring; none when empty. */
    ring?: string
    ringHover?: string
    text: string
    /** The lead icon and the cross at rest. */
    icon: string
    /** The square behind a hovered cross. */
    removeHover: string
}

export const PNE_CHIP_REMOVE_CLASS = 'PneChip-remove'

type ChipSize = 'small' | 'medium'

type ChipGeometry = {
    height: number
    paddingInline: number
    gap: number
    /** The lead icon. */
    glyph: number
    /** The remove button and the cross in it. */
    remove: number
    cross: number
}

// UI Kit Badge lg (lists outside fields) and md.
const GEOMETRY: Record<ChipSize, ChipGeometry> = {
    medium: {height: 32, paddingInline: 10, gap: 6, glyph: 16, remove: 18, cross: 16},
    small: {height: 24, paddingInline: 8, gap: 4, glyph: 14, remove: 16, cross: 14},
}

type ChipPaletteSource = {
    ramp: PneBrandRamp
    button: PneButtonPalette
    dropdown: PneDropdownPalette
    focusRing: string
    link: string
}

type StatusName = keyof typeof PNE_STATUS_COLORS

const STATUS_BY_COLOR: Partial<Record<string, StatusName>> = {error: 'error', success: 'success', warning: 'warning'}

const resolveTone = (
    pne: ChipPaletteSource,
    dark: boolean,
    variant: unknown,
    color: unknown,
): ChipTone => {
    const n = PNE_NEUTRAL_RAMP
    const d = PNE_DARK_COLORS
    const outlined = variant === 'outlined'
    const status = STATUS_BY_COLOR[String(color)]
    const brandRing = pne.focusRing
    const surface: ChipTone = dark
        ? {
            fill: pne.dropdown.chip.fill, fillHover: pne.dropdown.chip.fill, ring: pne.dropdown.chip.ring,
            ringHover: brandRing, text: d.textPrimary, icon: d.textSecondary, removeHover: pne.ramp[800],
        }
        : {
            fill: n[50], fillHover: n[50], ring: n[300], ringHover: brandRing, text: n[900], icon: n[600],
            removeHover: pne.ramp[200],
        }

    if (status) {
        const ramp = PNE_STATUS_COLORS[status]
        const text = dark ? ramp[300] : ramp[700]
        if (outlined) {
            return {...surface, ring: dark ? ramp[400] : ramp[600], ringHover: undefined, text, icon: text}
        }
        return dark
            ? {fill: ramp[900], fillHover: ramp[800], text, icon: text, removeHover: ramp[800]}
            : {fill: ramp[100], fillHover: ramp[200], text, icon: text, removeHover: ramp[200]}
    }
    if (color === 'primary') {
        if (outlined) {
            return {...surface, ring: brandRing, text: pne.link, icon: pne.link}
        }
        const primary = pne.button.primary
        return {
            fill: primary.default.fill, fillHover: primary.pressed.fill, text: primary.default.text,
            icon: primary.default.text, removeHover: primary.pressed.fill,
        }
    }
    if (color === 'info' || color === 'secondary') {
        const text = dark ? pne.ramp[300] : pne.ramp[700]
        return outlined
            ? {...surface, ring: brandRing, text, icon: text}
            : dark
                ? {fill: pne.ramp[900], fillHover: pne.ramp[800], text, icon: text, removeHover: pne.ramp[800]}
                : {fill: pne.ramp[100], fillHover: pne.ramp[200], text, icon: text, removeHover: pne.ramp[200]}
    }
    if (outlined) return surface
    return dark
        ? {fill: d.surfaceSubtle, fillHover: d.surfacePressed, text: d.textPrimary, icon: d.textSecondary, removeHover: d.surfacePressed}
        : {fill: n[100], fillHover: n[200], text: n[900], icon: n[600], removeHover: n[200]}
}

const ring = (color: string | undefined): string => color ? `inset 0 0 0 1px ${color}` : 'none'

const chipStyle = (
    theme: Theme,
    pne: ChipPaletteSource,
    size: ChipSize,
    tone: ChipTone,
    deletable: boolean,
    clickable: boolean,
): CSSObject => {
    const geometry = GEOMETRY[size]
    const focusRing = `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`
    const crossInset = (geometry.remove - geometry.cross) / 2
    const hover: CSSObject = {
        backgroundColor: tone.fillHover,
        boxShadow: ring(tone.ringHover ?? tone.ring),
    }

    return {
        backgroundColor: tone.fill,
        border: 0,
        borderRadius: '4px',
        boxShadow: ring(tone.ring),
        color: tone.text,
        fontSize: '14px',
        fontWeight: 400,
        height: `${geometry.height}px`,
        lineHeight: '20px',
        transition: 'background-color 120ms linear, box-shadow 120ms linear',
        '&.Mui-disabled': {opacity: 0.5},
        // Rules of the weight of MUI's own: a component of the library that paints its chips itself
        // (a SearchUI row) keeps its fill under the pointer.
        ...(clickable ? {'&:hover': hover, '&:active': {boxShadow: ring(tone.ringHover ?? tone.ring)}} : undefined),
        '&.Mui-focusVisible': {
            backgroundColor: tone.fill,
            boxShadow: [tone.ring ? ring(tone.ring) : undefined, focusRing].filter(Boolean).join(', '),
        },
        // One rule of the weight of MUI's own, so a component of the library that lays its chips out
        // itself (a field with values, a SearchUI row) still overrides it.
        '& .MuiChip-label': {
            paddingLeft: `${geometry.paddingInline}px`,
            paddingRight: `${deletable ? geometry.gap : geometry.paddingInline}px`,
        },
        '& .MuiChip-icon, & .MuiChip-avatar': {
            color: tone.icon,
            fontSize: `${geometry.glyph}px`,
            height: `${geometry.glyph}px`,
            marginLeft: `${geometry.paddingInline}px`,
            marginRight: `${geometry.gap - geometry.paddingInline}px`,
            width: `${geometry.glyph}px`,
        },
        '& .MuiChip-deleteIcon': {
            color: tone.icon,
        },
        '& .MuiChip-deleteIcon:hover, & .MuiChip-deleteIcon:active': {
            color: tone.text,
        },
        // The cross of the theme. A delete icon a component gives (the chevron of a SearchUI value, the
        // cross of a field of the library) keeps the geometry its component sets.
        [`& .MuiChip-deleteIcon.${PNE_CHIP_REMOVE_CLASS}`]: {
            borderRadius: '4px',
            boxSizing: 'border-box',
            fontSize: `${geometry.remove}px`,
            height: `${geometry.remove}px`,
            margin: `0 ${Math.max(2, geometry.paddingInline - 4)}px 0 0`,
            padding: `${crossInset}px`,
            transition: 'background-color 120ms linear, color 120ms linear',
            width: `${geometry.remove}px`,
        },
        [`& .MuiChip-deleteIcon.${PNE_CHIP_REMOVE_CLASS}:hover`]: {
            backgroundColor: tone.removeHover,
        },
    }
}

/**
 * The override is a plain map from the owner state to a style, like the button's: a table may hold
 * hundreds of chips, and each render only looks its style up.
 */
export const createPneChipOverrides = (
    resolvePalette: (theme: Theme) => ChipPaletteSource,
): NonNullable<Components<Theme>['MuiChip']> => ({
    defaultProps: {
        deleteIcon: <PneCloseIcon className={PNE_CHIP_REMOVE_CLASS}/>,
    },
    styleOverrides: {
        root: ({ownerState, theme}) => {
            const pne = resolvePalette(theme)
            return chipStyle(
                theme,
                pne,
                ownerState.size === 'small' ? 'small' : 'medium',
                resolveTone(pne, theme.palette.mode === 'dark', ownerState.variant, ownerState.color),
                Boolean(ownerState.onDelete),
                Boolean(ownerState.clickable),
            )
        },
    },
})
