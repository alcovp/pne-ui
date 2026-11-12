import React, {forwardRef} from 'react'
import {IconButton, IconButtonProps, Tooltip} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import {pneIconActionSx} from '../iconActionLook'
import {PNE_STATUS_COLORS} from '../../themeColors'

export type PneTableActionTone = 'neutral' | 'danger'

export type PneTableActionProps = Omit<IconButtonProps, 'color' | 'edge' | 'size'> & {
    /** `danger` colours the icon red under the pointer: a removal. */
    tone?: PneTableActionTone
    /** Hint shown on hover and keyboard focus, also over a disabled action. */
    tooltip?: React.ReactNode
}

// UI Kit Icon action, tone danger: the same grey at rest, the error text colour under the pointer.
const dangerSx: SxProps<Theme> = theme => {
    const color = PNE_STATUS_COLORS.error[theme.palette.mode === 'dark' ? 300 : 700]
    return {
        '&:hover': {color},
        '&:active': {color},
    }
}

/**
 * One action of a row inside `PneTableActionsCell` (UI Kit Icon action sm): a 24px button with a
 * 14px icon and no background; the pointer colours only the icon. The icon is the child, as with
 * an icon button.
 */
const PneTableAction = forwardRef<HTMLButtonElement, PneTableActionProps>((props, ref) => {
    const {children, onClick, sx, tone = 'neutral', tooltip, ...rest} = props

    const button = <IconButton
        data-pne-tone={tone}
        disableRipple
        {...rest}
        onClick={event => {
            // The row may be clickable itself; the action belongs to the button.
            event.stopPropagation()
            onClick?.(event)
        }}
        ref={ref}
        sx={[
            pneIconActionSx('small'),
            ...(tone === 'danger' ? [dangerSx] : []),
            ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        type='button'
    >
        {children}
    </IconButton>

    if (tooltip === undefined || tooltip === null || typeof tooltip === 'boolean' || tooltip === '') {
        return button
    }

    return <Tooltip enterDelay={300} enterNextDelay={300} title={tooltip}>
        {/* A disabled button takes no pointer events: the wrapper hears the pointer for it. */}
        <span style={{display: 'inline-flex', flexShrink: 0}}>{button}</span>
    </Tooltip>
})

PneTableAction.displayName = 'PneTableAction'

export default PneTableAction
