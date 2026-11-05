import * as React from 'react'
import type {SxProps, Theme} from '@mui/material/styles'
import {createSvgIcon, type MenuProps, type SvgIconProps} from '@mui/material'
import {resolvePneSemanticPalette} from '../../createTheme'

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

// UI Kit IcActionApprove, drawn by CSS on the picked row so the row keeps the consumer's content.
const CHECK_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E'
    + '%3Cpath d=\'M5 14l3.5 3.5L19 6.5\' fill=\'none\' stroke=\'%23000\' stroke-linecap=\'round\' '
    + 'stroke-linejoin=\'round\' stroke-width=\'1.5\'/%3E%3C/svg%3E")'

/**
 * The UI Kit Dropdown list look on a MUI Menu, set on the menu root: the panel (radius 8, 4px inset,
 * inner ring, popover shadow) and its option rows (radius 4, hover and keyboard highlight, the picked
 * row tinted with a check at the end, disabled text without MUI's opacity). Row height and text size
 * stay MUI's. `data-pne-state="hover"` on an option pins the highlight for specimens.
 */
export const pneDropdownMenuSx: SxProps<Theme> = theme => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    const highlight = {backgroundColor: dropdown.option.hover}
    return {
        '& .MuiMenu-paper': {
            backgroundColor: dropdown.panel.fill,
            // MUI lightens a dark paper by its elevation; the panel keeps its own fill.
            backgroundImage: 'none',
            borderRadius: '8px',
            boxShadow: `inset 0 0 0 1px ${dropdown.panel.ring}, ${dropdown.panel.shadow}`,
            // The panel stands 4px below the field.
            marginTop: '4px',
        },
        '& .MuiMenu-list': {
            padding: '4px',
        },
        '& .MuiMenuItem-root': {
            borderRadius: '4px',
            color: dropdown.option.text,
            paddingLeft: '12px',
            paddingRight: '12px',
        },
        '& .MuiMenuItem-root:hover, & .MuiMenuItem-root.Mui-focusVisible, & .MuiMenuItem-root[data-pne-state="hover"]': highlight,
        '& .MuiMenuItem-root.Mui-selected': {
            backgroundColor: dropdown.option.selected,
            // The check keeps 8px from the label: the padding is outside the mask image.
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
        },
        '& .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible, & .MuiMenuItem-root.Mui-selected[data-pne-state="hover"]': highlight,
        '& .MuiMenuItem-root.Mui-disabled': {
            color: dropdown.option.disabled,
            opacity: 1,
        },
    }
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
