/* eslint-disable react/prop-types -- TypeScript validates this generic MUI-derived prop contract. */
import React, {ReactNode, useId} from 'react'
import {Autocomplete, AutocompleteProps, SxProps} from '@mui/material'
import type {ChipTypeMap} from '@mui/material/Chip'
import type {TextFieldProps} from '@mui/material/TextField'
import {
    dropDownSx,
    getOptionKey as getBuiltInOptionKey,
    getOptionLabel as getBuiltInOptionLabel,
    isOptionEqualToValue as areBuiltInOptionsEqual,
    PneAutocompleteKey,
    PneAutocompleteOption,
    PneBuiltInAutocompleteOption,
} from '../../common/paynet/dropdown'
import PneTextField from '../PneTextField'
import {usePneFieldControlProps} from '../PneFieldContext'
import {
    areAutocompleteOptionsEqualBy,
    hasAutocompleteLabel,
    mergeAutocompleteHtmlInputProps,
    PneAutocompleteHtmlInputProps,
    resolveAutocompleteListboxName,
    sanitizeAutocompleteHtmlInputProps,
    withAutocompleteListboxName,
    withoutAutocompleteRootSlot,
} from './PneAutocompleteShared'

export type {PneAutocompleteHtmlInputProps} from './PneAutocompleteShared'

type MuiAutocompleteProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>

type PneAutocompleteAdapterProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Pick<
    MuiAutocompleteProps<NoInfer<T>, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    'getOptionKey' | 'getOptionLabel' | 'isOptionEqualToValue'
>

type PneAutocompleteSlots<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<NonNullable<MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['slots']>, 'root'> & {root?: never}

type PneAutocompleteSlotProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<NonNullable<MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['slotProps']>, 'root'> & {root?: never}

type PneAutocompleteBaseProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<
    MuiAutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    | 'getOptionKey'
    | 'getOptionLabel'
    | 'isOptionEqualToValue'
    | 'options'
    | 'ref'
    | 'renderInput'
    | 'slotProps'
    | 'slots'
> & {
    /** Available domain options. Kept explicit so JSX infers `T` from this collection. */
    options: readonly T[]
    label?: ReactNode
    variant?: TextFieldProps['variant']
    error?: boolean
    helperText?: ReactNode
    placeholder?: string
    required?: boolean
    /** Ref to the actual editable input. */
    inputRef?: React.Ref<HTMLInputElement>
    /** Ref to the stable MUI Autocomplete root div. */
    ref?: React.Ref<HTMLDivElement>
    /** Safe attributes merged onto the actual native input. MUI owns its state and event handlers. */
    htmlInputProps?: PneAutocompleteHtmlInputProps
    /** The root slot is fixed so the root ref always targets an HTMLDivElement. */
    slots?: PneAutocompleteSlots<T, Multiple, DisableClearable, FreeSolo, ChipComponent>
    slotProps?: PneAutocompleteSlotProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>
}

export type PneAutocompleteBuiltInProps<
    T extends PneBuiltInAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = PneAutocompleteBaseProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
> & PneAutocompleteAdapterProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>

export type PneAutocompleteCustomProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = PneAutocompleteBaseProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
> & Required<Pick<
    PneAutocompleteAdapterProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >,
    'getOptionKey' | 'getOptionLabel'
>> & Pick<
    PneAutocompleteAdapterProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >,
    'isOptionEqualToValue'
>

export type PneAutocompleteProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = [T] extends [PneBuiltInAutocompleteOption]
    ? PneAutocompleteBuiltInProps<
        Extract<T, PneBuiltInAutocompleteOption>,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    : PneAutocompleteCustomProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >

export type IProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = PneAutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>

type PneAutocompleteImplementationProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = PneAutocompleteBaseProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
> & PneAutocompleteAdapterProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>

