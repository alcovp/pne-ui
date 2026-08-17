import React, {forwardRef, ReactNode, Ref} from 'react'
import {
    Box,
    BoxProps,
    Divider,
    iconButtonClasses,
    SxProps,
    Theme,
    ToggleButton,
    ToggleButtonGroup,
    toggleButtonClasses,
    toggleButtonGroupClasses,
} from '@mui/material'
import {createAutoTestAttributes} from '../AutoTestAttribute'
import {
    TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
    TABLE_CONTROL_TEXT_COLOR,
} from './tableControlColors'

const TABLE_VIEWS_AUTOTEST_ID = 'table-views'
const TABLE_VIEW_AUTOTEST_ID = 'table-view'
const TABLE_VIEW_ACTIONS_AUTOTEST_ID = 'table-view-actions'

export type PneTableViewOption<TViewId extends string = string> = {
    id: TViewId
    label: ReactNode
    disabled?: boolean
    /**
     * Called for every enabled view-button click, including the already selected view.
     * Calling `event.preventDefault()` keeps the controlled value unchanged, allowing
     * consumers to open configuration UI before activating a view.
     */
    onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export type PneTableViewSelectorProps<TViewId extends string = string> = Omit<
    BoxProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'component' | 'onChange' | 'ref'
> & ({
    /** Accessible name applied to the semantic view group. */
    'aria-label': string
    'aria-labelledby'?: never
} | {
    /** ID of the element that names the semantic view group. */
    'aria-label'?: never
    'aria-labelledby': string
}) & {
    /** Stable, non-secret instance identifier used to scope Selenium locators. */
    autoTestId?: string
    /** Disables view selection. Consumer-provided actions retain their own disabled state. */
    disabled?: boolean
    /** Optional consumer-owned actions, such as table-view settings. */
    actions?: ReactNode
    /** Selected stable view ID. */
    value: TViewId
    /** Ordered application-defined views. */
    views: readonly PneTableViewOption<TViewId>[]
    /** Called only when the user selects a different non-null view ID. */
    onChange: (value: TViewId) => void
}

const rootSx: SxProps<Theme> = {
    alignItems: 'center',
    display: 'flex',
    height: '40px',
    maxWidth: '100%',
    minWidth: 0,
}

const groupSx: SxProps<Theme> = {
    display: 'flex',
    flex: '1 1 auto',
    height: '40px',
    minWidth: 0,
    overflow: 'hidden',
    [`& .${toggleButtonGroupClasses.grouped}`]: {
        border: '0 !important',
        margin: 0,
    },
}

const viewButtonSx: SxProps<Theme> = theme => {
    const activeBackgroundColor = theme.palette.mode === 'dark'
        ? theme.palette.pne.surface.subtle
        : TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR
    const controlTextColor = theme.palette.mode === 'dark'
        ? theme.palette.text.secondary
        : TABLE_CONTROL_TEXT_COLOR

    return {
        border: 0,
        borderRadius: '4px !important',
        color: controlTextColor,
        flex: '1 1 auto',
        fontWeight: 'bold',
        height: '40px',
        letterSpacing: '0.46px',
        lineHeight: '22px',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        [`&.${toggleButtonClasses.selected}`]: {
            backgroundColor: activeBackgroundColor,
            color: controlTextColor,
            '&:hover': {
                backgroundColor: activeBackgroundColor,
            },
        },
        [`&.${toggleButtonClasses.disabled}`]: {
            border: 'none',
        },
        '&:hover': {
            backgroundColor: activeBackgroundColor,
            borderRadius: '4px',
        },
        '&.Mui-focusVisible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '-2px',
        },
    }
}

const PneTableViewSelectorInner = <TViewId extends string, >(
    props: PneTableViewSelectorProps<TViewId>,
    ref: Ref<HTMLDivElement>,
) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        actions,
        autoTestId,
        disabled = false,
        onChange,
        sx,
        value,
        views,
        ...rootProps
    } = props
    const hasActions = actions !== undefined
        && actions !== null
        && typeof actions !== 'boolean'

    return <Box
        {...rootProps}
        {...createAutoTestAttributes(TABLE_VIEWS_AUTOTEST_ID, autoTestId)}
        ref={ref}
        sx={[
            rootSx,
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        <ToggleButtonGroup
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            disabled={disabled}
            exclusive
            sx={groupSx}
            value={value}
        >
            {views.map(view => {
                const handleClick = (event: React.MouseEvent<HTMLElement>) => {
                    // This selector always renders its options as native button-backed ToggleButtons.
                    const buttonEvent = event as React.MouseEvent<HTMLButtonElement>
                    view.onClick?.(buttonEvent)
                    if (!event.defaultPrevented && view.id !== value) {
                        onChange(view.id)
                    }
                }

                return <ToggleButton
                    {...createAutoTestAttributes(TABLE_VIEW_AUTOTEST_ID, view.id)}
                    disabled={view.disabled}
                    key={view.id}
                    onClick={handleClick}
                    sx={viewButtonSx}
                    value={view.id}
                >
                    {view.label}
                </ToggleButton>
            })}
        </ToggleButtonGroup>
        {hasActions ? <>
            <Divider
                orientation='vertical'
                sx={{flexShrink: 0, height: '24px', mx: '4px'}}
            />
            <Box
                {...createAutoTestAttributes(TABLE_VIEW_ACTIONS_AUTOTEST_ID)}
                sx={(theme: Theme) => ({
                    alignItems: 'center',
                    display: 'flex',
                    flexShrink: 0,
                    height: '40px',
                    [`& .${iconButtonClasses.root}`]: {
                        borderRadius: '4px !important',
                        color: theme.palette.mode === 'dark'
                            ? theme.palette.text.secondary
                            : TABLE_CONTROL_TEXT_COLOR,
                        height: '40px',
                        width: '40px',
                        '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? theme.palette.pne.surface.subtle
                                : TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
                        },
                    },
                })}
            >
                {actions}
            </Box>
        </> : null}
    </Box>
}

export const PneTableViewSelector = forwardRef(PneTableViewSelectorInner) as <
    TViewId extends string = string,
>(props: PneTableViewSelectorProps<TViewId> & React.RefAttributes<HTMLDivElement>) => React.ReactElement
