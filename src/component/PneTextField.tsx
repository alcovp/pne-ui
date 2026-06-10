import React, {forwardRef} from 'react';
import {SxProps, TextField, TextFieldProps} from '@mui/material';
import {mergeAriaDescribedBy, usePneFieldControlProps} from './PneFieldContext';

const PneTextField = forwardRef((
    props: TextFieldProps,
    ref: React.Ref<HTMLDivElement>
) => {
    const {
        'aria-describedby': ariaDescribedBy,
        disabled,
        error,
        fullWidth,
        helperText,
        id,
        required,
        slotProps,
        sx,
        size = 'small',
        ...rest
    } = props;

    const inputSlotProps = getSlotPropsObject(slotProps?.input)
    const htmlInputSlotProps = getSlotPropsObject(slotProps?.htmlInput)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy: mergeAriaDescribedBy(
            ariaDescribedBy,
            getAriaDescribedBy(inputSlotProps),
            getAriaDescribedBy(htmlInputSlotProps),
        ),
        disabled,
        error,
        fullWidth,
        id,
        required,
    })
    const textFieldHelperTextId = helperText && controlProps.id
        ? `${controlProps.id}-helper-text`
        : undefined
    const resolvedAriaDescribedBy = mergeAriaDescribedBy(
        ariaDescribedBy,
        getAriaDescribedBy(inputSlotProps),
        getAriaDescribedBy(htmlInputSlotProps),
        textFieldHelperTextId,
        controlProps.ariaDescribedBy,
    )
    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx])
    ]
    const resolvedSlotProps = resolvedAriaDescribedBy
        ? {
            ...slotProps,
            input: withAriaDescribedBy(slotProps?.input, resolvedAriaDescribedBy),
            htmlInput: withAriaDescribedBy(slotProps?.htmlInput, resolvedAriaDescribedBy),
        }
        : slotProps

    return <TextField
        disabled={controlProps.disabled}
        error={controlProps.error}
        fullWidth={controlProps.fullWidth}
        id={controlProps.id}
        helperText={helperText}
        ref={ref}
        required={controlProps.required}
        size={size}
        slotProps={resolvedSlotProps}
        sx={_sx}
        {...rest}
    />
});

type PneTextFieldSlotProps = NonNullable<TextFieldProps['slotProps']>
type PneTextFieldSlotProp = PneTextFieldSlotProps[keyof PneTextFieldSlotProps]

const getSlotPropsObject = (
    slotProps: PneTextFieldSlotProp | undefined,
): Record<string, unknown> | undefined => {
    return typeof slotProps === 'function' ? undefined : slotProps as Record<string, unknown> | undefined
}

const getAriaDescribedBy = (
    props: Record<string, unknown> | undefined,
): string | undefined => {
    const ariaDescribedBy = props?.['aria-describedby']

    return typeof ariaDescribedBy === 'string' ? ariaDescribedBy : undefined
}

const withAriaDescribedBy = <TSlotProps extends PneTextFieldSlotProp | undefined>(
    slotProps: TSlotProps,
    ariaDescribedBy: string | undefined,
): TSlotProps | {'aria-describedby': string} => {
    if (!ariaDescribedBy) {
        return slotProps
    }

    if (typeof slotProps === 'function') {
        return slotProps
    }

    return {
        ...(slotProps as Record<string, unknown> | undefined),
        'aria-describedby': ariaDescribedBy,
    }
}

export default PneTextField;