type PneAutocompleteInferredCustomProps<
    Options extends readonly PneAutocompleteOption[],
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<
    PneAutocompleteCustomProps<
        NoInfer<Options[number]>,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >,
    'options'
> & {
    options: Options
}

type PneAutocompleteComponent = {
    <
        const Options extends readonly PneAutocompleteOption[],
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAutocompleteInferredCustomProps<
        Options,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    <
        T extends PneBuiltInAutocompleteOption,
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAutocompleteBuiltInProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    <
        T extends PneAutocompleteOption,
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAutocompleteCustomProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    displayName?: string
}

type PneAutocompleteOptionKeyResolver<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<PneAutocompleteAdapterProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['getOptionKey']>

type PneAutocompleteOptionLabelResolver<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<PneAutocompleteAdapterProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['getOptionLabel']>

type PneAutocompleteOptionEquality<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<PneAutocompleteAdapterProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['isOptionEqualToValue']>

const PneAutocompleteImplementation = <
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
>(rawProps: PneAutocompleteImplementationProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>) => {
    const props = rawProps as typeof rawProps & {as?: unknown; component?: unknown}
    const {
        as: _as,
        component: _component,
        disabled,
        error,
        fullWidth,
        getOptionKey,
        getOptionLabel,
        helperText,
        htmlInputProps,
        id,
        inputRef,
        isOptionEqualToValue,
        label,
        placeholder,
        ref,
        required,
        size = 'small',
        slotProps,
        slots,
        sx,
        variant,
        ...rest
    } = props

    const generatedId = useId()
    const controlProps = usePneFieldControlProps({
        disabled,
        error,
        fullWidth,
        id,
        required,
    })
    const resolvedId = controlProps.id ?? generatedId
    const safeHtmlInputProps = sanitizeAutocompleteHtmlInputProps(htmlInputProps)
    const resolvedOptionKey = (getOptionKey ?? getBuiltInOptionKey) as PneAutocompleteOptionKeyResolver<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const resolvedOptionLabel = (getOptionLabel ?? getBuiltInOptionLabel) as PneAutocompleteOptionLabelResolver<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const resolvedOptionEquality = (isOptionEqualToValue ?? (getOptionKey
        ? (option: T, value: unknown) => areAutocompleteOptionsEqualBy(
            option,
            value,
            resolvedOptionKey as (option: T) => PneAutocompleteKey,
        )
        : areBuiltInOptionsEqual)) as PneAutocompleteOptionEquality<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const listboxName = resolveAutocompleteListboxName({
        controlLabelId: controlProps.labelId,
        hasTextFieldLabel: hasAutocompleteLabel(label),
        htmlInputProps: safeHtmlInputProps,
        inputId: resolvedId,
    })
    const resolvedSlotProps = withAutocompleteListboxName(slotProps, listboxName)
    const resolvedSlots = withoutAutocompleteRootSlot(slots)
    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    return <Autocomplete
        {...rest}
        disabled={controlProps.disabled}
        fullWidth={controlProps.fullWidth}
        getOptionKey={resolvedOptionKey}
        getOptionLabel={resolvedOptionLabel}
        id={resolvedId}
        isOptionEqualToValue={resolvedOptionEquality}
        ref={ref}
        renderInput={params => <PneTextField
            {...params}
            error={controlProps.error ?? false}
            helperText={helperText}
            inputRef={inputRef}
            label={label}
            placeholder={placeholder}
            required={controlProps.required}
            slotProps={{
                ...params.slotProps,
                htmlInput: mergeAutocompleteHtmlInputProps(
                    params.slotProps.htmlInput,
                    safeHtmlInputProps,
                ),
            }}
            variant={variant}
        />}
        size={size}
        slotProps={resolvedSlotProps}
        slots={resolvedSlots}
        sx={innerSx}
    />
}

const PneAutocomplete = PneAutocompleteImplementation as PneAutocompleteComponent

PneAutocomplete.displayName = 'PneAutocomplete'

export default PneAutocomplete
