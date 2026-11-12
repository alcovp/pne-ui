import * as React from 'react'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {createSvgIcon, type MenuProps, type SvgIconProps} from '@mui/material'
import {keyframes} from '@mui/material/styles'
import type {PneCheckboxStateColors} from '../../checkboxPalette'
import {resolvePneSemanticPalette} from '../../createTheme'
import type {PneDropdownPalette} from '../../dropdownPalette'
import {PNE_FIELD_SIZE, PNE_FIELD_SIZES, PNE_LIST_MAX_ROWS, type PneFieldSize} from '../fieldSize'

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
})

// UI Kit IcStatusWarning before the text of a failed load.
const WARNING_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E'
    + '%3Cpath d=\'M12 4.5 3.5 19h17L12 4.5ZM12 10v4.5M12 17v.2\' fill=\'none\' stroke=\'%23000\' '
    + 'stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\'/%3E%3C/svg%3E")'

const spinnerRotation = keyframes({
    from: {transform: 'rotate(0deg)'},
    to: {transform: 'rotate(360deg)'},
})

// The glyphs of a list stop at 16px: the large list keeps the icons of the medium one.
const listIcon = (size: PneFieldSize): number => Math.min(PNE_FIELD_SIZE[size].icon, 16)

// The panel shows eight rows, then scrolls; 4px of its inset stand above and below them.
const listMaxHeight = (size: PneFieldSize): string => `${PNE_FIELD_SIZE[size].height * PNE_LIST_MAX_ROWS + 8}px`

// A row is as high as the field of its size and carries the text of that field (UI Kit Dropdown/Option).
const rowSizeStyle = (size: PneFieldSize): SystemStyleObject<Theme> => {
    const config = PNE_FIELD_SIZE[size]
    return {
        fontSize: `${config.fontSize}px`,
        lineHeight: `${config.lineHeight}px`,
        minHeight: `${config.height}px`,
        padding: `${(config.height - config.lineHeight) / 2}px ${config.paddingInline}px`,
    }
}

const checkSizeStyle = (size: PneFieldSize): SystemStyleObject<Theme> => {
    const icon = `${listIcon(size)}px`
    return {
        height: icon,
        maskSize: `${icon} ${icon}`,
        WebkitMaskSize: `${icon} ${icon}`,
        width: icon,
    }
}

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
 * inner ring, popover shadow, eight rows and then a scroll) and its option rows (radius 4, hover and
 * keyboard highlight, the picked row tinted with a check at the end, disabled text without MUI's
 * opacity). A row is as high as the field: `data-pne-size` on the menu root picks 24, 32 or 40px.
 * `data-pne-state="hover"` on an option pins the highlight for specimens.
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
    return Object.assign(rules, ...PNE_FIELD_SIZES.map(menuSizeRules))
}

const menuSizeRules = (size: PneFieldSize): Rules => {
    const root = `&[data-pne-size="${size}"]`
    return {
        [`${root} .MuiMenu-paper`]: {maxHeight: `min(calc(100% - 96px), ${listMaxHeight(size)})`},
        [`${root} .MuiMenuItem-root`]: rowSizeStyle(size),
        [`${root} .MuiMenuItem-root.Mui-selected::after`]: checkSizeStyle(size),
    }
}

/**
 * The UI Kit Dropdown list look on a select's menu, in the size of its field; it goes first, so the
 * consumer's menu `sx` still wins.
 */
export const withPneDropdownMenuLook = (
    menuProps: Partial<MenuProps> | undefined,
    size: PneFieldSize,
): Partial<MenuProps> => {
    const consumerSx = menuProps?.sx

    return {
        'data-pne-size': size,
        ...menuProps,
        sx: [pneDropdownMenuSx, ...(Array.isArray(consumerSx) ? consumerSx : [consumerSx])],
    } as Partial<MenuProps>
}

