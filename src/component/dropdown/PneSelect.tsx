import React, {forwardRef, ReactNode, useId} from 'react'
import {Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, SelectProps, SelectVariants} from '@mui/material'
import {PneDropdownChoice} from '../../common/paynet/dropdown'
import {assertObject, ensure, exhaustiveCheck, SelectOption} from '../../common/pne/type'
import {isAbstractEntity, isIAutoCompleteChoice} from '../../common/paynet/type'
import {usePneFieldControlProps} from '../PneFieldContext'

export interface PneSelectOptionProps extends React.HTMLAttributes<HTMLLIElement> {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export interface IProps<T extends PneDropdownChoice, >
    extends Omit<SelectProps<T>, 'children' | 'onChange' | 'placeholder' | 'variant'> {
    options: readonly T[]
    onChange: (option: T) => void
    getOptionLabel?: (option: SelectOption) => ReactNode
    getOptionProps?: (option: SelectOption) => PneSelectOptionProps
    placeholder?: ReactNode
    variant?: SelectVariants
    disableMenuItem?: (option: SelectOption) => boolean
}

const PneSelect = forwardRef(<T extends PneDropdownChoice, >(
    props: IProps<T>,
    ref: React.Ref<HTMLSelectElement>,
) => {
    const {
        'aria-describedby': ariaDescribedBy,
        options,
        onChange,
        size = 'small',
        getOptionLabel = createDefaultOptionLabel,
        getOptionProps,
        variant = 'outlined',
        disableMenuItem,
        label,
        disabled,
        error,
        required,
        sx,
        displayEmpty,
        placeholder,
        renderValue,
        id,
        labelId: labelIdProp,
        ...rest
    } = props

    const generatedLabelId = useId()
    const hasLabel = label !== undefined && label !== null && label !== ''
    const mappedOptions = options.map(mapChoiceToSelectOption)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy,
        disabled,
        error,
        id,
        required,
    })
    const internalLabelId = labelIdProp ?? generatedLabelId
    const resolvedLabelId = hasLabel ? internalLabelId : labelIdProp ?? controlProps.labelId

    const handleChange = (event: SelectChangeEvent<T>) => {
        const value = event.target.value

        onChange(ensure(options.find(
            opt => mapChoiceToSelectOption(opt).value === value,
        )))
    }

    const optionsPresent = options?.length > 0
    const shouldRenderPlaceholder = placeholder !== undefined && placeholder !== null

    const renderSelectedValue = (selected: T) => {
        if (isEmptyValue(selected)) {
            return <Box
                component='span'
                sx={{color: 'text.secondary'}}
            >
                {placeholder}
            </Box>
        }

        if (Array.isArray(selected)) {
            return selected.map((value, index) => <React.Fragment key={String(value)}>
                {index > 0 ? ', ' : null}
                {renderSingleSelectedValue(value, mappedOptions, getOptionLabel)}
            </React.Fragment>)
        }

        return renderSingleSelectedValue(selected, mappedOptions, getOptionLabel)
    }

    return <FormControl
        size={size}
        variant={variant}
        disabled={controlProps.disabled}
        error={controlProps.error}
        required={controlProps.required}
        sx={sx}
        fullWidth
    >
        {hasLabel ? <InputLabel id={internalLabelId}>{label}</InputLabel> : null}
        <Select
            ref={ref}
            aria-describedby={controlProps.ariaDescribedBy}
            displayEmpty={displayEmpty ?? shouldRenderPlaceholder}
            id={controlProps.id}
            labelId={resolvedLabelId}
            onChange={handleChange}
            size={size}
            variant={variant}
            label={hasLabel ? label : undefined}
            renderValue={renderValue ?? (shouldRenderPlaceholder ? renderSelectedValue : undefined)}
            {...rest}
        >
            {optionsPresent ? options.map(choice => {
                const option = mapChoiceToSelectOption(choice)

                return <MenuItem
                    {...getOptionProps?.(option)}
                    disabled={disableMenuItem ? disableMenuItem(option) : false}
                    key={option.value}
                    value={option.value}
                >
                    {getOptionLabel(option)}
                </MenuItem>
            }) : null}
        </Select>
    </FormControl>
})

export default PneSelect

const createDefaultOptionLabel = (option: SelectOption): ReactNode => {
    return option.label
}

const isEmptyValue = (value: unknown): boolean => {
    return value === '' || value === undefined || value === null
        || (Array.isArray(value) && value.length === 0)
}

const renderSingleSelectedValue = (
    value: unknown,
    options: SelectOption[],
    getOptionLabel: (option: SelectOption) => ReactNode,
): ReactNode => {
    const option = options.find(option => option.value === value)

    if (option) {
        return getOptionLabel(option)
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return value
    }

    if (isIAutoCompleteChoice(value)) {
        return value.displayName
    }

    if (isAbstractEntity(value)) {
        return value.displayName
    }

    return ''
}

const mapChoiceToSelectOption = <T extends PneDropdownChoice>(choice: T): SelectOption => {
    if (typeof choice === 'string') {
        return {
            value: choice,
            label: choice,
        }
    }

    assertObject(choice)
    if (isIAutoCompleteChoice(choice)) {
        return {
            value: choice.choiceId,
            label: choice.displayName,
        }
    } else if (isAbstractEntity(choice)) {
        return {
            value: choice.id,
            label: choice.displayName,
        }
    }

    exhaustiveCheck(choice)

    throw new TypeError('Incompatible types of select option:\n'
        + JSON.stringify(choice, null, 4),
    )
}
