import React, {ReactNode} from 'react';
import {Autocomplete, AutocompleteProps, SxProps} from '@mui/material';
import {dropDownSx, getOptionLabel, isOptionEqualToValue, PneDropdownChoice} from '../../common/paynet/dropdown';
import {TextFieldVariants} from '@mui/material/TextField/TextField';
import {PneTextField} from "../../index";

export interface IProps<
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
> extends Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, 'renderInput'> {
    label?: ReactNode
    variant?: TextFieldVariants
    error?: boolean
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
            />
        }}
        size={size}
        sx={innerSx}
        {...rest}
    />
}

export default PneAutocomplete
