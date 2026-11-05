import * as React from 'react'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {createSvgIcon, type MenuProps, type SvgIconProps} from '@mui/material'
import type {PneCheckboxStateColors} from '../../checkboxPalette'
import {resolvePneSemanticPalette} from '../../createTheme'
import type {PneDropdownPalette} from '../../dropdownPalette'

const ChevronDownSvg = createSvgIcon(
    <path d='M6 9l6 5.8L18 9' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5}/>,
    'PneChevronDown',
)

/**
 * UI Kit IcChevronChevronDown in MUI's own select icon slot, so MUI places it and turns it over
 * while the list is open; `pneSelectIconSx` gives it the UI Kit size.
 */
export const PneChevronDownIcon = ({className, ...props}: SvgIconProps) =>
    <ChevronDownSvg {...props} className={className ? `${className} PneSelect-chevron` : 'PneSelect-chevron'}/>

/** UI Kit IcActionClose: the clear cross of a field and the remove cross of a value chip. */
export const PneCloseIcon = createSvgIcon(
    <path d='M5 5l14 14M19 5L5 19' fill='none' stroke='currentColor' strokeLinecap='round' strokeWidth={1.5}/>,
    'PneClose',
)

// UI Kit IcActionApprove, drawn by CSS on the picked row so the row keeps the consumer's content.
const CHECK_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E'
    + '%3Cpath d=\'M5 14l3.5 3.5L19 6.5\' fill=\'none\' stroke=\'%23000\' stroke-linecap=\'round\' '
    + 'stroke-linejoin=\'round\' stroke-width=\'1.5\'/%3E%3C/svg%3E")'

type Rules = Record<string, SystemStyleObject<Theme>>

const anyOf = (row: string, states: readonly string[]): string => states.map(state => `${row}${state}`).join(', ')

// The panel: radius 8, an inner ring and the popover shadow, 4px below the field.
const panelStyle = (dropdown: PneDropdownPalette): Record<string, string> => ({
    backgroundColor: dropdown.panel.fill,
    // MUI lightens a dark paper by its elevation; the panel keeps its own fill.
    backgroundImage: 'none',
    borderRadius: '8px',
    boxShadow: `inset 0 0 0 1px ${dropdown.panel.ring}, ${dropdown.panel.shadow}`,
    marginTop: '4px',
})

const rowStyle = (dropdown: PneDropdownPalette): SystemStyleObject<Theme> => ({
    borderRadius: '4px',
    color: dropdown.option.text,
    paddingLeft: '12px',
    paddingRight: '12px',
})

// The picked row of a single list: tinted, with the check at the end that keeps 8px from the label
// (the padding is outside the mask image).
const pickedRowStyle = (dropdown: PneDropdownPalette): SystemStyleObject<Theme> => ({
    backgroundColor: dropdown.option.selected,
    '&::after': {
        content: '""',
        boxSizing: 'content-box',
        flexShrink: 0,
        width: '16px',
        height: '16px',
        marginLeft: 'auto',
        paddingLeft: '8px',
        backgroundColor: dropdown.option.check,
        WebkitMask: `${CHECK_MASK} right center / 16px 16px no-repeat`,
        mask: `${CHECK_MASK} right center / 16px 16px no-repeat`,
    },
})

const disabledRowStyle = (dropdown: PneDropdownPalette): SystemStyleObject<Theme> => ({
    color: dropdown.option.disabled,
    opacity: 1,
})

const MENU_ITEM = '& .MuiMenuItem-root'
const MENU_HIGHLIGHT = [':hover', '.Mui-focusVisible', '[data-pne-state="hover"]'] as const

/**
 * The UI Kit Dropdown list look on a MUI Menu, set on the menu root: the panel (radius 8, 4px inset,
 * inner ring, popover shadow) and its option rows (radius 4, hover and keyboard highlight, the picked
 * row tinted with a check at the end, disabled text without MUI's opacity). Row height and text size
 * stay MUI's. `data-pne-state="hover"` on an option pins the highlight for specimens.
 */
