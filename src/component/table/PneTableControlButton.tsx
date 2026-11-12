import React, {forwardRef} from 'react'
import {ButtonBase, ButtonBaseProps, SxProps, Theme, Tooltip} from '@mui/material'
import {resolvePneSemanticPalette} from '../../createTheme'
import {PneChevronDownIcon} from '../dropdown/dropdownLook'
import {createTableControlTextButtonStyle} from './tableControlButtonStyle'

export type PneTableControlButtonProps = Omit<ButtonBaseProps, 'children' | 'sx'> & {
    children: React.ReactNode
    /** Adds the 14px chevron of a menu trigger after the label. */
    menu?: boolean
    /**
     * `strong` gives an enabled button the colour of a value instead of the secondary text, for the
     * action the band is about, such as the bulk actions of a selection. A disabled button looks the
     * same either way.
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
 * A text button of the table bands: selection actions, a bulk actions menu. UI Kit Button Tertiary sm,
 * as every control of a band: 24px, a 12/16 Medium label on the sunken grey fill; the pointer colours
 * the label with the brand text colour.
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
                        ? {color: resolvePneSemanticPalette(theme).table.text}
                        : {}),
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
            {menu ? <PneChevronDownIcon aria-hidden sx={{fontSize: '14px'}}/> : null}
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
