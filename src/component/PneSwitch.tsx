import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {Switch, SwitchProps, Tooltip} from '@mui/material'
import type {SwitchOwnerState} from '@mui/material/Switch'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {keyframes} from '@mui/material/styles'
import {useTheme} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import * as MuiMaterialUtils from '@mui/material/utils'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import {useTranslation} from 'react-i18next'
import {resolvePneSemanticPalette} from '../createTheme'
import type {PneSwitchStateColors} from '../switchPalette'
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
    /**
     * Hover hint of a disabled switch. By default it is the neutral localized
     * "Cannot be changed" (`pne.switch.disabledHint`); a node replaces that text
     * with a specific reason, and `false` turns the hint off.
     */
    disabledHint?: Exclude<React.ReactNode, boolean> | false
    inputRef?: React.Ref<HTMLInputElement>
    /**
     * Preserves the MUI callback contract. When the callback returns a thenable,
     * PneSwitch shows the requested value optimistically, locks repeat activation,
     * and rolls back if the thenable rejects.
     */
    onChange?: PneSwitchChangeHandler
    /** A state pinned for specimens; product code never sets it. */
    'data-pne-state'?: 'hover' | 'pressed' | 'focus' | 'loading'
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
        disabledHint,
        id,
        inputRef,
        onChange,
        readOnly = false,
        required,
        sx,
        size = 'medium',
        slotProps,
        'data-pne-state': pinnedState,
        ...rest
    } = themedProps
    const [confirmedChecked, setConfirmedChecked] = MuiMaterialUtils.useControlled({
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
    const effectiveDisabled = (controlProps.disabled ?? disabled) === true
    const showsDisabledHint = effectiveDisabled && disabledHint !== false
    const disabledHintRef = useRef<DisabledHintHandle>(null)
    const disabledHintRootListeners = useMemo<DisabledHintRootListeners>(() => ({
        onMouseEnter: event => disabledHintRef.current?.show(event.currentTarget),
        onMouseLeave: () => disabledHintRef.current?.hide(),
    }), [])
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
        effectiveDisabled ? disabledSwitchSx : undefined,
        ...(Array.isArray(sx) ? sx : [sx]),
    ]
    // State marks on the root span, where the colour rules and specimens read them; MUI
    // hands unknown props to the SwitchBase, not to the root.
    const pneRootAttributes = {
        'data-pne-loading': pending || undefined,
        'data-pne-readonly': readOnly && !pending ? true : undefined,
        'data-pne-state': pinnedState,
    }
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
                // The disabled SwitchBase ignores the pointer, so the hint
                // listens on the root span, which covers the track and thumb.
                root: MuiMaterialUtils.mergeSlotProps(
                    showsDisabledHint
                        ? MuiMaterialUtils.mergeSlotProps(slotProps?.root, disabledHintRootListeners)
                        : slotProps?.root,
                    pneRootAttributes,
                ),
                track: MuiMaterialUtils.mergeSlotProps(slotProps?.track, {
                    sx: switchTrackTransitionSx,
                }),
            }}
            sx={_sx}
        />
        {showsDisabledHint ? <PneSwitchDisabledHint hint={disabledHint} ref={disabledHintRef}/> : null}
    </DefaultPropsProvider>
})

PneSwitch.displayName = 'PneSwitch'

const disabledHintEnterDelayMs = 100

type DisabledHintHandle = {
    show: (anchor: HTMLElement) => void
    hide: () => void
}

type DisabledHintRootListeners = {
    onMouseEnter: React.MouseEventHandler<HTMLSpanElement>
    onMouseLeave: React.MouseEventHandler<HTMLSpanElement>
}

/**
 * The hover hint of a disabled switch: the neutral "cannot be changed" text
 * unless the consumer gives a specific reason. It renders
 * next to the switch rather than around it, so the switch keeps its single
 * render and its DOM; the hidden span only satisfies the Tooltip child contract
 * while the popper anchors to the hovered switch root.
 */
