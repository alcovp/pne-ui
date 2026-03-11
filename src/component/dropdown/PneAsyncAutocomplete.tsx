import React, {ReactNode, useEffect, useId, useRef, useState} from 'react';
import {Autocomplete, AutocompleteProps, CircularProgress, SxProps} from '@mui/material';
import {
    dropDownSx,
    getOptionKey,
    getOptionLabel,
    isOptionEqualToValue,
    PneDropdownChoice,
} from '../../common/paynet/dropdown';
import {PneTextField} from "../../index";

export interface PneAsyncAutocompleteProps<
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
>(props: PneAsyncAutocompleteProps<
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
    const requestIdRef = useRef(0)

    useEffect(() => {
        if (!open) {
            requestIdRef.current += 1
            setLoading(false)
            setOptions([])
            return
        }

        const requestId = ++requestIdRef.current
        let active = true

        setOptions([])
        setLoading(true)
        searchChoices({searchString: inputValue})
            .then((result) => {
                if (!active || requestIdRef.current !== requestId) {
                    return
                }
                setOptions(result)
            })
            .catch(reason => {
                if (!active || requestIdRef.current !== requestId) {
                    return
                }
                Promise.resolve(reason)
                    .then(value => {
                        onSearchError ? onSearchError(value) : console.error(value)
                    })
            })
            .finally(() => {
                if (!active || requestIdRef.current !== requestId) {
                    return
                }
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [open, inputValue, onSearchError, searchChoices])

    return <Autocomplete
        id={id}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={isOptionEqualToValue}
        getOptionLabel={getOptionLabel}
        getOptionKey={getOptionKey}
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
