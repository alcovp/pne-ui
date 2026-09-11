import type React from 'react'
import type {AutocompleteProps} from '@mui/material'
import type {ChipTypeMap} from '@mui/material/Chip'
import type {
    PneAutocompleteKey,
    PneAutocompleteOption,
} from '../../common/paynet/dropdown'
import {mergeAriaDescribedBy} from '../PneFieldContext'

type PneAutocompleteDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

type PneAutocompleteSafeAriaAttribute =
    | 'aria-busy'
    | 'aria-describedby'
    | 'aria-description'
    | 'aria-details'
    | 'aria-errormessage'
    | 'aria-keyshortcuts'
    | 'aria-label'
    | 'aria-labelledby'

type PneAutocompleteSafeNativeAttribute =
    | 'autoCapitalize'
    | 'autoComplete'
    | 'autoCorrect'
    | 'dir'
    | 'enterKeyHint'
    | 'form'
    | 'inputMode'
    | 'lang'
    | 'maxLength'
    | 'minLength'
    | 'name'
    | 'pattern'
    | 'spellCheck'
    | 'title'
    | 'translate'

type PneAutocompleteManagedHtmlInputProp =
    | Extract<keyof React.DOMAttributes<HTMLInputElement>, `on${string}`>
    | 'children'
    | 'className'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'defaultChecked'
    | 'defaultValue'
    | 'disabled'
    | 'hidden'
    | 'id'
    | 'placeholder'
    | 'readOnly'
    | 'ref'
    | 'required'
    | 'role'
    | 'style'
    | 'tabIndex'
    | 'type'
    | 'value'

export type PneAutocompleteHtmlInputProps = Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    PneAutocompleteSafeAriaAttribute | PneAutocompleteSafeNativeAttribute
> & PneAutocompleteDataAttributes
    & Partial<Record<PneAutocompleteManagedHtmlInputProp, never>>

export interface PneAutocompleteListboxName {
    'aria-label'?: string
    'aria-labelledby'?: string
}

interface ResolveAutocompleteListboxNameOptions {
    controlLabelId?: string
    hasTextFieldLabel: boolean
    htmlInputProps?: PneAutocompleteHtmlInputProps
    inputId: string
}

type MuiAutocompleteProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>

export const areAutocompleteOptionsEqualBy = <T>(
    option: T,
    value: unknown,
    resolveKey: (option: T) => PneAutocompleteKey,
): boolean => {
    if (getRuntimeOptionKind(option) !== getRuntimeOptionKind(value)) {
        return false
    }

    try {
        return resolveKey(option) === resolveKey(value as T)
    } catch {
        return false
    }
}

export const resolveAutocompleteListboxName = ({
    controlLabelId,
    hasTextFieldLabel,
    htmlInputProps,
    inputId,
}: ResolveAutocompleteListboxNameOptions): PneAutocompleteListboxName => {
    if (htmlInputProps?.['aria-label']) {
        return {'aria-label': htmlInputProps['aria-label']}
    }

    const ownerLabelId = hasTextFieldLabel ? `${inputId}-label` : controlLabelId
    const ariaLabelledBy = mergeAriaDescribedBy(
        ownerLabelId,
        htmlInputProps?.['aria-labelledby'],
    )

    return ariaLabelledBy ? {'aria-labelledby': ariaLabelledBy} : {}
}

export const withAutocompleteListboxName = <
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
>(
        slotProps: MuiAutocompleteProps<
            T,
            Multiple,
            DisableClearable,
            FreeSolo,
            ChipComponent
        >['slotProps'],
        fallbackName: PneAutocompleteListboxName,
    ): MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['slotProps'] => {
    const {root: _root, ...safeSlotProps} = slotProps ?? {}
    const listbox = safeSlotProps.listbox
    const addName = (resolvedListbox: Record<string, unknown> | undefined) => {
        const listboxProps = resolvedListbox ?? {}
        const hasExplicitName = Boolean(
            listboxProps['aria-label'] || listboxProps['aria-labelledby'],
        )
        const name = hasExplicitName ? {} : fallbackName
        const hasAriaLabel = Boolean(listboxProps['aria-label'] || name['aria-label'])
        const hasAriaLabelledBy = Boolean(
            listboxProps['aria-labelledby'] || name['aria-labelledby'],
        )

        return {
            ...listboxProps,
            ...name,
            ...(!hasAriaLabelledBy || hasAriaLabel
                ? {'aria-labelledby': undefined}
                : {}),
        }
    }

    return {
        ...safeSlotProps,
        listbox: typeof listbox === 'function'
            ? ownerState => addName(listbox(ownerState) as Record<string, unknown>)
            : addName(listbox as Record<string, unknown> | undefined),
    } as MuiAutocompleteProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >['slotProps']
}

export const sanitizeAutocompleteHtmlInputProps = (
    htmlInputProps?: PneAutocompleteHtmlInputProps,
): PneAutocompleteHtmlInputProps | undefined => {
    if (!htmlInputProps) {
        return undefined
    }

    return Object.fromEntries(
        Object.entries(htmlInputProps).filter(([key]) =>
            key.startsWith('data-') || safeHtmlInputKeys.has(key),
        ),
    ) as PneAutocompleteHtmlInputProps
}

export const mergeAutocompleteHtmlInputProps = <T extends object>(
    muiInputProps: T,
    htmlInputProps?: PneAutocompleteHtmlInputProps,
): T & PneAutocompleteHtmlInputProps => {
    const safeInputProps = sanitizeAutocompleteHtmlInputProps(htmlInputProps)

    if (!safeInputProps) {
        return muiInputProps as T & PneAutocompleteHtmlInputProps
    }

    const muiInputRecord = muiInputProps as Record<string, unknown>

    const ariaDescribedBy = mergeAriaDescribedBy(
        getString(muiInputRecord['aria-describedby']),
        safeInputProps['aria-describedby'],
    )
    const ariaLabelledBy = mergeAriaDescribedBy(
        getString(muiInputRecord['aria-labelledby']),
        safeInputProps['aria-labelledby'],
    )

    return {
        ...muiInputRecord,
        ...safeInputProps,
        ...(ariaDescribedBy ? {'aria-describedby': ariaDescribedBy} : {}),
        ...(ariaLabelledBy ? {'aria-labelledby': ariaLabelledBy} : {}),
    } as T & PneAutocompleteHtmlInputProps
}

export const withoutAutocompleteRootSlot = <
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
>(
        slots: MuiAutocompleteProps<
            T,
            Multiple,
            DisableClearable,
            FreeSolo,
            ChipComponent
        >['slots'],
    ): MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['slots'] => {
    if (!slots) {
        return undefined
    }

    const {root: _root, ...safeSlots} = slots
    return safeSlots
}

export const hasAutocompleteLabel = (label: React.ReactNode): boolean =>
    label !== undefined && label !== null && label !== ''

const getRuntimeOptionKind = (option: unknown): string => {
    if (typeof option === 'string' || typeof option === 'number') {
        return typeof option
    }

    if (option === null) {
        return 'null'
    }

    if (typeof option !== 'object') {
        return typeof option
    }

    return 'object'
}

const getString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined

const safeHtmlInputKeys = new Set<string>([
    'aria-busy',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-errormessage',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'autoCapitalize',
    'autoComplete',
    'autoCorrect',
    'dir',
    'enterKeyHint',
    'form',
    'inputMode',
    'lang',
    'maxLength',
    'minLength',
    'name',
    'pattern',
    'spellCheck',
    'title',
    'translate',
])