const PneSwitchDisabledHint = forwardRef<DisabledHintHandle, {
    hint: Exclude<React.ReactNode, boolean>
}>(({hint}, ref) => {
    const {t} = useTranslation()
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const enterTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useImperativeHandle(ref, () => ({
        show: element => {
            clearTimeout(enterTimerRef.current)
            enterTimerRef.current = setTimeout(() => setAnchor(element), disabledHintEnterDelayMs)
        },
        hide: () => {
            clearTimeout(enterTimerRef.current)
            setAnchor(null)
        },
    }), [])

    useEffect(() => () => clearTimeout(enterTimerRef.current), [])

    return <Tooltip
        describeChild
        disableFocusListener
        disableHoverListener
        disableTouchListener
        open={anchor !== null}
        slotProps={{popper: {anchorEl: anchor}}}
        title={hint ?? t('pne.switch.disabledHint', {defaultValue: 'Cannot be changed'})}
    >
        <span hidden/>
    </Tooltip>
})

PneSwitchDisabledHint.displayName = 'PneSwitchDisabledHint'

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
    return (typeof value === 'object' && value !== null) || typeof value === 'function'
        ? typeof (value as PromiseLike<unknown>).then === 'function'
        : false
}

const spinnerRotation = keyframes({
    from: {transform: 'rotate(0deg)'},
    to: {transform: 'rotate(360deg)'},
})

const switchTrackTransitionSx: SxProps<Theme> = theme => ({
    transition: theme.transitions.create('background-color', {
        duration: 240,
        easing: theme.transitions.easing.easeInOut,
    }),
    '@media (prefers-reduced-motion: reduce)': {
        transitionDuration: '0.01ms',
    },
})

// The pending switch keeps its colours and spins a ring inside the knob (UI Kit Switcher
// Loading); the knob already shows the requested value.
const pendingSwitchSx: SxProps<Theme> = {
    cursor: 'progress',
    '& .MuiSwitch-switchBase': {
        cursor: 'progress',
    },
}

// The disabled SwitchBase ignores the pointer, so the root carries the cursor
// over the whole control, track and thumb included.
const disabledSwitchSx: SxProps<Theme> = {
    cursor: 'not-allowed',
}

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

type SwitchSizeConfig = {
    rootWidth: number
    rootHeight: number
    trackLeft: number
    trackTop: number
    trackWidth: number
    trackHeight: number
    thumbSize: number
    thumbPadding: number
    checkedShift: number
    spinnerInset: number
    spinnerStroke: number
}

const ring = (color: string): string => color === 'transparent' ? 'none' : `inset 0 0 0 1px ${color}`

type SwitchColorRules = Record<string, SystemStyleObject<Theme>>

/**
 * Track and knob colours of one value for the switch bases matched by `switchBase`. The track
 * stays opaque: MUI fades it (0.38, checked 0.5, disabled 0.12) with rules these outweigh.
 */
const valueColorsSx = (switchBase: string, colors: PneSwitchStateColors): SwitchColorRules => ({
    [`${switchBase} + .MuiSwitch-track`]: {
        backgroundColor: colors.track,
        boxShadow: ring(colors.ring),
        opacity: 1,
    },
    [`${switchBase} .MuiSwitch-thumb`]: {
        backgroundColor: colors.knob,
    },
})

const INTERACTIVE_ROOT = '&:not([data-pne-readonly]):not([data-pne-loading]):not([data-pne-state="loading"])'
const INTERACTIVE_BASE = '.MuiSwitch-switchBase:not(.Mui-disabled)'

