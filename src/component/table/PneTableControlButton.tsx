import React, {forwardRef} from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {ButtonBase, ButtonBaseProps, SxProps, Theme} from '@mui/material'
import {createTableControlTextButtonStyle} from './tableControlButtonStyle'
import {
    TABLE_CONTROL_DISABLED_TEXT_COLOR,
    TABLE_CONTROL_HOVER_TEXT_COLOR,
} from './tableControlColors'

export type PneTableControlButtonProps = Omit<ButtonBaseProps, 'children' | 'sx'> & {
    children: React.ReactNode
    /** Adds the 16px chevron of a menu trigger after the label. */
    menu?: boolean
    /**
     * `strong` gives an enabled button the darker grey, for the action the band is about, such as the
     * bulk actions of a selection. A disabled button looks the same either way.
     */
    emphasis?: 'normal' | 'strong'
    sx?: SxProps<Theme>
}

/**
 * A text button of the table bands: selection actions, a bulk actions menu. It looks like the views of
 * `PneTableViewSelector` - 32px, no border, no shadow, the control greys - and ignores the skin, so a
 * band reads as one strip of controls whatever the application colours are.
 */
const PneTableControlButton = forwardRef<HTMLButtonElement, PneTableControlButtonProps>(
    function PneTableControlButton(props, ref) {
        const {
            children,
            emphasis = 'normal',
            menu = false,
            sx,
            ...buttonProps
        } = props

        return <ButtonBase
            {...buttonProps}
            ref={ref}
            sx={[
                theme => ({
                    ...createTableControlTextButtonStyle(theme),
                    flexShrink: 0,
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    ...(menu ? {paddingRight: '6px'} : {}),
                    ...(emphasis === 'strong'
                        ? {color: theme.palette.pne?.control.foregroundHover ?? TABLE_CONTROL_HOVER_TEXT_COLOR}
                        : {}),
                    '&.Mui-disabled': {
                        color: theme.palette.pne?.control.foregroundDisabled ?? TABLE_CONTROL_DISABLED_TEXT_COLOR,
                    },
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
            {menu ? <ExpandMoreIcon aria-hidden sx={{fontSize: '16px'}}/> : null}
        </ButtonBase>
    },
)

export default PneTableControlButton
