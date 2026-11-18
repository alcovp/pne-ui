import * as React from 'react'
import {pneCalendarPopperSx} from '../calendarLook'
import type {PneFieldSize} from '../fieldSize'
import {PneCloseIcon} from '../dropdown/dropdownLook'
import PneCalendarActionBar from '../PneCalendarActionBar'
import {usePneFieldControl} from '../PneFieldContext'
import PnePickerTextField from './PnePickerTextField'

/** What a picker of the library adds to the props of its MUI X picker: the field as the library draws it. */
export type PnePickerFieldProps = {
    /** The size of the field: small 24px, medium 32px (the default), large 40px. */
    size?: PneFieldSize
    /**
     * The verdict of the application. Without it the field is in error when the typed date is unfinished
     * or impossible, or breaks a limit the picker was given. A far year is not an error.
     */
    error?: boolean
    helperText?: React.ReactNode
    fullWidth?: boolean
    required?: boolean
    id?: string
    /** Pins the hover or the focus look, for specimens only. */
    'data-pne-state'?: 'hover' | 'focus'
}

type SlotObject = Record<string, unknown>

/** The props every MUI X picker has, as far as the library reads them. */
type MuiPickerProps = {
    ampm?: boolean
    disabled?: boolean
    format?: string
    maxDate?: unknown
    maxDateTime?: unknown
    minDate?: unknown
    minDateTime?: unknown
    slotProps?: object
    slots?: object
    timeSteps?: object
    views?: readonly string[]
}

type PickerDefaults = {
    format: string
    openPickerIcon: React.ElementType
    /** A picker with a clock: 24 hours, every minute in the list, seconds when the format has them. */
    time?: {views: readonly string[]}
}

const asObject = (value: unknown): SlotObject | undefined =>
    typeof value === 'object' && value !== null ? value as SlotObject : undefined

const mergeSlotObjects = (ours: SlotObject, theirs: SlotObject | undefined): SlotObject => {
    if (!theirs) {
        return ours
    }

    const merged: SlotObject = {...ours}
    for (const [key, value] of Object.entries(theirs)) {
        if (value === undefined) {
            continue
        }

        merged[key] = key === 'sx' && ours.sx !== undefined
            ? [ours.sx, ...(Array.isArray(value) ? value : [value])]
            : value
    }

    return merged
}

// The props of the consumer win over the library's; `sx` adds to it. MUI X also takes a function of
// the owner state for a slot.
const mergeSlot = (ours: SlotObject, theirs: unknown): unknown => {
    if (typeof theirs === 'function') {
        const resolve = theirs as (ownerState: unknown) => unknown
        return (ownerState: unknown) => mergeSlotObjects(ours, asObject(resolve(ownerState)))
    }

    return mergeSlotObjects(ours, asObject(theirs))
}

/**
 * MUI X paints a year outside 1900-2099 red by limits nobody set. A date is wrong when it is unfinished
 * or impossible, or when it breaks a limit the application gave.
 */
const isRealError = (reason: unknown, picker: MuiPickerProps): boolean => {
    if (reason === null || reason === undefined) {
        return false
    }

    if (reason === 'minDate') {
        return picker.minDate !== undefined || picker.minDateTime !== undefined
    }

    if (reason === 'maxDate') {
        return picker.maxDate !== undefined || picker.maxDateTime !== undefined
    }

    return true
}

/**
 * Turns the props of a library picker into the props of its MUI X picker: the field of the library
 * (`PnePickerTextField`) with its size, error and helper text, the calendar look, the buttons under the
 * calendar, the icon of the button that opens it, day-first formats, and the library's verdict on the
 * typed date.
 */
export const usePnePicker = <Props extends MuiPickerProps>(
    props: Props & PnePickerFieldProps & {onError?: unknown},
    defaults: PickerDefaults,
): Props => {
    const {
        'data-pne-state': pinnedState,
        error,
        fullWidth,
        helperText,
        id,
        required,
        size,
        ...rest
    } = props
    const picker = rest as unknown as MuiPickerProps & {onError?: (reason: unknown, value: unknown) => void}

    // A disabled PneField disables the whole picker, the button of the calendar included; the field
    // itself takes the rest of the PneField's state.
    const field = usePneFieldControl()

    const [reason, setReason] = React.useState<unknown>(null)
    const onErrorRef = React.useRef(picker.onError)
    onErrorRef.current = picker.onError
    const handleError = React.useCallback((nextReason: unknown, value: unknown) => {
        setReason(nextReason)
        onErrorRef.current?.(nextReason, value)
    }, [])

    // A range reports a reason for each end.
    const reasons = Array.isArray(reason) ? reason : [reason]
    const resolvedError = error ?? reasons.some(item => isRealError(item, picker))

    const format = picker.format ?? defaults.format
    const slotProps = asObject(picker.slotProps)
    const ownTextField: SlotObject = {
        error: resolvedError,
        ...(pinnedState !== undefined ? {'data-pne-state': pinnedState} : undefined),
        ...(fullWidth !== undefined ? {fullWidth} : undefined),
        ...(helperText !== undefined ? {helperText} : undefined),
        ...(id !== undefined ? {id} : undefined),
        ...(required !== undefined ? {required} : undefined),
        ...(size !== undefined ? {size} : undefined),
    }

    return {
        ...(defaults.time
            ? {
                ampm: false,
                timeSteps: {minutes: 1, seconds: 1},
                views: /s/.test(format) ? [...defaults.time.views, 'seconds'] : undefined,
            }
            : undefined),
        ...picker,
        disabled: field?.disabled === true ? true : picker.disabled,
        format,
        onError: handleError,
        slotProps: {
            ...slotProps,
            dialog: mergeSlot({sx: pneCalendarPopperSx}, slotProps?.dialog),
            popper: mergeSlot({sx: pneCalendarPopperSx}, slotProps?.popper),
            textField: mergeSlot(ownTextField, slotProps?.textField),
        },
        slots: {
            actionBar: PneCalendarActionBar,
            // The clear cross of a clearable field is the cross of the library's fields.
            clearIcon: PneCloseIcon,
            openPickerIcon: defaults.openPickerIcon,
            textField: PnePickerTextField,
            ...picker.slots,
        },
    } as unknown as Props
}
