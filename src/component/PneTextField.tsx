import React, {forwardRef, useId, useMemo} from 'react'
import {TextField, TextFieldOwnerState, TextFieldProps} from '@mui/material'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {useTheme} from '@mui/material/styles'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import {mergeAriaDescribedBy, usePneFieldControlProps} from './PneFieldContext'

export type PneTextFieldProps = TextFieldProps

type PneTextFieldSlotProps = NonNullable<PneTextFieldProps['slotProps']>
type PneTextFieldSlotName = keyof PneTextFieldSlotProps
type PneTextFieldSlotProp = PneTextFieldSlotProps[PneTextFieldSlotName]
type ResolvedSlotProps = Record<string, unknown>

interface ResolvedAccessibilitySlots {
    formHelperText: ResolvedSlotProps
    htmlInput: ResolvedSlotProps
    input: ResolvedSlotProps
    select: ResolvedSlotProps
}

const PneTextField = forwardRef<HTMLDivElement, PneTextFieldProps>((props, ref) => {
    const propsWithDefaultSize: PneTextFieldProps = props.size === undefined
        ? {...props, size: 'small'}
        : props
    const themedProps = useDefaultProps({
        name: 'MuiTextField',
        props: propsWithDefaultSize,
    })
    const componentsWithoutTextFieldDefaults = useComponentsWithoutTextFieldDefaults()
    const {
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': ariaInvalid,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        'aria-required': ariaRequired,
        disabled,
        error,
        fullWidth,
        helperText,
        id,
        label,
        required,
        select = false,
        size = 'small',
        slotProps,
        sx,
        ...rest
    } = themedProps

    const generatedId = useId()
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy,
        ariaInvalid,
        ariaLabelledBy,
        ariaRequired,
        disabled: props.disabled,
        error: props.error,
        fullWidth: props.fullWidth,
        id: props.id,
        required,
    })
    const resolvedDisabled = controlProps.disabled ?? disabled
    const resolvedError = controlProps.error ?? error
    const resolvedFullWidth = controlProps.fullWidth ?? fullWidth
    const resolvedId = controlProps.id ?? id ?? generatedId
    const resolvedSlotProps = createResolvedSlotProps({
        ariaLabel,
        ariaDescribedBy,
        ariaRequired: controlProps.ariaRequired,
        controlAriaDescribedBy: controlProps.ariaDescribedBy,
        controlAriaInvalid: controlProps.ariaInvalid,
        controlAriaLabelledBy: label !== undefined && label !== null && label !== ''
            ? ariaLabelledBy
            : controlProps.ariaLabelledBy,
        controlId: resolvedId,
        controlLabelId: label !== undefined && label !== null && label !== ''
            ? undefined
            : controlProps.labelId,
        defaultHelperTextId: `${resolvedId}-helper-text`,
        forceDisabled: resolvedDisabled === true,
        forceAriaInvalid: resolvedError === true,
        hasHelperText: Boolean(helperText),
        select,
        slotProps,
    })

    return <DefaultPropsProvider value={componentsWithoutTextFieldDefaults}>
        <TextField
            disabled={resolvedDisabled}
            error={resolvedError}
            fullWidth={resolvedFullWidth}
            helperText={helperText}
            id={resolvedId}
            label={label}
            ref={ref}
            required={controlProps.required}
            select={select}
            size={size}
            slotProps={resolvedSlotProps}
            sx={sx}
            {...rest}
        />
    </DefaultPropsProvider>
})

PneTextField.displayName = 'PneTextField'

interface CreateResolvedSlotPropsOptions {
    ariaLabel?: string
    ariaDescribedBy?: string
    ariaRequired?: boolean
    controlAriaDescribedBy?: string
    controlAriaInvalid?: React.AriaAttributes['aria-invalid']
    controlAriaLabelledBy?: string
    controlId: string
    controlLabelId?: string
    defaultHelperTextId: string
    forceDisabled: boolean
    forceAriaInvalid: boolean
    hasHelperText: boolean
    select: boolean
    slotProps?: PneTextFieldProps['slotProps']
}