export const pneDropdownMenuSx: SxProps<Theme> = theme => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    const highlight = {backgroundColor: dropdown.option.hover}
    const rules: Rules = {
        '& .MuiMenu-paper': panelStyle(dropdown),
        '& .MuiMenu-list': {padding: '4px'},
        [MENU_ITEM]: rowStyle(dropdown),
        [anyOf(MENU_ITEM, MENU_HIGHLIGHT)]: highlight,
        [`${MENU_ITEM}.Mui-selected`]: pickedRowStyle(dropdown),
        [anyOf(`${MENU_ITEM}.Mui-selected`, MENU_HIGHLIGHT)]: highlight,
        [`${MENU_ITEM}.Mui-disabled`]: disabledRowStyle(dropdown),
    }
    return rules
}

/** The UI Kit Dropdown list look on a select's menu; it goes first, so the consumer's menu `sx` still wins. */
export const withPneDropdownMenuLook = (menuProps: Partial<MenuProps> | undefined): Partial<MenuProps> => {
    const consumerSx = menuProps?.sx

    return {
        ...menuProps,
        sx: [pneDropdownMenuSx, ...(Array.isArray(consumerSx) ? consumerSx : [consumerSx])],
    }
}

/**
 * The colour of the select field's chevron, and the size of the UI Kit one: 14px with 10px to the
 * edge of the box, as the Input of the Claude design system draws it at the 40px height of our
 * small field (the Figma copy draws it larger).
 */
export const pneSelectIconSx: SxProps<Theme> = theme => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    return {
        '& .MuiSelect-icon': {
            color: dropdown.chevron.default,
        },
        '& .MuiSelect-icon.Mui-disabled': {
            color: dropdown.chevron.disabled,
        },
        '& .MuiSelect-icon.PneSelect-chevron': {
            fontSize: '14px',
            right: '10px',
        },
    }
}

