import React, {ReactNode} from 'react';
import {Autocomplete, AutocompleteProps, SxProps} from '@mui/material';
import type {TextFieldProps} from '@mui/material/TextField';
import {dropDownSx, getOptionLabel, isOptionEqualToValue, PneDropdownChoice} from '../../common/paynet/dropdown';
import {PneTextField} from "../../index";

export interface IProps<
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
}

const PneAutocomplete = <
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = false,
    FreeSolo extends boolean | undefined = false,
>(props: IProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo
>) => {

    const {
        label,
        variant,
        size = 'small',
        error = false,
        helperText,
        sx,
        placeholder,
        ...rest
    } = props

    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <Autocomplete
        isOptionEqualToValue={isOptionEqualToValue}
        getOptionLabel={getOptionLabel}
        renderInput={(params) => {
            return <PneTextField
                {...params}
                placeholder={placeholder}
                label={label}
                variant={variant}
                error={error}
                helperText={helperText}
            />
        }}
        size={size}
        sx={innerSx}
        {...rest}
    />
}

export default PneAutocomplete
