import React, {createContext, useContext} from 'react'

/*
 * pne-ui 5 restyles the primitives one by one, while composite components with a look of their own
 * (SearchUI, the PneTable parts, AbstractEntitySelector, PneBreadcrumbs, the operation center) stay
 * as they are until their own redesign (owner, #172883). Those components wrap their own UI in
 * PneLegacyLook, and the primitives inside it draw their 4.x look. Internal: not exported.
 */
const PneLegacyLookContext = createContext(false)

export const PneLegacyLook = ({children}: {children?: React.ReactNode}) =>
    <PneLegacyLookContext.Provider value>{children}</PneLegacyLookContext.Provider>

export const usePneLegacyLook = (): boolean => useContext(PneLegacyLookContext)

/** Wraps a composite so the primitives inside draw their 4.x look; the component keeps its type. */
export const withPneLegacyLook = <C extends React.ElementType>(Component: C, displayName: string): C => {
    const Wrapped = (props: object) => <PneLegacyLook>{React.createElement(Component, props)}</PneLegacyLook>
    Wrapped.displayName = displayName
    return Wrapped as unknown as C
}