// The 16px box of PneCheckbox (small) as an image, in the colours of one checkbox state.
const checkboxImage = (colors: PneCheckboxStateColors, checked: boolean): string => {
    const ring = colors.ring === 'transparent' ? colors.fill : colors.ring
    const mark = checked
        ? `<path d='M4.2 8.2 L6.6 10.6 L11.8 5.4' fill='none' stroke='${colors.mark}' stroke-linecap='round' `
            + 'stroke-linejoin=\'round\' stroke-width=\'1.5\'/>'
        : ''
    const svg = '<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'>'
        + `<rect x='1.75' y='1.75' width='12.5' height='12.5' rx='2.25' fill='${colors.fill}' stroke='${ring}' `
        + `stroke-width='1.5'/>${mark}</svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const AC_LISTBOX = '& .MuiAutocomplete-listbox'
const AC_OPTION = `${AC_LISTBOX} .MuiAutocomplete-option`
const AC_SINGLE_PICKED = `${AC_LISTBOX}:not([aria-multiselectable="true"]) .MuiAutocomplete-option[aria-selected="true"]`
// Rows rendered by the consumer (`renderOption`, marked on the listbox) may draw a checkbox of their
// own, so a multiple list draws the box only in its own rows and tints the picked consumer rows.
// (No `:has()` here: jsdom throws on it in getComputedStyle, which breaks Jest suites of consumers.)
const AC_MULTI_OWN_ROWS = `${AC_LISTBOX}[aria-multiselectable="true"][data-pne-rows="own"] .MuiAutocomplete-option[aria-selected="true"]`
const AC_MULTI = `${AC_LISTBOX}[aria-multiselectable="true"]:not([data-pne-rows="own"]) .MuiAutocomplete-option`
const AC_HIGHLIGHT = ['.Mui-focused', '.Mui-focusVisible', '[data-pne-state="hover"]'] as const
// MUI marks the picked option `Mui-focused` as soon as the list opens; a picked row goes grey only under
// the pointer or the keyboard, so it shows its own look on opening.
const AC_PICKED_HIGHLIGHT = [':hover', '.Mui-focusVisible', '[data-pne-state="hover"]'] as const

/**
 * The UI Kit Dropdown list look on the paper of a MUI Autocomplete (set on the paper itself): the
 * panel and rows of `pneDropdownMenuSx`; a multiple list draws a PneCheckbox box in each of its own
 * rows instead of tinting the picked ones; group captions and the service rows (loading, nothing
 * found, a failed load when the paper has `data-pne-status="error"`). Row height and text size stay
 * MUI's.
 */
export const pneAutocompletePaperSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const {checkbox, dropdown} = pne
    const highlight = {backgroundColor: dropdown.option.hover}
    const rules: Rules = {
        [AC_LISTBOX]: {padding: '4px'},
        [AC_OPTION]: rowStyle(dropdown),
        [anyOf(AC_OPTION, AC_HIGHLIGHT)]: highlight,
        [AC_SINGLE_PICKED]: pickedRowStyle(dropdown),
        [anyOf(AC_SINGLE_PICKED, AC_PICKED_HIGHLIGHT)]: highlight,
        [AC_MULTI_OWN_ROWS]: pickedRowStyle(dropdown),
        [anyOf(AC_MULTI_OWN_ROWS, AC_PICKED_HIGHLIGHT)]: highlight,
        [`${AC_MULTI}[aria-selected="true"]`]: {backgroundColor: 'transparent'},
        [anyOf(`${AC_MULTI}[aria-selected="true"]`, AC_PICKED_HIGHLIGHT)]: highlight,
        [`${AC_OPTION}[aria-disabled="true"]`]: disabledRowStyle(dropdown),
        [`${AC_MULTI}::before`]: {
            content: '""',
            flexShrink: 0,
            width: '16px',
            height: '16px',
            marginRight: '8px',
            backgroundImage: checkboxImage(checkbox.off.default, false),
            backgroundSize: '16px 16px',
        },
        [`${AC_MULTI}[aria-selected="true"]::before`]: {backgroundImage: checkboxImage(checkbox.on.default, true)},
        [`${AC_MULTI}[aria-disabled="true"]::before`]: {backgroundImage: checkboxImage(checkbox.off.disabled, false)},
        [`${AC_MULTI}[aria-disabled="true"][aria-selected="true"]::before`]: {
            backgroundImage: checkboxImage(checkbox.on.disabled, true),
        },
        '& .MuiAutocomplete-groupLabel': {
            backgroundColor: dropdown.panel.fill,
            color: dropdown.status.text,
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '16px',
            padding: '8px 12px 4px',
        },
        // Groups are split by a hairline, as in the UI Kit list.
        [`${AC_LISTBOX} > li + li .MuiAutocomplete-groupLabel`]: {
            borderTop: `1px solid ${dropdown.panel.ring}`,
            marginTop: '4px',
        },
        '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
            color: dropdown.status.text,
            textAlign: 'center',
        },
        '&[data-pne-status="error"] .MuiAutocomplete-noOptions': {
            color: dropdown.status.error,
            textAlign: 'left',
        },
    }
    return Object.assign({}, panelStyle(dropdown), rules)
}

/**
 * The field side of an autocomplete, set on its root: the UI Kit chevron and clear cross at 14px in
 * the colour of the value (`PneAutocomplete-icon` marks ours, so a consumer's icon keeps its size),
 * the picked values as UI Kit badges (tone surface: radius 4, white with a Neutral/200 ring, a thin
 * remove cross) and the loading spinner in the brand colour that reads on the page.
 */
export const pneAutocompleteFieldSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const {chip, chevron, option} = pne.dropdown
    const rules: Rules = {
        '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
            color: chevron.default,
        },
        '& .MuiAutocomplete-popupIndicator.Mui-disabled': {
            color: chevron.disabled,
        },
        '& .MuiAutocomplete-endAdornment .PneAutocomplete-icon': {
            fontSize: '14px',
        },
        '& .MuiAutocomplete-tag.MuiChip-root': {
            backgroundColor: chip.fill,
            borderRadius: '4px',
            boxShadow: `inset 0 0 0 1px ${chip.ring}`,
            color: chip.text,
        },
        '& .MuiAutocomplete-tag.MuiChip-root.Mui-focusVisible': {
            boxShadow: `inset 0 0 0 1px ${chip.ring}, 0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`,
        },
        '& .MuiAutocomplete-tag .MuiChip-deleteIcon.PneAutocomplete-icon': {
            color: chip.remove,
            fontSize: '14px',
            margin: '0 4px 0 -2px',
        },
        '& .MuiAutocomplete-tag .MuiChip-deleteIcon.PneAutocomplete-icon:hover': {
            color: chip.text,
        },
        '& .MuiAutocomplete-inputRoot > .MuiCircularProgress-root': {
            color: option.check,
        },
    }
    return rules
}