const useComponentsWithoutTextFieldDefaults = () => {
    const theme = useTheme()

    return useMemo(() => {
        // PneTextField resolves MuiTextField defaults before composing cross-slot ARIA.
        // Keep every descendant component config, but do not apply TextField defaults twice.
        const components = theme.components
        const textFieldConfig = components?.MuiTextField

        if (!textFieldConfig?.defaultProps) {
            return components ?? {}
        }

        const textFieldConfigWithoutDefaults = {...textFieldConfig}
        Reflect.deleteProperty(textFieldConfigWithoutDefaults, 'defaultProps')

        return {
            ...components,
            MuiTextField: Object.keys(textFieldConfigWithoutDefaults).length > 0
                ? textFieldConfigWithoutDefaults
                : undefined,
        }
    }, [theme.components])
}

const createResolvedSlotProps = (
    options: CreateResolvedSlotPropsOptions,
): PneTextFieldProps['slotProps'] => {
    const {slotProps} = options
    const hasFunctionalSlotProps = [
        slotProps?.formHelperText,
        slotProps?.htmlInput,
        slotProps?.input,
        options.select ? slotProps?.select : undefined,
    ].some(slotProp => typeof slotProp === 'function')

    if (hasFunctionalSlotProps) {
        return createFunctionalSlotProps(options)
    }

    return createObjectSlotProps(options)
}

const createObjectSlotProps = (
    options: CreateResolvedSlotPropsOptions,
): PneTextFieldProps['slotProps'] => {
    const {
        ariaLabel,
        ariaDescribedBy,
        ariaRequired,
        controlAriaDescribedBy,
        controlAriaInvalid,
        controlAriaLabelledBy,
        controlId,
        controlLabelId,
        defaultHelperTextId,
        forceDisabled,
        forceAriaInvalid,
        hasHelperText,
        select,
        slotProps,
    } = options
    const inputSlotProps = getSlotPropsObject(slotProps?.input)
    const htmlInputSlotProps = getSlotPropsObject(slotProps?.htmlInput)
    const formHelperTextSlotProps = getSlotPropsObject(slotProps?.formHelperText)
    const selectSlotProps = getSlotPropsObject(slotProps?.select)
    const isNativeSelect = selectSlotProps?.native === true
    const helperTextId = hasHelperText
        ? getId(formHelperTextSlotProps) ?? defaultHelperTextId
        : undefined
    const resolvedAriaDescribedBy = mergeAriaDescribedBy(
        ariaDescribedBy,
        getAriaDescribedBy(inputSlotProps),
        getAriaDescribedBy(htmlInputSlotProps),
        select ? getAriaDescribedBy(selectSlotProps) : undefined,
        select ? getAriaDescribedBy(getPropsObject(selectSlotProps?.SelectDisplayProps)) : undefined,
        helperTextId,
        controlAriaDescribedBy,
    )
    const resolvedAriaLabel = resolveAriaLabel(
        ariaLabel,
        inputSlotProps,
        htmlInputSlotProps,
    )
    const resolvedAriaLabelledBy = resolveAriaLabelledBy(
        controlAriaLabelledBy,
        inputSlotProps,
        htmlInputSlotProps,
        Boolean(resolvedAriaLabel),
    )
    const resolvedAriaInvalid = resolveAriaInvalid(
        controlAriaInvalid,
        forceAriaInvalid,
        inputSlotProps,
        htmlInputSlotProps,
    )

    return {
        ...slotProps,
        formHelperText: helperTextId
            ? withId(formHelperTextSlotProps, helperTextId)
            : slotProps?.formHelperText,
        htmlInput: withAccessibility(
            htmlInputSlotProps,
            resolvedAriaDescribedBy,
            ariaRequired,
            resolvedAriaInvalid,
            resolvedAriaLabel,
            resolvedAriaLabelledBy,
            !select || isNativeSelect ? controlId : undefined,
            forceDisabled,
        ),
        input: {
            ...withAccessibility(inputSlotProps, resolvedAriaDescribedBy),
            ...(forceDisabled ? {disabled: true} : {}),
            ...(forceAriaInvalid ? {error: true} : {}),
        },
        select: select
            ? withSelectAccessibility(
                selectSlotProps,
                {
                    ariaDescribedBy: resolvedAriaDescribedBy,
                    ariaInvalid: resolvedAriaInvalid,
                    ariaLabel: resolvedAriaLabel,
                    ariaLabelledBy: resolvedAriaLabelledBy,
                    ariaRequired,
                    controlId,
                    controlLabelId,
                    forceDisabled,
                    forceAriaInvalid,
                },
            )
            : slotProps?.select,
    }
}

