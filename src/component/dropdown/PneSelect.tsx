import React, {forwardRef, ReactNode} from 'react';
import {MenuItem, Select, SelectChangeEvent, SelectProps, SelectVariants} from '@mui/material';
import {PneDropdownChoice} from '../../common/paynet/dropdown';
import {
    assertObject,
    ensure,
    exhaustiveCheck,
    SelectOption
} from '../../common/pne/type';
import {isAbstractEntity, isIAutoCompleteChoice} from "../../common/paynet/type";

export interface IProps<T extends PneDropdownChoice, >
    extends Omit<SelectProps<T>, 'children' | 'onChange' | 'variant'> {
    options: readonly T[]
    onChange: (option: T) => void
    getOptionLabel?: (option: SelectOption) => ReactNode
    variant?: SelectVariants
    disableMenuItem?: (option: SelectOption) => boolean
}

const PneSelect = forwardRef(<T extends PneDropdownChoice, >(
    props: IProps<T>,
    ref: React.Ref<HTMLSelectElement>,
) => {
    const {
        options,
        onChange,
        size = 'small',
        getOptionLabel = createDefaultOptionLabel,
        variant = 'outlined',
        disableMenuItem,
        ...rest
    } = props

    const handleChange = (event: SelectChangeEvent<T>) => {
        const value = event.target.value

        onChange(ensure(options.find(
            opt => mapChoiceToSelectOption(opt).value === value
        )))
    }

    const optionsPresent = options?.length > 0

    return <Select ref={ref} onChange={handleChange} size={size} variant={variant} {...rest}>
        {optionsPresent ? options.map(mapChoiceToSelectOption).map(option =>
            <MenuItem
                disabled={disableMenuItem ? disableMenuItem(option) : false}
                key={option.value}
                value={option.value}
            >
                {getOptionLabel(option)}
            </MenuItem>) : null}
    </Select>
})

export default PneSelect

const createDefaultOptionLabel = (option: SelectOption): ReactNode => {
    return option.label
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
        + JSON.stringify(choice, null, 4)
    )
}
