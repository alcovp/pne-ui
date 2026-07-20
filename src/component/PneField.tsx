import type {FormControlTypeMap} from '@mui/material/FormControl'
import type {FormHelperTextProps} from '@mui/material/FormHelperText'
import type {FormLabelProps} from '@mui/material/FormLabel'
import type {OverridableComponent, OverrideProps} from '@mui/material/OverridableComponent'
import {FormControl, FormHelperText, FormLabel} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import * as React from 'react'
import {
    mergeAriaIds,
    PneFieldContext,
    type PneFieldControlAdapter,
    type PneFieldControlDomProps,
    type ResolvedPneFieldControlDomProps,
} from './PneFieldContext'

type PneFieldDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneFieldLabelSlotProps = Omit<
    FormLabelProps,
    | 'children'
    | 'component'
    | 'disabled'
    | 'error'
    | 'filled'
    | 'focused'
    | 'htmlFor'
    | 'required'
> & {
    ref?: React.Ref<HTMLLabelElement>
} & PneFieldDataAttributes

export type PneFieldHelperTextSlotProps = Omit<
    FormHelperTextProps,
    | 'children'
    | 'component'
    | 'disabled'
    | 'error'
    | 'filled'
    | 'focused'
    | 'margin'
    | 'required'
    | 'variant'
> & {
    ref?: React.Ref<HTMLParagraphElement>
} & PneFieldDataAttributes

export interface PneFieldSlotProps {
    helperText?: PneFieldHelperTextSlotProps
    label?: PneFieldLabelSlotProps
}

export type PneFieldChildren =
    | React.ReactElement
    | ((field: PneFieldControlAdapter) => React.ReactElement)

type RemovedFormControlProp =
    | 'children'
    | 'color'
    | 'disabled'
    | 'error'
    | 'focused'
    | 'fullWidth'
    | 'hiddenLabel'
    | 'required'
    | 'size'
    | 'variant'

type PneFieldOwnProps = Omit<FormControlTypeMap['props'], RemovedFormControlProp> & {
    children: PneFieldChildren
    /** ID owned by the primary control. `PneField` state always wins conflicting child IDs. */
    controlId?: string
    disabled?: boolean
    error?: boolean
    fullWidth?: boolean
    helperText?: React.ReactNode
    /** @deprecated Use `slotProps.helperText.sx`. */
    helperTextSx?: SxProps<Theme>
    /** @deprecated Use `controlId`; kept as a compatibility alias. */
    htmlFor?: string
    /** ID of the field root and namespace for generated label/helper/control IDs. */
    id?: string
    label?: React.ReactNode
    /** @deprecated Use `slotProps.label.sx`. */
    labelSx?: SxProps<Theme>
    required?: boolean
    slotProps?: PneFieldSlotProps
    /** Split FormControl appearance state is intentionally not part of the field contract. */
    color?: never
    focused?: never
    hiddenLabel?: never
    size?: never
    variant?: never
}

type PneFieldTypeMap<
    AdditionalProps = {},
    RootComponent extends React.ElementType = 'div',
> = {
    props: PneFieldOwnProps & AdditionalProps
    defaultComponent: RootComponent
}

export type PneFieldProps<
    RootComponent extends React.ElementType = 'div',
    AdditionalProps = {},
> = OverrideProps<PneFieldTypeMap<AdditionalProps, RootComponent>, RootComponent> & {
    component?: RootComponent
}

type PneFieldComponent = OverridableComponent<PneFieldTypeMap>

