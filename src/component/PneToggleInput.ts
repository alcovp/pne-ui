import * as React from 'react'

import {mergeAriaDescribedBy} from './PneFieldContext'

type ToggleInputSlotProps = Record<string, unknown> & {
    onClick?: React.MouseEventHandler<HTMLInputElement>
    ref?: React.Ref<HTMLInputElement>
}

interface ComposeToggleInputSlotPropsOptions {
    describedBy?: string
    forceInvalid?: boolean
    forceRequired?: boolean
    inputAriaProps: React.AriaAttributes
    inputRef?: React.Ref<HTMLInputElement>
    indeterminate?: boolean
    internalInputRef?: React.Ref<HTMLInputElement>
    labelId?: string
    mergeClassNameAndStyle?: boolean
    readOnly?: boolean
    role?: React.AriaRole
}

export const moveAriaPropsToInput = <Props extends object>(
    props: Props,
): {inputAriaProps: React.AriaAttributes; rootProps: Props} => {
    const rootProps = {...props} as Record<string, unknown>
    const inputAriaProps: Record<string, unknown> = {}

    Object.keys(rootProps).forEach(propName => {
        if (!propName.startsWith('aria-')) {
            return
        }

        inputAriaProps[propName] = rootProps[propName]
        Reflect.deleteProperty(rootProps, propName)
    })

    return {
        inputAriaProps: inputAriaProps as React.AriaAttributes,
        rootProps: rootProps as Props,
    }
}

export const composeToggleInputSlotProps = <OwnerState, >(
    externalInputSlotProps: readonly unknown[],
    options: ComposeToggleInputSlotPropsOptions,
): ((ownerState: OwnerState) => ToggleInputSlotProps) => {
    return ownerState => {
        const resolvedExternalProps = externalInputSlotProps.map(slotProps => (
            resolveInputSlotProps<OwnerState>(slotProps, ownerState)
        ))
        const externalProps = mergeExternalInputSlotProps(
            resolvedExternalProps,
            options.mergeClassNameAndStyle,
        )
        const topLevelAriaProps = options.inputAriaProps as unknown as Record<string, unknown>
        const externalOnClick = externalProps.onClick
        const mergedRef = mergeRefs(
            options.internalInputRef,
            options.inputRef,
            ...resolvedExternalProps.map(slotProps => slotProps.ref),
        )
        const resolvedProps: ToggleInputSlotProps = {
            ...topLevelAriaProps,
            ...externalProps,
            'aria-describedby': mergeAriaDescribedBy(
                getString(topLevelAriaProps['aria-describedby']),
                ...resolvedExternalProps.map(slotProps => (
                    getString(slotProps['aria-describedby'])
                )),
                options.describedBy,
            ),
            'aria-labelledby': mergeAriaDescribedBy(
                getString(topLevelAriaProps['aria-labelledby']),
                ...resolvedExternalProps.map(slotProps => (
                    getString(slotProps['aria-labelledby'])
                )),
                options.labelId,
            ),
            'aria-invalid': options.forceInvalid
                ? true
                : externalProps['aria-invalid'] ?? topLevelAriaProps['aria-invalid'],
            'aria-readonly': options.readOnly
                ? true
                : externalProps['aria-readonly'] ?? topLevelAriaProps['aria-readonly'],
            'aria-required': options.forceRequired
                ? true
                : externalProps['aria-required'] ?? topLevelAriaProps['aria-required'],
        }

        if (options.indeterminate) {
            resolvedProps['aria-checked'] = 'mixed'
        }

        if (mergedRef) {
            resolvedProps.ref = mergedRef
        }

        if (options.role) {
            resolvedProps.role = options.role
        }

        if (options.readOnly) {
            resolvedProps.readOnly = true
            resolvedProps.onClick = event => {
                // Native checkboxes ignore `readOnly`; cancelling their click is what
                // keeps pointer, label, and keyboard activation from changing state.
                event.preventDefault()
                externalOnClick?.(event)
            }
        }

        return resolvedProps
    }
}

const mergeExternalInputSlotProps = (
    slotProps: ToggleInputSlotProps[],
    mergeClassNameAndStyle = false,
): ToggleInputSlotProps => {
    const merged = Object.assign({}, ...slotProps) as ToggleInputSlotProps

    if (!mergeClassNameAndStyle) {
        return merged
    }

    const classNames = slotProps
        .map(props => props.className)
        .filter((className): className is string => typeof className === 'string' && className !== '')
    const styles = slotProps
        .map(props => props.style)
        .filter(isObject)

    if (classNames.length > 0) {
        merged.className = classNames.join(' ')
    }

    if (styles.length > 0) {
        merged.style = Object.assign({}, ...styles)
    }

    return merged
}

const resolveInputSlotProps = <OwnerState, >(
    slotProps: unknown,
    ownerState: OwnerState,
): ToggleInputSlotProps => {
    const resolved = typeof slotProps === 'function'
        ? (slotProps as (state: OwnerState) => unknown)(ownerState)
        : slotProps

    return isObject(resolved)
        ? resolved as ToggleInputSlotProps
        : {}
}

const getString = (value: unknown): string | undefined => {
    return typeof value === 'string' ? value : undefined
}

const isObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object'
}

const mergeRefs = <Element, >(
    ...refs: Array<React.Ref<Element> | undefined>
): React.RefCallback<Element> | undefined => {
    const definedRefs = refs.filter(
        (ref): ref is NonNullable<React.Ref<Element>> => ref != null,
    )

    if (definedRefs.length === 0) {
        return undefined
    }

    let cleanups: Array<() => void> = []

    return element => {
        cleanups.forEach(cleanup => cleanup())
        cleanups = []

        if (element === null) {
            return
        }

        cleanups = definedRefs.map(ref => {
            if (typeof ref === 'function') {
                const cleanup = ref(element)

                return typeof cleanup === 'function'
                    ? cleanup
                    : () => ref(null)
            }

            ref.current = element
            return () => {
                ref.current = null
            }
        })
    }
}
