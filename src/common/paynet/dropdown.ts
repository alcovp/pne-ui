import type {
    AutocompleteFreeSoloValueMapping,
    SxProps,
} from '@mui/material'
import type {AbstractEntity, AutoCompleteChoice} from './type'

export type PneAutocompleteKey = string | number

export type PneAutocompleteIdOption = {
    id: PneAutocompleteKey
    displayName: string
}

export type PneAutocompleteChoiceOption = {
    choiceId: PneAutocompleteKey
    displayName: string
}

export type PneBuiltInAutocompleteOption =
    | string
    | number
    | PneAutocompleteIdOption
    | PneAutocompleteChoiceOption

/** Any non-nullish value can be an option when object-specific adapters are supplied. */
export type PneAutocompleteOption = NonNullable<unknown>

/** Legacy domain union retained for source compatibility. */
export type PneDropdownChoice = AutoCompleteChoice | AbstractEntity | string

type BuiltInOptionOrFreeSolo<
    T extends PneBuiltInAutocompleteOption,
    FreeSolo extends boolean | undefined,
> = T | AutocompleteFreeSoloValueMapping<FreeSolo>

type BuiltInIdentity = {
    key: PneAutocompleteKey
    kind: 'choiceId' | 'id' | 'number' | 'string'
}

export const getOptionLabel = <
    T extends PneBuiltInAutocompleteOption,
    FreeSolo extends boolean | undefined = false,
>(option: BuiltInOptionOrFreeSolo<T, FreeSolo>): string => {
    if (typeof option === 'string') {
        return option
    }

    if (typeof option === 'number') {
        return String(option)
    }

    if (isRecord(option) && typeof option.displayName === 'string') {
        return option.displayName
    }

    throw new TypeError('Unsupported autocomplete option. Supply getOptionLabel for custom options.')
}

export const getOptionKey = <
    T extends PneBuiltInAutocompleteOption,
    FreeSolo extends boolean | undefined = false,
>(option: BuiltInOptionOrFreeSolo<T, FreeSolo>): PneAutocompleteKey => {
    const identity = getBuiltInIdentity(option)

    if (identity) {
        return identity.key
    }

    throw new TypeError('Unsupported autocomplete option. Supply getOptionKey for custom options.')
}

/**
 * Default equality for the built-in option shapes. It is intentionally total:
 * incompatible option kinds and malformed runtime values compare as unequal.
 */
export const isOptionEqualToValue = <T extends PneBuiltInAutocompleteOption>(
    option: T,
    value: unknown,
): boolean => {
    const optionIdentity = getBuiltInIdentity(option)
    const valueIdentity = getBuiltInIdentity(value)

    return optionIdentity !== undefined
        && valueIdentity !== undefined
        && optionIdentity.kind === valueIdentity.kind
        && optionIdentity.key === valueIdentity.key
}

const getBuiltInIdentity = (option: unknown): BuiltInIdentity | undefined => {
    if (typeof option === 'string') {
        return {key: option, kind: 'string'}
    }

    if (typeof option === 'number') {
        return {key: option, kind: 'number'}
    }

    if (!isRecord(option) || typeof option.displayName !== 'string') {
        return undefined
    }

    if (isAutocompleteKey(option.choiceId)) {
        return {key: option.choiceId, kind: 'choiceId'}
    }

    if (isAutocompleteKey(option.id)) {
        return {key: option.id, kind: 'id'}
    }

    return undefined
}

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
    typeof value === 'object' && value !== null

const isAutocompleteKey = (value: unknown): value is PneAutocompleteKey =>
    typeof value === 'string' || typeof value === 'number'

export const dropDownSx: SxProps = {
    '& .MuiButtonBase-root.MuiChip-root': {
        maxWidth: 'calc(50% - 4px)',
    },
}