const createFunctionalSlotProps = (
    options: CreateResolvedSlotPropsOptions,
): PneTextFieldProps['slotProps'] => {
    const {hasHelperText, select, slotProps} = options
    const resolveSlots = createAccessibilitySlotResolver(options)

    return {
        ...slotProps,
        formHelperText: hasHelperText
            ? ownerState => resolveSlots(ownerState).formHelperText
            : slotProps?.formHelperText,
        htmlInput: ownerState => resolveSlots(ownerState).htmlInput,
        input: ownerState => resolveSlots(ownerState).input,
        select: select
            ? ownerState => resolveSlots(ownerState).select
            : slotProps?.select,
    }
}

const createAccessibilitySlotResolver = (
    options: CreateResolvedSlotPropsOptions,
): ((ownerState: TextFieldOwnerState) => ResolvedAccessibilitySlots) => {
    let cachedOwnerState: TextFieldOwnerState | undefined
    let cachedSlots: ResolvedAccessibilitySlots | undefined

    return ownerState => {
        if (cachedSlots && cachedOwnerState === ownerState) {
            return cachedSlots
        }

        const {
            ariaLabel,
            ariaDescribedBy,
            ariaRequired,
            controlAriaDescribedBy,
            controlAriaInvalid,
            controlAriaLabelledBy,
            controlId,
            controlLabelId,
            defaultHelperTextId,
            forceDisabled,
            forceAriaInvalid,
            hasHelperText,
            select,
            slotProps,
        } = options
        const inputSlotProps = resolveSlotProps(slotProps?.input, ownerState)
        const htmlInputSlotProps = resolveSlotProps(slotProps?.htmlInput, ownerState)
        const formHelperTextSlotProps = hasHelperText
            ? resolveSlotProps(slotProps?.formHelperText, ownerState)
            : {}
        const selectSlotProps = select
            ? resolveSlotProps(slotProps?.select, ownerState)
            : {}
        const isNativeSelect = selectSlotProps.native === true
        const helperTextId = hasHelperText
            ? getId(formHelperTextSlotProps) ?? defaultHelperTextId
            : undefined
        const resolvedAriaDescribedBy = mergeAriaDescribedBy(
            ariaDescribedBy,
            getAriaDescribedBy(inputSlotProps),
            getAriaDescribedBy(htmlInputSlotProps),
            select ? getAriaDescribedBy(selectSlotProps) : undefined,
            select ? getAriaDescribedBy(getPropsObject(selectSlotProps?.SelectDisplayProps)) : undefined,
            helperTextId,
            controlAriaDescribedBy,
        )
        const resolvedAriaLabel = resolveAriaLabel(
            ariaLabel,
            inputSlotProps,
            htmlInputSlotProps,
        )
        const resolvedAriaLabelledBy = resolveAriaLabelledBy(
            controlAriaLabelledBy,
            inputSlotProps,
            htmlInputSlotProps,
            Boolean(resolvedAriaLabel),
        )
        const resolvedAriaInvalid = resolveAriaInvalid(
            controlAriaInvalid,
            forceAriaInvalid,
            inputSlotProps,
            htmlInputSlotProps,
        )

        cachedOwnerState = ownerState
        cachedSlots = {
            formHelperText: helperTextId
                ? withId(formHelperTextSlotProps, helperTextId)
                : formHelperTextSlotProps,
            htmlInput: withAccessibility(
                htmlInputSlotProps,
                resolvedAriaDescribedBy,
                ariaRequired,
                resolvedAriaInvalid,
                resolvedAriaLabel,
                resolvedAriaLabelledBy,
                !select || isNativeSelect ? controlId : undefined,
                forceDisabled,
            ),
            input: {
                ...withAccessibility(inputSlotProps, resolvedAriaDescribedBy),
                ...(forceDisabled ? {disabled: true} : {}),
                ...(forceAriaInvalid ? {error: true} : {}),
            },
            select: withSelectAccessibility(
                selectSlotProps,
                {
                    ariaDescribedBy: resolvedAriaDescribedBy,
                    ariaInvalid: resolvedAriaInvalid,
                    ariaLabel: resolvedAriaLabel,
                    ariaLabelledBy: resolvedAriaLabelledBy,
                    ariaRequired,
                    controlId,
                    controlLabelId,
                    forceDisabled,
                    forceAriaInvalid,
                },
            ),
        }

        return cachedSlots
    }
}

