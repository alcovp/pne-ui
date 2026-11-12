import React, {forwardRef, MouseEvent} from 'react'
import {Box} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../../createTheme'
import PneTableCell, {PneTableCellProps} from './PneTableCell'

type ActionDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneTableLinkActionProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick' | 'type'
> & ActionDataAttributes

export type PneTableLinkCellProps = PneTableCellProps & {
    /**
     * Makes the cell a pseudo link: its content is a button that acts in place (opens a popup,
     * filters by the value) instead of leading to another record. Without it the cell expects the
     * consumer's link (an `<a>`, the link of its router) as the content.
     */
    onAction?: (event: MouseEvent<HTMLButtonElement>) => void
    /** Props of the pseudo link's button: `disabled`, a locator, an accessible name. */
    actionProps?: PneTableLinkActionProps
}

// UI Kit Cell: Link - the value in the link colour with no underline; the pointer underlines it.
const linkCellSx: SxProps<Theme> = theme => {
    const link = resolvePneSemanticPalette(theme).link
    return {
        '& a': {
            color: link,
            textDecoration: 'none',
        },
        '& a:hover': {
            textDecoration: 'underline',
        },
    }
}

// UI Kit Cell: Pseudo link - the link colour over a 1px line of the same colour.
const pseudoLinkSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    return {
        appearance: 'none',
        background: 'none',
        border: 'none',
        borderBottom: `1px solid ${pne.link}`,
        borderRadius: 0,
        color: pne.link,
        cursor: 'pointer',
        font: 'inherit',
        // The line takes one of the 20px of the row's text.
        lineHeight: '19px',
        margin: 0,
        maxWidth: '100%',
        padding: 0,
        textAlign: 'inherit',
        // On the baseline an inline button makes the line of the row a pixel higher.
        verticalAlign: 'top',
        '&:focus-visible': {
            borderRadius: '2px',
            outline: `2px solid ${pne.focusRing}`,
            outlineOffset: '2px',
        },
        '&:disabled': {
            borderBottomColor: 'transparent',
            color: theme.palette.text.disabled,
            cursor: 'default',
        },
    }
}

/**
 * A cell whose value is a link (UI Kit Cell: Link and Cell: Pseudo link). A link leads to another
 * record: put the link of your router inside, the cell gives it the look. A pseudo link acts in
 * place: pass `onAction` and the content becomes an underlined button.
 */
const PneTableLinkCell = forwardRef<HTMLTableCellElement, PneTableLinkCellProps>((props, ref) => {
    const {actionProps, children, onAction, sx, ...rest} = props

    if (onAction) {
        return <PneTableCell data-pne-cell='pseudo-link' {...rest} ref={ref} sx={sx}>
            <Box
                {...actionProps}
                component='button'
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    // The row may be clickable itself; the action belongs to the cell.
                    event.stopPropagation()
                    onAction(event)
                }}
                sx={pseudoLinkSx}
                type='button'
            >
                {children}
            </Box>
        </PneTableCell>
    }

    return <PneTableCell
        data-pne-cell='link'
        {...rest}
        ref={ref}
        sx={[linkCellSx, ...(Array.isArray(sx) ? sx : [sx])] as PneTableCellProps['sx']}
    >
        {children}
    </PneTableCell>
})

PneTableLinkCell.displayName = 'PneTableLinkCell'

export default PneTableLinkCell
