import {
    AbstractEntity,
    assertObject,
    exhaustiveCheck,
    AutoCompleteChoice,
    isAbstractEntity,
    isIAutoCompleteChoice
} from '../../common/type';
import {AutocompleteFreeSoloValueMapping, SxProps} from '@mui/material';

export type PneDropdownChoice = AutoCompleteChoice | AbstractEntity | string

export const getOptionLabel = <T extends PneDropdownChoice, FreeSolo>(
    option: T | AutocompleteFreeSoloValueMapping<FreeSolo>
) => {
    if (typeof option === 'string') {
        return option
    }

    assertObject(option)
    if (isIAutoCompleteChoice(option)) {
        return option.displayName
    } else if (isAbstractEntity(option)) {
        return option.displayName
    }

    exhaustiveCheck(option)

    throw new TypeError('Incompatible types of option:\n'
        + JSON.stringify(option, null, 4)
    )
}

export const isOptionEqualToValue = <T extends PneDropdownChoice>(option: T, value: T) => {
    if (typeof option === 'string' && typeof value === 'string') {
        return option === value
    }

    assertObject(option)
    assertObject(value)
    if (isIAutoCompleteChoice(option) && isIAutoCompleteChoice(value)) {
        return option.choiceId === value.choiceId
    } else if (isAbstractEntity(option) && isAbstractEntity(value)) {
        return option.id === value.id
    }

    // TODO why it doesn't work?
    // exhaustiveCheck(option, value)

    throw new TypeError('Incompatible types of option and value:\n'
        + JSON.stringify(option, null, 4) + '\n'
        + JSON.stringify(value, null, 4)
    )
}

export const dropDownSx: SxProps = {
    '& .MuiButtonBase-root.MuiChip-root': {
        maxWidth: 'calc(50% - 4px)',
    },
}
