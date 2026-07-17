import React, {ReactNode} from 'react';
import {Autocomplete, AutocompleteProps, SxProps} from '@mui/material';
import type {TextFieldProps} from '@mui/material/TextField';
import {
    dropDownSx,
    getOptionKey,
    getOptionLabel,
    isOptionEqualToValue,
    PneDropdownChoice,
} from '../../common/paynet/dropdown';
import {PneTextField} from "../../index";
import {usePneFieldControlProps} from '../PneFieldContext';

export interface PneAutocompleteHtmlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export interface PneAutocompleteProps<
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
> extends Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, 'renderInput'> {
    label?: ReactNode
    variant?: TextFieldProps['variant']
    error?: boolean
    helperText?: string
    placeholder?: string
    required?: boolean
    /** Props merged onto the actual native text input. Autocomplete event handlers remain library-owned. */
    htmlInputProps?: PneAutocompleteHtmlInputProps
}

export type IProps<
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
> = PneAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>

const PneAutocomplete = <
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = false,
    FreeSolo extends boolean | undefined = false,
>(props: PneAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo
>) => {
    const {
        disabled,
        label,
        variant,
        size = 'small',
        error,
        helperText,
        fullWidth,
        id,
        sx,
        placeholder,
        required,
        htmlInputProps,
        ...rest
    } = props

    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx])
    ]
    const controlProps = usePneFieldControlProps({
        disabled,
        error,
        fullWidth,
        id,
        required,
    })

    return <Autocomplete
        disabled={controlProps.disabled}
        fullWidth={controlProps.fullWidth}
        id={controlProps.id}
        isOptionEqualToValue={isOptionEqualToValue}
        getOptionLabel={getOptionLabel}
        getOptionKey={getOptionKey}
        renderInput={(params) => {
            return <PneTextField
                {...params}
                placeholder={placeholder}
                label={label}
                variant={variant}
                error={controlProps.error ?? false}
                helperText={helperText}
                required={controlProps.required}
                slotProps={{
                    ...params.slotProps,
                    htmlInput: {
                        ...htmlInputProps,
                        ...params.slotProps.htmlInput,
                    },
                }}
            />
        }}
        size={size}
        sx={innerSx}
        {...rest}
    />
}

export default PneAutocomplete
