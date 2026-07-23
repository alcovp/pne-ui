import React, {forwardRef, useCallback, useMemo, useRef, useState} from 'react'
import {Switch, SwitchProps} from '@mui/material'
import type {SwitchOwnerState} from '@mui/material/Switch'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {alpha, keyframes} from '@mui/material/styles'
import {useTheme} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import {useControlled} from '@mui/material/utils'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import {usePneFieldControlProps} from './PneFieldContext'
import {composeToggleInputSlotProps, moveAriaPropsToInput} from './PneToggleInput'

export type PneSwitchSize = NonNullable<SwitchProps['size']>

type MuiSwitchChangeHandler = NonNullable<SwitchProps['onChange']>

type AsyncSwitchChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
) => PromiseLike<unknown>

export type PneSwitchChangeHandler = MuiSwitchChangeHandler | AsyncSwitchChangeHandler

export interface PneSwitchProps extends Omit<SwitchProps, 'onChange'> {
    inputRef?: React.Ref<HTMLInputElement>
    /**
     * Preserves the MUI callback contract. When the callback returns a thenable,
     * PneSwitch shows the requested value optimistically, locks repeat activation,
     * and rolls back if the thenable rejects.
     */
    onChange?: PneSwitchChangeHandler
}

type SwitchInputSlotProps = NonNullable<NonNullable<SwitchProps['slotProps']>['input']>
type ResolvedSwitchInputSlotProps = Record<string, unknown> & {
    onClick?: React.MouseEventHandler<HTMLInputElement>
}

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
        checked: checkedProp,
        defaultChecked = false,
        disabled,
        id,
        inputRef,
        onChange,
        readOnly = false,
        required,
        sx,
        size = 'medium',
        slotProps,
        ...rest
    } = themedProps
    const [confirmedChecked, setConfirmedChecked] = useControlled({
        controlled: checkedProp,
        default: Boolean(defaultChecked),
        name: 'PneSwitch',
        state: 'checked',
    })
    const initialDefaultChecked = useRef(Boolean(defaultChecked)).current
    const detachObserverRef = useRef<MutationObserver | null>(null)
    const internalInputRef = useRef<HTMLInputElement | null>(null)
    const inputRefAttachedRef = useRef(false)
    const resetFormRef = useRef<HTMLFormElement | null>(null)
    const handlingChangeRef = useRef(false)
    const pendingRef = useRef(false)
    const pendingRequestRef = useRef(0)
    const [optimisticChecked, setOptimisticChecked] = useState<boolean>()
    const [pending, setPending] = useState(false)
    const displayedChecked = optimisticChecked ?? Boolean(confirmedChecked)
    const displayedCheckedRef = useRef(displayedChecked)
    displayedCheckedRef.current = displayedChecked
    const handleFormReset = useCallback((event: Event) => {
        // React's delegated onReset runs after a native listener on the form.
        // Wait for propagation so preventDefault keeps native semantics.
        queueMicrotask(() => {
            if (event.defaultPrevented) {
                return
            }

            // A native reset is a new source-of-truth boundary. Invalidate an
            // in-flight visual transaction so its late settlement cannot
            // overwrite the reset value.
            pendingRequestRef.current += 1
            pendingRef.current = false
            setPending(false)
            setOptimisticChecked(undefined)
            setConfirmedChecked(initialDefaultChecked)
        })
    }, [initialDefaultChecked, setConfirmedChecked])
    const handleInternalInputRef = useCallback((input: HTMLInputElement | null) => {
        if (input) {
            inputRefAttachedRef.current = true
            detachObserverRef.current?.disconnect()
            detachObserverRef.current = null
            internalInputRef.current = input
            const nextForm = input.form

            if (resetFormRef.current !== nextForm) {
                resetFormRef.current?.removeEventListener('reset', handleFormReset)
                nextForm?.addEventListener('reset', handleFormReset)
                resetFormRef.current = nextForm
            }
            return
        }

        inputRefAttachedRef.current = false
        const detachedInput = internalInputRef.current
        const releaseResetBinding = () => {
            resetFormRef.current?.removeEventListener('reset', handleFormReset)
            resetFormRef.current = null
            internalInputRef.current = null
            detachObserverRef.current?.disconnect()
            detachObserverRef.current = null
        }

        // Merged slot refs are replaced during ordinary renders. Delay cleanup
        // so a same-commit reattachment (and React Activity's connected hidden
        // DOM) keeps the reset listener, while a real unmount releases it.
        queueMicrotask(() => {
            if (inputRefAttachedRef.current || internalInputRef.current !== detachedInput) {
                return
            }

            if (!detachedInput?.isConnected) {
                releaseResetBinding()
                return
            }

            const MutationObserverConstructor = detachedInput.ownerDocument.defaultView
                ?.MutationObserver

            if (!MutationObserverConstructor) {
                return
            }

            const observer = new MutationObserverConstructor(() => {
                if (inputRefAttachedRef.current || internalInputRef.current !== detachedInput) {
                    observer.disconnect()
                    return
                }

                if (!detachedInput.isConnected) {
                    releaseResetBinding()
                }
            })

            detachObserverRef.current?.disconnect()
            detachObserverRef.current = observer
            observer.observe(detachedInput.ownerDocument, {childList: true, subtree: true})
        })
    }, [handleFormReset])
    const {inputAriaProps, rootProps} = moveAriaPropsToInput(rest)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy: inputAriaProps['aria-describedby'],
        disabled: props.disabled,
        id: props.id,
        required: props.required,
    })
    const composedInputSlotProps = composeToggleInputSlotProps<SwitchOwnerState>(
        [defaultInputSlotProps, consumerInputSlotProps],
        {
            controlId: controlProps.id ?? id,
            describedBy: controlProps.ariaDescribedBy,
            forceDisabled: controlProps.disabled === true || disabled === true,
            forceInvalid: controlProps.error,
            forceRequired: controlProps.ariaRequired,
            inputAriaProps,
            inputRef,
            internalInputRef: handleInternalInputRef,
            labelId: controlProps.labelId,
            mergeClassNameAndStyle: theme.components?.mergeClassNameAndStyle,
            readOnly,
            role: 'switch',
        },
    )
    const inputSlotProps = ((ownerState: SwitchOwnerState) => {
        const inputProps = composedInputSlotProps(ownerState) as ResolvedSwitchInputSlotProps

        if (!pending && !readOnly) {
            return inputProps
        }

        const consumerOnClick = inputProps.onClick

        return {
            ...inputProps,
            ...(pending ? {
                'aria-busy': true,
                'aria-disabled': true,
            } : {}),
            onClick: (event: React.MouseEvent<HTMLInputElement>) => {
                event.preventDefault()
                consumerOnClick?.(event)
                const input = event.currentTarget

                // React's controlled checkbox restoration and the browser's
                // cancelled click can leave a transient inverse value. Restore
                // the source-of-truth value before the next paint.
                queueMicrotask(() => {
                    if (input.isConnected) {
                        input.checked = displayedCheckedRef.current
                    }
                })
            },
        }
    }) as SwitchInputSlotProps

    const settleAsyncChange = (requestId: number, rollbackChecked?: boolean) => {
        if (requestId !== pendingRequestRef.current) {
            return
        }

        if (rollbackChecked !== undefined) {
            // Controlled owners remain the source of truth; this setter only
            // restores the previous value for defaultChecked usage.
            setConfirmedChecked(rollbackChecked)
        }

        pendingRef.current = false
        setOptimisticChecked(undefined)
        setPending(false)
    }

    const handleChange: MuiSwitchChangeHandler = (event, nextChecked) => {
        if (handlingChangeRef.current || pendingRef.current) {
            return
        }

        const previousChecked = Boolean(confirmedChecked)
        let changeResult: unknown

        handlingChangeRef.current = true
        try {
            // This is a no-op for controlled usage and preserves MUI's immediate
            // uncontrolled update semantics before the consumer callback runs.
            setConfirmedChecked(nextChecked)
            changeResult = onChange?.(event, nextChecked)
        } finally {
            handlingChangeRef.current = false
        }

        if (!isPromiseLike(changeResult)) {
            return
        }

        const requestId = ++pendingRequestRef.current

        pendingRef.current = true
        setOptimisticChecked(nextChecked)
        setPending(true)

        void Promise.resolve(changeResult).then(
            () => settleAsyncChange(requestId),
            () => settleAsyncChange(requestId, previousChecked),
        )
    }

    const _sx: SxProps<Theme> = [
        switchSxBySize[size],
        pending ? pendingSwitchSx : undefined,
        ...(Array.isArray(sx) ? sx : [sx]),
    ]
    // MUI types still expose the SwitchBase ref as a button although its
    // runtime root is a span. Keep the corrected public ref at the PNE edge.
    const muiRootRef = ref as React.Ref<HTMLButtonElement>

    return <DefaultPropsProvider value={componentsWithoutSwitchDefaults}>
        <Switch
            {...rootProps}
            checked={displayedChecked}
            disabled={controlProps.disabled ?? disabled}
            id={controlProps.id ?? id}
            onChange={handleChange}
            readOnly={readOnly || pending}
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

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
    return (typeof value === 'object' && value !== null) || typeof value === 'function'
        ? typeof (value as PromiseLike<unknown>).then === 'function'
        : false
}

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

const pendingSwitchSx: SxProps<Theme> = theme => ({
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
