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
import {usePneFieldControlProps} from '../PneFieldContext';

export interface PneAsyncAutocompleteHtmlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

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
    required?: boolean
    onSearchError?: (reason: any) => void
    /** Props merged onto the actual native text input. Autocomplete event handlers remain library-owned. */
    htmlInputProps?: PneAsyncAutocompleteHtmlInputProps
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
        disabled,
        label,
        size = 'small',
        error,
        helperText,
        fullWidth,
        id: idProp,
        sx,
        placeholder,
        required,
        onSearchError,
        htmlInputProps,
        ...rest
    } = props

    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<readonly T[]>([])
    const [loading, setLoading] = useState(false)
    const [searchString, setSearchString] = useState('')
    const generatedId = useId()
    const requestIdRef = useRef(0)
    const controlProps = usePneFieldControlProps({
        disabled,
        error,
        fullWidth,
        id: idProp,
        required,
    })
    const id = controlProps.id ?? generatedId

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
        searchChoices({searchString})
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
    }, [onSearchError, open, searchChoices, searchString])

    return <Autocomplete
        disabled={controlProps.disabled}
        fullWidth={controlProps.fullWidth}
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
        onInputChange={(e, value) => setSearchString(value)}
        renderInput={(params) => (
            <PneTextField
                {...params}
                label={label}
                placeholder={placeholder}
                required={controlProps.required}
                slotProps={{
                    ...params.slotProps,
                    input: {
                        ...params.slotProps.input,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                {params.slotProps.input.endAdornment}
                            </>
                        ),
                    },
                    htmlInput: {
                        ...htmlInputProps,
                        ...params.slotProps.htmlInput,
                        'aria-busy': loading,
                    },
                }}
                error={controlProps.error ?? false}
                helperText={helperText}
            />
        )}
        sx={innerSx}
        size={size}
        {...rest}
    />
}

export default PneAsyncAutocomplete