const PneFieldImplementation = <C extends React.ElementType = 'div'>(
    props: PneFieldProps<C, {component?: C}>,
) => {
    const {
        children,
        controlId: controlIdProp,
        disabled = false,
        error = false,
        fullWidth = true,
        helperText,
        helperTextSx,
        htmlFor,
        id,
        label,
        labelSx,
        required = false,
        slotProps,
        sx,
        ...rest
    } = props

    const generatedId = React.useId()
    const rootId = normalizeId(id)
    const fieldId = rootId ?? generatedId
    const explicitControlId = normalizeId(controlIdProp)
    const legacyControlId = normalizeId(htmlFor)
    const controlId = explicitControlId ?? legacyControlId ?? `${fieldId}-control`
    const hasLabel = hasRenderableContent(label)
    const hasHelperText = hasRenderableContent(helperText)
    const labelSlotId = normalizeId(slotProps?.label?.id)
    const helperTextSlotId = normalizeId(slotProps?.helperText?.id)
    const labelId = hasLabel ? labelSlotId ?? `${fieldId}-label` : undefined
    const helperTextId = hasHelperText
        ? helperTextSlotId ?? `${fieldId}-helper-text`
        : undefined

    warnAboutFieldIdConflicts({
        controlId,
        controlIdProp: explicitControlId,
        htmlFor: legacyControlId,
        rootId,
    })

    const adapter = React.useMemo<PneFieldControlAdapter>(() => ({
        controlId,
        disabled,
        error,
        fullWidth,
        getControlProps: <ControlProps extends object = PneFieldControlDomProps>(
            controlProps?: ControlProps & PneFieldControlDomProps,
        ) => {
            const ownProps: ControlProps & PneFieldControlDomProps = controlProps
                ?? {} as ControlProps & PneFieldControlDomProps
            const ownId = normalizeId(ownProps.id)

            if (process.env.NODE_ENV !== 'production' && ownId && ownId !== controlId) {
                console.warn(
                    `PneField owns control ID "${controlId}" and ignores conflicting child ID "${ownId}". `
                    + 'Move the ID to PneField controlId.',
                )
            }

            return {
                ...ownProps,
                'aria-describedby': mergeAriaIds(
                    ownProps['aria-describedby'],
                    helperTextId,
                ),
                'aria-disabled': disabled || ownProps.disabled === true
                    ? true
                    : ownProps['aria-disabled'],
                'aria-invalid': error ? true : ownProps['aria-invalid'],
                'aria-labelledby': hasAriaLabel(ownProps['aria-label'])
                    ? undefined
                    : mergeAriaIds(labelId, ownProps['aria-labelledby']),
                'aria-required': required ? true : ownProps['aria-required'],
                disabled: disabled || ownProps.disabled === true,
                id: controlId,
            } as Omit<ControlProps, keyof PneFieldControlDomProps>
                & ResolvedPneFieldControlDomProps
        },
        helperTextId,
        labelId,
        required,
    }), [controlId, disabled, error, fullWidth, helperTextId, labelId, required])

    const resolvedChildren = typeof children === 'function' ? children(adapter) : children
    validateChildren(resolvedChildren, hasLabel)

    const {
        id: _labelId,
        ref: labelRef,
        sx: labelSlotSx,
        ...labelSlotProps
    } = slotProps?.label ?? {}
    const {
        id: _helperTextId,
        ref: helperTextRef,
        sx: helperTextSlotSx,
        ...helperTextSlotProps
    } = slotProps?.helperText ?? {}

    return <FormControl
        disabled={disabled}
        error={error}
        fullWidth={fullWidth}
        id={rootId}
        required={required}
        sx={[
            {
                gap: '4px',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
    >
        {hasLabel
            ? <FormLabel
                {...labelSlotProps}
                htmlFor={controlId}
                id={labelId}
                ref={labelRef}
                required={required}
                sx={[
                    {
                        alignSelf: 'flex-start',
                        color: error ? 'error.main' : 'text.secondary',
                        fontSize: '0.875rem',
                        lineHeight: '20px',
                        maxWidth: '100%',
                        '&.Mui-focused': {
                            color: error ? 'error.main' : 'text.secondary',
                        },
                        '& .MuiFormLabel-asterisk': {
                            color: 'error.main',
                        },
                    },
                    ...(Array.isArray(labelSx) ? labelSx : [labelSx]),
                    ...(Array.isArray(labelSlotSx) ? labelSlotSx : [labelSlotSx]),
                ]}
            >
                {label}
            </FormLabel>
            : null}
        <PneFieldContext.Provider value={adapter}>
            {resolvedChildren}
        </PneFieldContext.Provider>
        {hasHelperText
            ? <FormHelperText
                {...helperTextSlotProps}
                id={helperTextId}
                ref={helperTextRef}
                sx={[
                    {
                        mx: '14px',
                    },
                    ...(Array.isArray(helperTextSx) ? helperTextSx : [helperTextSx]),
                    ...(Array.isArray(helperTextSlotSx) ? helperTextSlotSx : [helperTextSlotSx]),
                ]}
            >
                {helperText}
            </FormHelperText>
            : null}
    </FormControl>
}

const normalizeId = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value.trim()
    if (normalized === '') {
        return undefined
    }

    if (/\s/.test(normalized)) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`PneField ignores invalid ID containing whitespace: "${value}".`)
        }

        return undefined
    }

    return normalized
}

const hasRenderableContent = (value: React.ReactNode): boolean =>
    value !== undefined && value !== null && typeof value !== 'boolean' && value !== ''

const hasAriaLabel = (value: React.AriaAttributes['aria-label']): boolean =>
    typeof value === 'string' && value.trim() !== ''

const warnAboutFieldIdConflicts = (
    options: {
        controlId: string
        controlIdProp?: string
        htmlFor?: string
        rootId?: string
    },
) => {
    if (process.env.NODE_ENV === 'production') {
        return
    }

    if (options.controlIdProp && options.htmlFor && options.controlIdProp !== options.htmlFor) {
        console.warn(
            `PneField controlId "${options.controlIdProp}" overrides conflicting deprecated htmlFor `
            + `"${options.htmlFor}".`,
        )
    }

    if (options.rootId && options.rootId === options.controlId) {
        console.warn(
            `PneField root ID and controlId are both "${options.rootId}". `
            + 'Use distinct IDs to avoid duplicate DOM IDs.',
        )
    }
}

const validateChildren = (children: React.ReactElement, hasLabel: boolean) => {
    const directChildren = React.isValidElement<{children?: React.ReactNode}>(children)
        && children.type === React.Fragment
        ? children.props.children
        : children

    if (React.Children.count(directChildren) !== 1) {
        throw new Error('PneField expects exactly one logical control or group.')
    }

    if (process.env.NODE_ENV === 'production') {
        return
    }

    if (
        hasLabel
        && React.isValidElement<{label?: React.ReactNode}>(children)
        && hasRenderableContent(children.props.label)
    ) {
        console.warn(
            'PneField and its direct child both provide labels. Use one label owner to avoid an ambiguous accessible name.',
        )
    }
}

PneFieldImplementation.displayName = 'PneField'

const PneField = PneFieldImplementation as PneFieldComponent

export default PneField
