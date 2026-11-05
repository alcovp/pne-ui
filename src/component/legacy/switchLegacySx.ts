import {alpha, keyframes} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import type {PneSwitchSize} from '../PneSwitch'

/*
 * The pne-ui 4.x switch look, kept for composite components that do not change in pne-ui 5 yet
 * (see legacyLook.tsx). Copied from 4.8.1 unchanged.
 */

const pendingRipple = keyframes({
    from: {
        opacity: 0.32,
        transform: 'scale(1)',
    },
    to: {
        opacity: 0,
        transform: 'scale(1.28)',
    },
})

const revealStaticPendingOutline = keyframes({
    to: {
        opacity: 0.32,
    },
})

export const legacyPendingSwitchSx: SxProps<Theme> = theme => ({
    cursor: 'progress',
    position: 'relative',
    '& .MuiSwitch-switchBase': {
        cursor: 'progress',
    },
    '&::before, &::after': {
        animation: `${pendingRipple} 1200ms ease-out 400ms infinite`,
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: 40,
        boxSizing: 'border-box',
        content: '""',
        height: 'calc(var(--pne-switch-track-height) + 4px)',
        left: 'calc(var(--pne-switch-track-left) - 2px)',
        opacity: 0,
        pointerEvents: 'none',
        position: 'absolute',
        top: 'calc(var(--pne-switch-track-top) - 2px)',
        transformOrigin: 'center',
        width: 'calc(var(--pne-switch-track-width) + 4px)',
    },
    '&::after': {
        animationDelay: '1000ms',
    },
    '@media (prefers-reduced-motion: reduce)': {
        '&::before': {
            animation: `${revealStaticPendingOutline} 1ms linear 400ms forwards`,
            transform: 'none',
        },
        '&::after': {
            display: 'none',
        },
    },
})

