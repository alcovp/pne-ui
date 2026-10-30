import React, {forwardRef} from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {ButtonBase, ButtonBaseProps, SxProps, Theme, Tooltip} from '@mui/material'
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
    /**
     * Hint shown on hover and keyboard focus, after the same 300ms as the table settings button. It also
     * shows on a disabled button, which is where an explanation is needed most.
     */
    tooltip?: React.ReactNode
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
            tooltip,
            ...buttonProps
        } = props

        const button = <ButtonBase
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

        if (tooltip === undefined || tooltip === null || typeof tooltip === 'boolean' || tooltip === '') {
            return button
        }

        // The hint describes the button rather than naming it, so its visible label stays its name.
        return <Tooltip describeChild enterDelay={300} enterNextDelay={300} title={tooltip}>
            {/* A disabled button takes no pointer events: the wrapper hears the pointer for it. */}
            <span style={{display: 'inline-flex', flexShrink: 0}}>{button}</span>
        </Tooltip>
    },
)

export default PneTableControlButton