/**
 * The colour of the select field's chevron, and the size of the UI Kit one: 14px; the field look
 * puts it in the middle of the icon button of its size.
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
            // MUI centres its own 24px icon; this one is smaller.
            top: 'calc(50% - 7px)',
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
 * rows instead of tinting the picked ones; group captions split by a hairline and the service rows
 * (loading with a spinner, nothing found, a failed load with a warning sign when the paper has
 * `data-pne-status="error"`). `data-pne-size` on the paper picks the rows of the field's size.
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
            backgroundImage: checkboxImage(checkbox.off.default, false),
            backgroundRepeat: 'no-repeat',
        },
        [`${AC_MULTI}[aria-selected="true"]::before`]: {backgroundImage: checkboxImage(checkbox.on.default, true)},
        [`${AC_MULTI}[aria-disabled="true"]::before`]: {backgroundImage: checkboxImage(checkbox.off.disabled, false)},
        [`${AC_MULTI}[aria-disabled="true"][aria-selected="true"]::before`]: {
            backgroundImage: checkboxImage(checkbox.on.disabled, true),
        },
        '& .MuiAutocomplete-groupLabel': {
            alignItems: 'flex-end',
            backgroundColor: dropdown.panel.fill,
            boxSizing: 'border-box',
            color: dropdown.status.text,
            display: 'flex',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '16px',
        },
        // Groups are split by a hairline, as in the UI Kit list.
        [GROUP_AFTER_GROUP]: {
            borderTop: `1px solid ${dropdown.panel.ring}`,
            marginTop: '4px',
        },
        '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
            alignItems: 'center',
            boxSizing: 'border-box',
            color: dropdown.status.text,
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            textAlign: 'center',
        },
        // UI Kit Spinner: three quarters of a ring in the brand colour.
        '& .MuiAutocomplete-loading::before': {
            animation: `${spinnerRotation} 800ms linear infinite`,
            border: `1.5px solid ${dropdown.option.check}`,
            borderRadius: '50%',
            borderRightColor: 'transparent',
            boxSizing: 'border-box',
            content: '""',
            flexShrink: 0,
            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
            },
        },
        '&[data-pne-status="error"] .MuiAutocomplete-noOptions': {
            color: dropdown.status.error,
            justifyContent: 'flex-start',
            textAlign: 'left',
        },
        '&[data-pne-status="error"] .MuiAutocomplete-noOptions::before': {
            backgroundColor: 'currentColor',
            content: '""',
            flexShrink: 0,
            mask: `${WARNING_MASK} center / contain no-repeat`,
            WebkitMask: `${WARNING_MASK} center / contain no-repeat`,
        },
    }
    return Object.assign({}, panelStyle(dropdown), rules, ...PNE_FIELD_SIZES.map(paperSizeRules))
}

const GROUP_AFTER_GROUP = `${AC_LISTBOX} > li + li .MuiAutocomplete-groupLabel`

const paperSizeRules = (size: PneFieldSize): Rules => {
    const config = PNE_FIELD_SIZE[size]
    const root = `&[data-pne-size="${size}"]`
    const icon = `${listIcon(size)}px`
    const box = `${config.checkbox}px`
    const listbox = `${root} .MuiAutocomplete-listbox`
    const option = `${listbox} .MuiAutocomplete-option`
    const multiOption = `${listbox}[aria-multiselectable="true"]:not([data-pne-rows="own"]) .MuiAutocomplete-option`
    const status = `${root} .MuiAutocomplete-noOptions, ${root} .MuiAutocomplete-loading`
    const statusIcon = `${root} .MuiAutocomplete-loading::before, `
        + `${root}[data-pne-status="error"] .MuiAutocomplete-noOptions::before`
    return {
        [listbox]: {maxHeight: listMaxHeight(size)},
        [option]: rowSizeStyle(size),
        [`${option}[aria-selected="true"]::after`]: checkSizeStyle(size),
        [`${multiOption}::before`]: {
            backgroundSize: `${box} ${box}`,
            height: box,
            marginRight: `${config.gap}px`,
            width: box,
        },
        [`${root} .MuiAutocomplete-groupLabel`]: {
            height: `${config.groupHeight}px`,
            padding: `0 ${config.paddingInline}px 4px`,
        },
        // The hairline and the 4px over the caption add to its height.
        [`${root} .MuiAutocomplete-listbox > li + li .MuiAutocomplete-groupLabel`]: {
            height: `${config.groupHeight + 5}px`,
        },
        // A service row is two rows high and stands in the 4px inset of the panel.
        [status]: {
            fontSize: `${config.fontSize}px`,
            lineHeight: `${config.lineHeight}px`,
            minHeight: `${config.height * 2 + 8}px`,
            padding: `12px ${config.paddingInline + 4}px`,
        },
        [statusIcon]: {
            height: icon,
            width: icon,
        },
    }
}

/**
 * The field side of an autocomplete, set on its root: the UI Kit chevron and clear cross at 14px in
 * the colour of the value (`PneAutocomplete-icon` marks ours, so a consumer's icon keeps its size),
 * the picked values as UI Kit badges (tone surface: radius 4, white with a Neutral/200 ring, a thin
 * remove cross) and the loading spinner in the brand colour that reads on the page. `data-pne-size`
 * on the root picks the geometry of the UI Kit field: the text paddings, the icon buttons at the end
 * and, in a multiple field (`data-pne-multiple`), badges 8px lower than the box with 4px around them.
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
        '& .MuiAutocomplete-endAdornment': {
            alignItems: 'center',
            display: 'flex',
            gap: '4px',
        },
        '& .MuiAutocomplete-endAdornment .MuiIconButton-root': {
            margin: 0,
            padding: 0,
        },
        '& .MuiAutocomplete-endAdornment .PneAutocomplete-icon': {
            fontSize: '14px',
        },
        '& .MuiAutocomplete-tag.MuiChip-root': {
            backgroundColor: chip.fill,
            borderRadius: '4px',
            boxShadow: `inset 0 0 0 1px ${chip.ring}`,
            color: chip.text,
            margin: 0,
            maxWidth: '100%',
        },
        '& .MuiAutocomplete-tag.MuiChip-root.Mui-focusVisible': {
            boxShadow: `inset 0 0 0 1px ${chip.ring}, 0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`,
        },
        '& .MuiAutocomplete-tag .MuiChip-label': {
            padding: 0,
        },
        // MUI pulls its delete icon over the label's padding; the badge spaces them by its gap.
        '& .MuiAutocomplete-tag .MuiChip-deleteIcon': {
            flexShrink: 0,
            margin: 0,
        },
        '& .MuiAutocomplete-tag .MuiChip-deleteIcon.PneAutocomplete-icon': {
            color: chip.remove,
        },
        '& .MuiAutocomplete-tag .MuiChip-deleteIcon.PneAutocomplete-icon:hover': {
            color: chip.text,
        },
        '& .MuiAutocomplete-inputRoot > .MuiCircularProgress-root': {
            color: option.check,
            flexShrink: 0,
        },
    }
    return Object.assign(rules, ...PNE_FIELD_SIZES.map(autocompleteFieldSizeRules))
}

// MUI sets the paddings of an autocomplete's box by long selectors (variant, size, hidden label, the
// icons it has); the doubled root class outranks them all.
const autocompleteFieldSizeRules = (size: PneFieldSize): Rules => {
    const config = PNE_FIELD_SIZE[size]
    const root = `&&&[data-pne-size="${size}"]`
    const multiple = `${root}[data-pne-multiple]`
    const box = '.MuiAutocomplete-inputRoot'
    const paddingBlock = (config.height - config.lineHeight) / 2
    const chipInset = (config.height - config.chip.height) / 2
    const oneButton = config.paddingEnd + config.iconButton + config.gap
    const twoButtons = oneButton + config.iconButton + 4
    const chipCross = (config.chip.remove - config.chip.cross) / 2
    return {
        [`${root} ${box}`]: {padding: 0},
        [`${root}.MuiAutocomplete-hasPopupIcon ${box}, ${root}.MuiAutocomplete-hasClearIcon ${box}`]: {
            paddingRight: `${oneButton}px`,
        },
        [`${root}.MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon ${box}`]: {
            paddingRight: `${twoButtons}px`,
        },
        [`${root} ${box} .MuiAutocomplete-input`]: {
            padding: `${paddingBlock}px 0 ${paddingBlock}px ${config.paddingInline}px`,
        },
        [`${root} .MuiAutocomplete-endAdornment`]: {
            right: `${config.paddingEnd}px`,
        },
        [`${root} .MuiAutocomplete-endAdornment .MuiIconButton-root`]: {
            height: `${config.iconButton}px`,
            width: `${config.iconButton}px`,
        },
        // A multiple field: the badges wrap with 4px between and around them.
        [`${multiple} ${box}`]: {
            gap: '4px',
            paddingBottom: `${chipInset}px`,
            paddingLeft: `${chipInset}px`,
            paddingTop: `${chipInset}px`,
        },
        [`${multiple} ${box} .MuiAutocomplete-input`]: {
            padding: `${(config.chip.height - config.lineHeight) / 2}px 0 ${(config.chip.height - config.lineHeight) / 2}px `
                + `${config.paddingInline - chipInset}px`,
        },
        [`${root} .MuiAutocomplete-tag.MuiChip-root`]: {
            fontSize: `${config.fontSize}px`,
            gap: `${config.chip.gap}px`,
            height: `${config.chip.height}px`,
            lineHeight: `${config.lineHeight}px`,
            padding: `0 ${Math.max(2, config.chip.paddingInline - 4)}px 0 ${config.chip.paddingInline}px`,
        },
        [`${root} .MuiAutocomplete-tag .MuiChip-deleteIcon.PneAutocomplete-icon`]: {
            fontSize: `${config.chip.cross}px`,
            padding: `${chipCross}px`,
        },
    }
}