const createSwitchSx = (config: SwitchSizeConfig): SxProps<Theme> => theme => {
    const pne = resolvePneSemanticPalette(theme)
    const colors = pne.switch
    const focusRing = `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`
    // The ring sits `spinnerInset` inside the knob (12px in the 16px knob, 8px in the 12px one).
    // Lengths are strings on purpose: sx reads bare numbers of margin props as theme spacing.
    const spinner = (color: string): SystemStyleObject<Theme> => ({
        animation: `${spinnerRotation} 800ms linear infinite`,
        border: `${config.spinnerStroke}px solid ${color}`,
        borderRadius: '50%',
        borderRightColor: 'transparent',
        boxSizing: 'border-box',
        content: '""',
        inset: `${config.spinnerInset}px`,
        position: 'absolute',
        '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
        },
    })

    // Colours by UI Kit role: value × state. Later rules win over earlier ones. Collected into
    // one plain record: spreading the MUI style type many times is too heavy for tsc.
    const colorRules: SwitchColorRules = Object.assign(
        {},
        valueColorsSx('& .MuiSwitch-switchBase', colors.off.default),
        valueColorsSx('& .MuiSwitch-switchBase.Mui-checked', colors.on.default),
        valueColorsSx(`${INTERACTIVE_ROOT}:hover ${INTERACTIVE_BASE}`, colors.off.hover),
        valueColorsSx(`${INTERACTIVE_ROOT}:hover ${INTERACTIVE_BASE}.Mui-checked`, colors.on.hover),
        valueColorsSx('&[data-pne-state="hover"] .MuiSwitch-switchBase', colors.off.hover),
        valueColorsSx('&[data-pne-state="hover"] .MuiSwitch-switchBase.Mui-checked', colors.on.hover),
        valueColorsSx(`${INTERACTIVE_ROOT}:active ${INTERACTIVE_BASE}`, colors.off.pressed),
        valueColorsSx(`${INTERACTIVE_ROOT}:active ${INTERACTIVE_BASE}.Mui-checked`, colors.on.pressed),
        valueColorsSx('&[data-pne-state="pressed"] .MuiSwitch-switchBase', colors.off.pressed),
        valueColorsSx('&[data-pne-state="pressed"] .MuiSwitch-switchBase.Mui-checked', colors.on.pressed),
        valueColorsSx('&[data-pne-readonly] .MuiSwitch-switchBase', colors.off.readOnly),
        valueColorsSx('&[data-pne-readonly] .MuiSwitch-switchBase.Mui-checked', colors.on.readOnly),
        valueColorsSx('& .MuiSwitch-switchBase.Mui-disabled', colors.off.disabled),
        valueColorsSx('& .MuiSwitch-switchBase.Mui-checked.Mui-disabled', colors.on.disabled),
    )

    return {
        width: config.rootWidth,
        height: config.rootHeight,
        padding: 0,
        overflow: 'visible',
        '& .MuiSwitch-switchBase': {
            top: config.trackTop,
            left: config.trackLeft,
            padding: `${config.thumbPadding}px`,
            '&.Mui-checked': {
                transform: `translateX(${config.checkedShift}px)`,
            },
            '&.Mui-disabled': {
                opacity: 1,
            },
        },
        ...colorRules,
        '& .MuiSwitch-switchBase.Mui-focusVisible:not(.Mui-disabled) + .MuiSwitch-track::before, &[data-pne-state="focus"] .MuiSwitch-switchBase + .MuiSwitch-track::before': {
            boxShadow: focusRing,
            opacity: 1,
        },
        '&[data-pne-readonly]': {
            cursor: 'default',
            '& .MuiSwitch-switchBase': {
                cursor: 'default',
            },
        },
        '&[data-pne-loading] .MuiSwitch-thumb::after, &[data-pne-state="loading"] .MuiSwitch-thumb::after': spinner(colors.spinner.off),
        '&[data-pne-loading] .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb::after, &[data-pne-state="loading"] .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb::after': spinner(colors.spinner.on),
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
            boxShadow: 'none',
            position: 'relative',
            transition: 'background-color 140ms linear',
        },
        '& .MuiSwitch-track': {
            position: 'absolute',
            top: config.trackTop,
            left: config.trackLeft,
            width: config.trackWidth,
            height: config.trackHeight,
            borderRadius: 40,
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
                transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    }
}

// UI Kit Switcher: md 32×20 track with a 16px knob inset by 2, xs 24×16 with 12; the hit
// areas (root) are 58×32 and 40×24 as in Figma.
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
        spinnerInset: 2,
        spinnerStroke: 1.25,
    }),
    medium: createSwitchSx({
        rootWidth: 58,
        rootHeight: 32,
        trackLeft: 13,
        trackTop: 6,
        trackWidth: 32,
        trackHeight: 20,
        thumbSize: 16,
        thumbPadding: 2,
        checkedShift: 12,
        spinnerInset: 2,
        spinnerStroke: 1.5,
    }),
}

export default PneSwitch
