import React, {forwardRef, useMemo} from 'react'
import {Switch, SwitchProps} from '@mui/material'
import type {SwitchOwnerState} from '@mui/material/Switch'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {alpha} from '@mui/material/styles'
import {useTheme} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import {usePneFieldControlProps} from './PneFieldContext'
import {composeToggleInputSlotProps, moveAriaPropsToInput} from './PneToggleInput'

export type PneSwitchSize = NonNullable<SwitchProps['size']>

export interface PneSwitchProps extends SwitchProps {
    inputRef?: React.Ref<HTMLInputElement>
}

type SwitchInputSlotProps = NonNullable<NonNullable<SwitchProps['slotProps']>['input']>

const PneSwitch = forwardRef<HTMLSpanElement, PneSwitchProps>((props, ref) => {
    const propsWithDefaultSize: PneSwitchProps = props.size === undefined
        ? {...props, size: 'medium'}
        : props
    const theme = useTheme()
    const consumerInputSlotProps = props.slotProps?.input
    const defaultInputSlotProps = theme.components?.MuiSwitch?.defaultProps?.slotProps?.input
    const themedProps = useDefaultProps({
        name: 'MuiSwitch',
        props: {
            ...propsWithDefaultSize,
            slotProps: {
                ...propsWithDefaultSize.slotProps,
                // See PneCheckbox: MUI cannot merge a theme input object with a
                // functional consumer slot without replacing the function.
                input: {},
            },
        },
    })
    const componentsWithoutSwitchDefaults = useComponentsWithoutSwitchDefaults()
    const {
        disabled,
        id,
        inputRef,
        readOnly = false,
        required,
        sx,
        size = 'medium',
        slotProps,
        ...rest
    } = themedProps
    const {inputAriaProps, rootProps} = moveAriaPropsToInput(rest)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy: inputAriaProps['aria-describedby'],
        disabled: props.disabled,
        id: props.id,
        required: props.required,
    })
    const inputSlotProps = composeToggleInputSlotProps<SwitchOwnerState>(
        [defaultInputSlotProps, consumerInputSlotProps],
        {
            describedBy: controlProps.ariaDescribedBy,
            forceInvalid: controlProps.error,
            forceRequired: controlProps.ariaRequired,
            inputAriaProps,
            inputRef,
            labelId: controlProps.labelId,
            mergeClassNameAndStyle: theme.components?.mergeClassNameAndStyle,
            readOnly,
            role: 'switch',
        },
    ) as SwitchInputSlotProps

    const _sx: SxProps<Theme> = [
        switchSxBySize[size],
        ...(Array.isArray(sx) ? sx : [sx]),
    ]
    // MUI types still expose the SwitchBase ref as a button although its
    // runtime root is a span. Keep the corrected public ref at the PNE edge.
    const muiRootRef = ref as React.Ref<HTMLButtonElement>

    return <DefaultPropsProvider value={componentsWithoutSwitchDefaults}>
        <Switch
            {...rootProps}
            disabled={controlProps.disabled ?? disabled}
            id={controlProps.id ?? id}
            readOnly={readOnly}
            ref={muiRootRef}
            required={controlProps.required ?? required}
            size={size}
            slotProps={{
                ...slotProps,
                input: inputSlotProps,
            }}
            sx={_sx}
        />
    </DefaultPropsProvider>
})

PneSwitch.displayName = 'PneSwitch'

const useComponentsWithoutSwitchDefaults = () => {
    const theme = useTheme()

    return useMemo(() => {
        const components = theme.components
        const switchConfig = components?.MuiSwitch

        if (!switchConfig?.defaultProps) {
            return components ?? {}
        }

        const switchConfigWithoutDefaults = {...switchConfig}
        Reflect.deleteProperty(switchConfigWithoutDefaults, 'defaultProps')

        return {
            ...components,
            MuiSwitch: Object.keys(switchConfigWithoutDefaults).length > 0
                ? switchConfigWithoutDefaults
                : undefined,
        }
    }, [theme.components])
}

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

    return {
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
            color: '#fff',
            '&.Mui-checked': {
                transform: `translateX(${config.checkedShift}px)`,
                color: '#fff',
                '& + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                    opacity: 1,
                },
            },
            '&:hover + .MuiSwitch-track': {
                backgroundColor: '#5E7594',
                opacity: 1,
            },
            '&.Mui-checked:hover + .MuiSwitch-track': {
                backgroundColor: 'primary.dark',
                opacity: 1,
            },
            '&.Mui-disabled': {
                color: '#fff',
                opacity: 1,
                '& .MuiSwitch-thumb': {
                    backgroundColor: '#fff',
                },
                '& + .MuiSwitch-track': {
                    backgroundColor: '#E6E6E6',
                    opacity: 1,
                },
                '& + .MuiSwitch-track::before': {
                    boxShadow: 'none',
                    opacity: 0,
                    transform: 'scale(1)',
                },
            },
            '&.Mui-checked.Mui-disabled + .MuiSwitch-track': {
                backgroundColor: '#E6E6E6',
                opacity: 1,
            },
            '&.Mui-checked.Mui-disabled .MuiSwitch-thumb': {
                backgroundColor: '#fff',
            },
            '&.Mui-checked.Mui-disabled': {
                color: '#fff',
                opacity: 1,
                '& + .MuiSwitch-track': {
                    backgroundColor: '#E6E6E6',
                    opacity: 1,
                },
                '& + .MuiSwitch-track::before': {
                    boxShadow: 'none',
                    opacity: 0,
                    transform: 'scale(1)',
                },
            },
            '&.Mui-disabled:hover + .MuiSwitch-track': {
                backgroundColor: '#E6E6E6',
                opacity: 1,
            },
            '&.Mui-checked.Mui-disabled:hover + .MuiSwitch-track': {
                backgroundColor: '#E6E6E6',
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
            backgroundColor: '#809EAE',
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

const switchSxBySize: Record<PneSwitchSize, SxProps<Theme>> = {
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

export default PneSwitch