const resolveSlotProps = (
    slotProps: PneTextFieldSlotProp | undefined,
    ownerState: TextFieldOwnerState,
): ResolvedSlotProps => {
    if (typeof slotProps === 'function') {
        const resolve = slotProps as (state: TextFieldOwnerState) => ResolvedSlotProps
        const resolvedSlotProps = resolve(ownerState)

        return resolvedSlotProps ?? {}
    }

    return (slotProps as ResolvedSlotProps | undefined) ?? {}
}

const getSlotPropsObject = (
    slotProps: PneTextFieldSlotProp | undefined,
): ResolvedSlotProps | undefined => {
    return typeof slotProps === 'function'
        ? undefined
        : slotProps as ResolvedSlotProps | undefined
}

const getAriaDescribedBy = (
    props: ResolvedSlotProps | undefined,
): string | undefined => {
    const value = props?.['aria-describedby']

    return typeof value === 'string' ? value : undefined
}

const getAriaInvalid = (
    props: ResolvedSlotProps | undefined,
): React.AriaAttributes['aria-invalid'] | undefined => {
    const value = props?.['aria-invalid']

    return value === false
        || value === true
        || value === 'false'
        || value === 'grammar'
        || value === 'spelling'
        || value === 'true'
        ? value
        : undefined
}

const getId = (props: ResolvedSlotProps | undefined): string | undefined => {
    const value = props?.id

    return typeof value === 'string' && value !== '' ? value : undefined
}

const withAccessibility = (
    slotProps: ResolvedSlotProps | undefined,
    ariaDescribedBy?: string,
    ariaRequired?: boolean,
    ariaInvalid?: React.AriaAttributes['aria-invalid'],
    ariaLabel?: string,
    ariaLabelledBy?: string,
    controlId?: string,
    forceDisabled = false,
): ResolvedSlotProps => ({
    ...slotProps,
    ...(ariaDescribedBy ? {'aria-describedby': ariaDescribedBy} : {}),
    ...(ariaInvalid !== undefined ? {'aria-invalid': ariaInvalid} : {}),
    ...(ariaLabel ? {'aria-label': ariaLabel} : {}),
    ...(ariaLabel ? {'aria-labelledby': undefined} : {}),
    ...(ariaLabelledBy ? {'aria-labelledby': ariaLabelledBy} : {}),
    ...(ariaRequired ? {'aria-required': true} : {}),
    ...(controlId ? {id: controlId} : {}),
    ...(forceDisabled ? {'aria-disabled': true, disabled: true} : {}),
})

const resolveAriaLabel = (
    topLevelAriaLabel: string | undefined,
    inputSlotProps: ResolvedSlotProps | undefined,
    htmlInputSlotProps: ResolvedSlotProps | undefined,
): string | undefined => getNonBlankStringProperty(htmlInputSlotProps, 'aria-label')
    ?? getNonBlankStringProperty(inputSlotProps, 'aria-label')
    ?? getNonBlankString(topLevelAriaLabel)

const resolveAriaLabelledBy = (
    controlAriaLabelledBy: string | undefined,
    inputSlotProps: ResolvedSlotProps | undefined,
    htmlInputSlotProps: ResolvedSlotProps | undefined,
    hasAriaLabel: boolean,
): string | undefined => {
    if (hasAriaLabel) {
        return undefined
    }

    return mergeAriaDescribedBy(
        controlAriaLabelledBy,
        getStringProperty(inputSlotProps, 'aria-labelledby'),
        getStringProperty(htmlInputSlotProps, 'aria-labelledby'),
    )
}

