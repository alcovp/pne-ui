import React, {forwardRef} from 'react'
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined'
import {IconButton, SxProps, Theme, Tooltip} from '@mui/material'
import {useTranslation} from 'react-i18next'
import PneButton from '../../PneButton'
import {createAutoTestAttributes} from '../../AutoTestAttribute'

export const COLUMN_SETTINGS_ACTION_AUTOTEST_ID = 'column-settings'

export type PneTableColumnSettingsActionProps = {
    /** Opens the column settings dialog. */
    onClick: React.MouseEventHandler<HTMLButtonElement>
    /**
     * `icon` renders a 40px icon button with a tooltip and fits the
     * `PneTableViewSelector` actions slot. `button` renders an outlined text
     * button with the icon for wide layouts. Defaults to `icon`.
     */
    variant?: 'icon' | 'button'
    /** Accessible name and visible text; defaults to the localized "Table settings". */
    label?: string
    disabled?: boolean
    /** Stable, non-secret instance identifier used to scope Selenium locators. */
    autoTestId?: string
    sx?: SxProps<Theme>
}

const iconButtonSx: SxProps<Theme> = {
    borderRadius: '4px',
    height: '40px',
    padding: '8px',
    width: '40px',
}

/**
 * Entry point to the column settings dialog. Place it in the table toolbar or
 * in the view selector `actions` slot next to the view it configures.
 */
const PneTableColumnSettingsAction = forwardRef<HTMLButtonElement, PneTableColumnSettingsActionProps>(
    function PneTableColumnSettingsAction(props, ref) {
        const {
            autoTestId,
            disabled = false,
            label,
            onClick,
            sx,
            variant = 'icon',
        } = props
        const {t} = useTranslation()
        const resolvedLabel = label ?? t('pneTable.columnSettings.action', {defaultValue: 'Table settings'})

        if (variant === 'button') {
            return <PneButton
                {...createAutoTestAttributes(COLUMN_SETTINGS_ACTION_AUTOTEST_ID, autoTestId)}
                disabled={disabled}
                onClick={onClick}
                pneStyle='outlined'
                ref={ref}
                startIcon={<ViewColumnOutlinedIcon/>}
                sx={sx}
            >
                {resolvedLabel}
            </PneButton>
        }

        return <Tooltip
            enterDelay={300}
            enterNextDelay={300}
            title={resolvedLabel}
        >
            <span>
                <IconButton
                    {...createAutoTestAttributes(COLUMN_SETTINGS_ACTION_AUTOTEST_ID, autoTestId)}
                    aria-label={resolvedLabel}
                    disabled={disabled}
                    onClick={onClick}
                    ref={ref}
                    size='small'
                    sx={[
                        iconButtonSx,
                        ...(Array.isArray(sx) ? sx : [sx]),
                    ]}
                >
                    <ViewColumnOutlinedIcon sx={{height: '16px', width: '16px'}}/>
                </IconButton>
            </span>
        </Tooltip>
    },
)

export default PneTableColumnSettingsAction
