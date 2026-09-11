import {createContext, useContext} from 'react'
import type {AriaAttributes} from 'react'

export interface PneFieldControlDomProps {
    'aria-describedby'?: string
    'aria-disabled'?: AriaAttributes['aria-disabled']
    'aria-invalid'?: AriaAttributes['aria-invalid']
    'aria-label'?: AriaAttributes['aria-label']
    'aria-labelledby'?: string
    'aria-required'?: AriaAttributes['aria-required']
    disabled?: boolean
    id?: string
}

export interface ResolvedPneFieldControlDomProps extends Omit<
    PneFieldControlDomProps,
    'disabled' | 'id'
> {
    disabled: boolean
    id: string
}

export interface PneFieldControlAdapter {
    readonly controlId: string
    readonly disabled: boolean
    readonly error: boolean
    readonly fullWidth: boolean
    readonly helperTextId?: string
    readonly labelId?: string
    readonly required: boolean
    getControlProps: <Props extends object = PneFieldControlDomProps>(
        props?: Props & PneFieldControlDomProps,
    ) => Omit<Props, keyof PneFieldControlDomProps> & ResolvedPneFieldControlDomProps
}

export interface PneFieldControlProps {
    ariaDescribedBy?: string
    ariaInvalid?: AriaAttributes['aria-invalid']
    ariaLabelledBy?: string
    ariaRequired?: AriaAttributes['aria-required']
    disabled?: boolean
    error?: boolean
    fullWidth?: boolean
    id?: string
    required?: boolean
}

export interface ResolvedPneFieldControlProps extends PneFieldControlProps {
    ariaRequired?: boolean
    labelId?: string
}

export const PneFieldContext = createContext<PneFieldControlAdapter | undefined>(undefined)

export const usePneFieldControl = (): PneFieldControlAdapter | undefined => useContext(PneFieldContext)

export const usePneFieldControlProps = (
    props: PneFieldControlProps = {},
): ResolvedPneFieldControlProps => {
    const field = usePneFieldControl()
    const ariaInvalid = props.error === undefined
        ? props.ariaInvalid
        : props.error
            ? true
            : props.ariaInvalid ?? false
    const controlProps = field?.getControlProps({
        'aria-describedby': props.ariaDescribedBy,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': props.ariaLabelledBy,
        'aria-required': props.ariaRequired,
        disabled: props.disabled,
        id: props.id,
    })

    return {
        ariaDescribedBy: controlProps?.['aria-describedby'] ?? props.ariaDescribedBy,
        ariaInvalid: controlProps?.['aria-invalid'] ?? ariaInvalid,
        ariaLabelledBy: controlProps?.['aria-labelledby'] ?? props.ariaLabelledBy,
        ariaRequired: isAriaTrue(controlProps?.['aria-required']) || isAriaTrue(props.ariaRequired)
            ? true
            : undefined,
        disabled: controlProps?.disabled ?? props.disabled,
        error: field?.error === true || props.error === true
            ? true
            : props.error ?? field?.error,
        fullWidth: props.fullWidth ?? field?.fullWidth,
        id: controlProps?.id ?? props.id,
        labelId: field?.labelId,
        required: props.required,
    }
}

export const mergeAriaIds = (
    ...ids: Array<string | undefined>
): string | undefined => {
    const mergedIds = ids
        .flatMap(id => id?.split(/\s+/) ?? [])
        .filter((id, index, allIds) => id !== '' && allIds.indexOf(id) === index)

    return mergedIds.length > 0 ? mergedIds.join(' ') : undefined
}

const isAriaTrue = (value: AriaAttributes['aria-required']): boolean =>
    value === true || value === 'true'

/** @deprecated Use `mergeAriaIds`; this alias remains for internal source compatibility. */
export const mergeAriaDescribedBy = mergeAriaIds