const resolveAriaInvalid = (
    controlAriaInvalid: React.AriaAttributes['aria-invalid'] | undefined,
    forceAriaInvalid: boolean,
    inputSlotProps: ResolvedSlotProps | undefined,
    htmlInputSlotProps: ResolvedSlotProps | undefined,
): React.AriaAttributes['aria-invalid'] | undefined => forceAriaInvalid
    ? true
    : getAriaInvalid(htmlInputSlotProps)
        ?? getAriaInvalid(inputSlotProps)
        ?? controlAriaInvalid

interface SelectAccessibilityOptions {
    ariaDescribedBy?: string
    ariaInvalid?: React.AriaAttributes['aria-invalid']
    ariaLabel?: string
    ariaLabelledBy?: string
    ariaRequired?: boolean
    controlId: string
    controlLabelId?: string
    forceDisabled: boolean
    forceAriaInvalid: boolean
}

const withSelectAccessibility = (
    slotProps: ResolvedSlotProps | undefined,
    options: SelectAccessibilityOptions,
): ResolvedSlotProps => {
    const displayProps = getPropsObject(slotProps?.SelectDisplayProps)
    const displayAriaDescribedBy = mergeAriaDescribedBy(
        options.ariaDescribedBy,
        getAriaDescribedBy(displayProps),
    )
    const resolvedAriaLabel = getNonBlankStringProperty(displayProps, 'aria-label')
        ?? getNonBlankStringProperty(slotProps, 'aria-label')
        ?? getNonBlankString(options.ariaLabel)
    const resolvedAriaLabelledBy = resolvedAriaLabel
        ? undefined
        : mergeAriaDescribedBy(
            options.ariaLabelledBy,
            getStringProperty(slotProps, 'labelId'),
            getStringProperty(slotProps, 'aria-labelledby'),
            getStringProperty(displayProps, 'aria-labelledby'),
        )
    const resolvedAriaInvalid = options.forceAriaInvalid
        ? true
        : getAriaInvalid(displayProps)
            ?? getAriaInvalid(slotProps)
            ?? options.ariaInvalid
    const resolvedDisplayProps = displayProps
        || displayAriaDescribedBy
        || resolvedAriaInvalid !== undefined
        || resolvedAriaLabel
        || resolvedAriaLabelledBy
        || options.ariaRequired
        || options.forceDisabled
        ? {
            ...withAccessibility(
                displayProps,
                displayAriaDescribedBy,
                options.ariaRequired,
                resolvedAriaInvalid,
                resolvedAriaLabel,
                resolvedAriaLabelledBy,
                options.controlId,
            ),
            ...(options.forceDisabled ? {'aria-disabled': true} : {}),
        }
        : undefined

    return {
        ...slotProps,
        ...(options.forceDisabled ? {disabled: true} : {}),
        ...(options.forceAriaInvalid ? {error: true} : {}),
        id: options.controlId,
        ...(options.controlLabelId ? {labelId: options.controlLabelId} : {}),
        ...(options.ariaDescribedBy
            ? {'aria-describedby': options.ariaDescribedBy}
            : {}),
        ...(resolvedDisplayProps ? {SelectDisplayProps: resolvedDisplayProps} : {}),
    }
}

const withId = (
    slotProps: ResolvedSlotProps | undefined,
    id: string,
): ResolvedSlotProps => ({
    ...slotProps,
    id,
})

const getPropsObject = (value: unknown): ResolvedSlotProps | undefined => {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as ResolvedSlotProps
        : undefined
}

const getStringProperty = (
    props: ResolvedSlotProps | undefined,
    property: string,
): string | undefined => {
    const value = props?.[property]

    return typeof value === 'string' && value !== '' ? value : undefined
}

const getNonBlankStringProperty = (
    props: ResolvedSlotProps | undefined,
    property: string,
): string | undefined => getNonBlankString(props?.[property])

const getNonBlankString = (value: unknown): string | undefined => {
    return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

export default PneTextField
