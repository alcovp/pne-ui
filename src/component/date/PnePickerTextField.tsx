import * as React from 'react'
import {PickersTextField, type PickersTextFieldProps} from '@mui/x-date-pickers/PickersTextField'
import {type PneFieldSize, resolvePneFieldSize} from '../fieldSize'
import {usePneFieldControl, usePneFieldControlProps} from '../PneFieldContext'
import {pnePickerFieldSx} from './pickerFieldLook'

type OutlinedPickerTextFieldProps = PickersTextFieldProps<'outlined'>

export type PnePickerTextFieldProps = Omit<OutlinedPickerTextFieldProps, 'size' | 'variant'> & {
    /** The size of the field: small 24px, medium 32px (the default), large 40px. */
    size?: PneFieldSize
    /** Pins the hover or the focus look, for specimens only. */
    'data-pne-state'?: 'hover' | 'focus'
}

type SlotObject = Record<string, unknown>

const asObject = (value: unknown): SlotObject | undefined =>
    typeof value === 'object' && value !== null ? (value as SlotObject) : undefined

/**
 * The field of a MUI X picker in the UI Kit look: the box of PneTextField with the typed date in it. It
 * goes into a picker as `slots.textField`; the pickers of the library put it there themselves. Inside
 * PneField it takes the field's id, label, helper text, error and disabled state, as PneTextField does.
 */
const PnePickerTextField = ({
    ref,
    ...props
}: React.PropsWithoutRef<PnePickerTextFieldProps> & {ref?: React.Ref<HTMLDivElement>}) => {
    const {
        'aria-describedby': ariaDescribedBy,
        'aria-labelledby': ariaLabelledBy,
        areAllSectionsEmpty,
        disabled,
        error,
        fullWidth,
        id,
        label,
        required,
        size,
        slotProps,
        sx,
        ...rest
    } = props
    const field = usePneFieldControl()
    const control = usePneFieldControlProps({
        ariaDescribedBy,
        ariaLabelledBy,
        disabled,
        error,
        fullWidth,
        // A MUI X picker always gives its field an id. Inside PneField the id is the field's.
        id: field ? undefined : id,
        required,
    })
    const hasLabel = label !== undefined && label !== null && label !== ''
    const resolvedDisabled = control.disabled ?? disabled
    // MUI X writes the date in sections and keeps the whole of it in a hidden input, so the box is the
    // control: inside PneField it carries the field's id and names the field's label and helper text
    // as its own. With a label of its own the box keeps the names MUI X gives it.
    const labelledBy = hasLabel ? ariaLabelledBy : (control.ariaLabelledBy ?? control.labelId)
    const describedBy = control.ariaDescribedBy
    const input = asObject(slotProps?.input)
    const inputSlotProps = asObject(input?.slotProps)
    const box: SlotObject = {
        ...(field && control.id ? {id: control.id} : undefined),
        ...(labelledBy ? {'aria-labelledby': labelledBy} : undefined),
        ...(describedBy ? {'aria-describedby': describedBy} : undefined),
        ...(control.ariaRequired || required ? {'aria-required': true} : undefined),
        ...(resolvedDisabled ? {'aria-disabled': true} : undefined),
        ...asObject(inputSlotProps?.root),
    }
    const resolvedSlotProps = {
        ...slotProps,
        input: {...input, slotProps: {...inputSlotProps, root: box}},
        // The label stands over the box: for MUI it is always out of the box, so the format shows.
        inputLabel: {shrink: true, ...slotProps?.inputLabel},
    } as OutlinedPickerTextFieldProps['slotProps']

    return (
        <PickersTextField
            {...rest}
            areAllSectionsEmpty={areAllSectionsEmpty}
            data-pne-empty={areAllSectionsEmpty ? '' : undefined}
            data-pne-filled={areAllSectionsEmpty ? undefined : ''}
            data-pne-size={resolvePneFieldSize(size)}
            disabled={resolvedDisabled}
            error={control.error ?? error}
            fullWidth={control.fullWidth ?? fullWidth}
            id={id}
            label={label}
            ref={ref}
            required={control.required}
            // The geometry is pne-ui's own, by `data-pne-size`; MUI keeps its compact base under it.
            size='small'
            slotProps={resolvedSlotProps}
            sx={[pnePickerFieldSx, ...(Array.isArray(sx) ? sx : [sx])]}
            variant='outlined'
        />
    )
}

PnePickerTextField.displayName = 'PnePickerTextField'

export default PnePickerTextField