const createSwitchSx = (
    config: {
        rootWidth: number
        rootHeight: number
        trackLeft: number
        trackTop: number
        trackWidth: number
        trackHeight: number
        thumbSize: number
        thumbPadding: number
        checkedShift: number
        focusOutlineWidth: number
        pressedOutlineWidth: number
    },
): SxProps<Theme> => theme => {
    const trackFeedbackColor = alpha(theme.palette.primary.main, 0.1)
    const isDarkMode = theme.palette.mode === 'dark'
    const thumbColor = isDarkMode ? theme.palette.text.primary : '#fff'
    // Off, the track is a secondary control: the neutral control grey of the palette.
    const trackColor = isDarkMode
        ? (theme.palette.pne?.border.control ?? theme.palette.text.secondary)
        : (theme.palette.pne?.control.foreground ?? '#8A8A8A')
    const trackHoverColor = isDarkMode
        ? theme.palette.text.secondary
        : (theme.palette.pne?.control.foregroundHover ?? '#5C5C5C')
    const disabledTrackColor = isDarkMode
        ? theme.palette.action.disabledBackground
        : '#E6E6E6'
    const disabledThumbColor = isDarkMode ? theme.palette.text.disabled : '#fff'
    // A disabled switch keeps its state readable: "on" stays a faded primary,
    // "off" stays the neutral disabled track.
    const disabledCheckedTrackColor = alpha(theme.palette.primary.main, 0.38)

    return {
        '--pne-switch-track-height': `${config.trackHeight}px`,
        '--pne-switch-track-left': `${config.trackLeft}px`,
        '--pne-switch-track-top': `${config.trackTop}px`,
        '--pne-switch-track-width': `${config.trackWidth}px`,
        width: config.rootWidth,
        height: config.rootHeight,
        padding: 0,
        overflow: 'visible',
        '&:hover .MuiSwitch-track::before, & .MuiSwitch-switchBase:hover + .MuiSwitch-track::before': {
            boxShadow: `0 0 0 2px ${trackFeedbackColor}`,
            opacity: 1,
            transform: 'scale(1)',
        },
        '&:active .MuiSwitch-track::before, & .MuiSwitch-switchBase:active + .MuiSwitch-track::before': {
            boxShadow: `0 0 0 ${config.pressedOutlineWidth}px ${trackFeedbackColor}`,
            opacity: 1,
            transform: 'scale(1)',
            transitionDuration: '80ms',
        },
        '& .MuiSwitch-switchBase': {
            top: config.trackTop,
            left: config.trackLeft,
            padding: `${config.thumbPadding}px`,
            color: thumbColor,
            '&.Mui-checked': {
                transform: `translateX(${config.checkedShift}px)`,
                color: thumbColor,
                '& + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                    opacity: 1,
                },
            },
            '&:hover + .MuiSwitch-track': {
                backgroundColor: trackHoverColor,
                opacity: 1,
            },
            '&.Mui-checked:hover + .MuiSwitch-track': {
                backgroundColor: 'primary.dark',
                opacity: 1,
            },
            '&.Mui-disabled': {
                color: disabledThumbColor,
                opacity: 1,
                '& .MuiSwitch-thumb': {
                    backgroundColor: disabledThumbColor,
                },
                '& + .MuiSwitch-track': {
                    backgroundColor: disabledTrackColor,
                    opacity: 1,
                },
                '& + .MuiSwitch-track::before': {
                    boxShadow: 'none',
                    opacity: 0,
                    transform: 'scale(1)',
                },
            },
            '&.Mui-checked.Mui-disabled + .MuiSwitch-track': {
                backgroundColor: disabledCheckedTrackColor,
                opacity: 1,
            },
            '&.Mui-checked.Mui-disabled .MuiSwitch-thumb': {
                backgroundColor: disabledThumbColor,
            },
            '&.Mui-checked.Mui-disabled': {
                color: disabledThumbColor,
                opacity: 1,
                '& + .MuiSwitch-track': {
                    backgroundColor: disabledCheckedTrackColor,
                    opacity: 1,
                },
                '& + .MuiSwitch-track::before': {
                    boxShadow: 'none',
                    opacity: 0,
                    transform: 'scale(1)',
                },
            },
            '&.Mui-disabled:hover + .MuiSwitch-track': {
                backgroundColor: disabledTrackColor,
                opacity: 1,
            },
            '&.Mui-checked.Mui-disabled:hover + .MuiSwitch-track': {
                backgroundColor: disabledCheckedTrackColor,
                opacity: 1,
            },
            '&.Mui-focusVisible:not(.Mui-disabled) + .MuiSwitch-track::before': {
                boxShadow: `0 0 0 ${config.focusOutlineWidth}px ${trackFeedbackColor}`,
                opacity: 1,
                transform: 'scale(1)',
            },
        },
        '&:active .MuiSwitch-switchBase.Mui-focusVisible:not(.Mui-disabled) + .MuiSwitch-track::before, & .MuiSwitch-switchBase.Mui-focusVisible:not(.Mui-disabled):active + .MuiSwitch-track::before': {
            boxShadow: `0 0 0 ${config.pressedOutlineWidth}px ${trackFeedbackColor}`,
            opacity: 1,
            transform: 'scale(1)',
            transitionDuration: '80ms',
        },
        // The native input is the click target. MUI sizes it to the SwitchBase
        // (the thumb's height, three thumbs wide), which left dead bands above
        // and below the track and let it overhang the root on one side. It now
        // covers exactly the root, following the thumb's checked shift.
        '& .MuiSwitch-switchBase .MuiSwitch-input': {
            top: -config.trackTop,
            left: -config.trackLeft,
            width: config.rootWidth,
            height: config.rootHeight,
        },
        '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-input': {
            left: -(config.trackLeft + config.checkedShift),
        },
        '& .MuiSwitch-thumb': {
            width: config.thumbSize,
            height: config.thumbSize,
            borderRadius: '50%',
            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.2)',
        },
        '& .MuiSwitch-track': {
            position: 'absolute',
            top: config.trackTop,
            left: config.trackLeft,
            width: config.trackWidth,
            height: config.trackHeight,
            borderRadius: 40,
            backgroundColor: trackColor,
            opacity: 1,
            overflow: 'visible',
            '&::before': {
                borderRadius: 'inherit',
                boxShadow: 'none',
                boxSizing: 'border-box',
                content: '""',
                inset: 0,
                opacity: 0,
                pointerEvents: 'none',
                position: 'absolute',
                transform: 'scale(1)',
                transformOrigin: 'center',
                transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    }
}

export const legacySwitchSxBySize: Record<PneSwitchSize, SxProps<Theme>> = {
    small: createSwitchSx({
        rootWidth: 40,
        rootHeight: 24,
        trackLeft: 8,
        trackTop: 4,
        trackWidth: 24,
        trackHeight: 16,
        thumbSize: 12,
        thumbPadding: 2,
        checkedShift: 8,
        focusOutlineWidth: 2,
        pressedOutlineWidth: 4,
    }),
    medium: createSwitchSx({
        rootWidth: 58,
        rootHeight: 32,
        trackLeft: 12,
        trackTop: 5,
        trackWidth: 34,
        trackHeight: 22,
        thumbSize: 16,
        thumbPadding: 3,
        checkedShift: 12,
        focusOutlineWidth: 4,
        pressedOutlineWidth: 6,
    }),
}
