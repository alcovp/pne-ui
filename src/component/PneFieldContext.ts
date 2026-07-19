import {createContext, useContext} from 'react'

export interface PneFieldContextValue {
    controlId?: string
    disabled?: boolean
    error?: boolean
    fullWidth?: boolean
    helperTextId?: string
    labelId?: string
    required?: boolean
}

export interface PneFieldControlProps {
    ariaDescribedBy?: string
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

export const PneFieldContext = createContext<PneFieldContextValue | undefined>(undefined)

export const usePneFieldContext = (): PneFieldContextValue | undefined => useContext(PneFieldContext)

export const usePneFieldControlProps = (
    props: PneFieldControlProps = {},
): ResolvedPneFieldControlProps => {
    const fieldContext = usePneFieldContext()

    return {
        ariaDescribedBy: mergeAriaDescribedBy(props.ariaDescribedBy, fieldContext?.helperTextId),
        ariaRequired: props.required !== true && fieldContext?.required
            ? true
            : undefined,
        disabled: props.disabled ?? fieldContext?.disabled,
        error: props.error ?? fieldContext?.error,
        fullWidth: props.fullWidth ?? fieldContext?.fullWidth,
        id: props.id ?? fieldContext?.controlId,
        labelId: fieldContext?.labelId,
        required: props.required,
    }
}

export const mergeAriaDescribedBy = (
    ...ids: Array<string | undefined>
): string | undefined => {
    const mergedIds = ids
        .flatMap(id => id?.split(/\s+/) ?? [])
        .filter((id, index, allIds) => id !== '' && allIds.indexOf(id) === index)

    return mergedIds.length > 0 ? mergedIds.join(' ') : undefined
}
