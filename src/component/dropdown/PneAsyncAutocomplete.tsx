import React, {ReactNode, useEffect, useId, useState} from 'react';
import {Autocomplete, AutocompleteProps, CircularProgress, SxProps} from '@mui/material';
import {dropDownSx, getOptionLabel, isOptionEqualToValue, PneDropdownChoice} from '../../common/paynet/dropdown';
import {PneTextField} from "../../index";

export interface IProps<
    T extends PneDropdownChoice,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
> extends Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, 'renderInput' | 'options'> {
    searchChoices: (request: {
        searchString?: string
    }) => Promise<T[]>
    label?: ReactNode
    error?: boolean
    helperText?: string
    placeholder?: string
    onSearchError?: (reason: any) => void
}

const PneAsyncAutocomplete = <
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
        searchChoices,
        label,
        size = 'small',
        error = false,
        helperText,
        sx,
        placeholder,
        onSearchError,
        ...rest
    } = props

    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<readonly T[]>([])
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const id = useId()

    useEffect(() => {
        if (!open) {
            return
        }

        setLoading(true)
        searchChoices({searchString: inputValue})
            .then(setOptions)
            .catch(reason => {
                Promise.resolve(reason)
                    .then(value => {
                        onSearchError ? onSearchError(value) : console.error(value)
                    })
            })
            .finally(() => setLoading(false))
    }, [open, inputValue, onSearchError, searchChoices])

    useEffect(() => {
        if (!open) {
            setOptions([])
        }
    }, [open])

    return <Autocomplete
        id={id}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={isOptionEqualToValue}
        getOptionLabel={getOptionLabel}
        options={options}
        loading={loading}
        filterOptions={(x) => x}
        inputValue={inputValue}
        onInputChange={(e, value) => setInputValue(value)}
        renderInput={(params) => (
            <PneTextField
                {...params}
                label={label}
                placeholder={placeholder}
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {loading ? <CircularProgress color="inherit" size={20}/> : null}
                            {params.InputProps.endAdornment}
                        </>
                    ),
                }}
                error={error}
                helperText={helperText}
            />
        )}
        sx={innerSx}
        size={size}
        {...rest}
    />
}

export default PneAsyncAutocomplete