import { createContext } from 'react'
import type { PaynetViolationMessageResolver } from './types'

export type PaynetErrorPresentationContextValue = {
    resolveViolationMessage?: PaynetViolationMessageResolver
}

/** Host-side presentation policy for `PaynetErrorContent`, provided by `OverlayHost`. */
export const PaynetErrorPresentationContext = createContext<PaynetErrorPresentationContextValue>({})
