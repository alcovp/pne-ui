import {type RefObject, useCallback, useEffect, useRef, useState} from 'react'

const holdsValue = (root: HTMLElement | null): boolean => {
    if (!root) {
        return false
    }

    const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')

    return Boolean(input?.value) || root.querySelector('.MuiAutocomplete-tag') !== null
}

const isValue = (value: unknown): boolean =>
    value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)

/**
 * Tells whether the field under `rootRef` holds a value (UI Kit Active: such a box keeps a darker
 * ring out of focus). The value is read from the input itself, so controlled and uncontrolled fields,
 * a select and the picked values of a multiple autocomplete all count. A controlled value comes with
 * a render; `sync` goes on the root's input events for an uncontrolled one. `initialValue` is the value
 * the field is given, if any: with it the first render is already right and needs no second one.
 */
export const usePneFieldFilled = <T extends HTMLElement>(initialValue?: unknown): {
    filled: boolean
    rootRef: RefObject<T | null>
    sync: () => void
} => {
    const rootRef = useRef<T | null>(null)
    const [filled, setFilled] = useState(() => isValue(initialValue))
    const sync = useCallback(() => setFilled(holdsValue(rootRef.current)), [])

    useEffect(sync)

    return {filled, rootRef, sync}
}
