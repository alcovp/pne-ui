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
        ariaDescribedBy,
        ariaRequired: controlProps.ariaRequired,
        controlAriaDescribedBy: controlProps.ariaDescribedBy,
        controlLabelId: label !== undefined && label !== null && label !== ''
            ? undefined
            : controlProps.labelId,
        defaultHelperTextId: `${resolvedId}-helper-text`,
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
    ariaDescribedBy?: string
    ariaRequired?: boolean
    controlAriaDescribedBy?: string
    controlLabelId?: string
    defaultHelperTextId: string
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
        ariaDescribedBy,
        ariaRequired,
        controlAriaDescribedBy,
        controlLabelId,
        defaultHelperTextId,
        hasHelperText,
        select,
        slotProps,
    } = options
    const inputSlotProps = getSlotPropsObject(slotProps?.input)
    const htmlInputSlotProps = getSlotPropsObject(slotProps?.htmlInput)
    const formHelperTextSlotProps = getSlotPropsObject(slotProps?.formHelperText)
    const selectSlotProps = getSlotPropsObject(slotProps?.select)
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

    if (
        !resolvedAriaDescribedBy
        && !ariaRequired
        && !helperTextId
        && !(select && controlLabelId)
    ) {
        return slotProps
    }

    return {
        ...slotProps,
        formHelperText: helperTextId
            ? withId(formHelperTextSlotProps, helperTextId)
            : slotProps?.formHelperText,
        htmlInput: withAccessibility(
            htmlInputSlotProps,
            resolvedAriaDescribedBy,
            ariaRequired,
        ),
        input: withAccessibility(inputSlotProps, resolvedAriaDescribedBy),
        select: select
            ? withSelectAccessibility(
                selectSlotProps,
                resolvedAriaDescribedBy,
                ariaRequired,
                controlLabelId,
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
            ariaDescribedBy,
            ariaRequired,
            controlAriaDescribedBy,
            controlLabelId,
            defaultHelperTextId,
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

        cachedOwnerState = ownerState
        cachedSlots = {
            formHelperText: helperTextId
                ? withId(formHelperTextSlotProps, helperTextId)
                : formHelperTextSlotProps,
            htmlInput: withAccessibility(
                htmlInputSlotProps,
                resolvedAriaDescribedBy,
                ariaRequired,
            ),
            input: withAccessibility(inputSlotProps, resolvedAriaDescribedBy),
            select: withSelectAccessibility(
                selectSlotProps,
                resolvedAriaDescribedBy,
                ariaRequired,
                controlLabelId,
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

const getId = (props: ResolvedSlotProps | undefined): string | undefined => {
    const value = props?.id

    return typeof value === 'string' && value !== '' ? value : undefined
}

const withAccessibility = (
    slotProps: ResolvedSlotProps | undefined,
    ariaDescribedBy?: string,
    ariaRequired?: boolean,
): ResolvedSlotProps => ({
    ...slotProps,
    ...(ariaDescribedBy ? {'aria-describedby': ariaDescribedBy} : {}),
    ...(ariaRequired ? {'aria-required': true} : {}),
})

const withSelectAccessibility = (
    slotProps: ResolvedSlotProps | undefined,
    ariaDescribedBy?: string,
    ariaRequired?: boolean,
    controlLabelId?: string,
): ResolvedSlotProps => {
    const displayProps = getPropsObject(slotProps?.SelectDisplayProps)
    const displayAriaDescribedBy = mergeAriaDescribedBy(
        ariaDescribedBy,
        getAriaDescribedBy(displayProps),
    )
    const resolvedDisplayProps = displayProps || displayAriaDescribedBy || ariaRequired
        ? withAccessibility(displayProps, displayAriaDescribedBy, ariaRequired)
        : undefined

    return {
        ...slotProps,
        ...(controlLabelId && !getStringProperty(slotProps, 'labelId')
            ? {labelId: controlLabelId}
            : {}),
        ...(ariaDescribedBy ? {'aria-describedby': ariaDescribedBy} : {}),
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

export default PneTextField
