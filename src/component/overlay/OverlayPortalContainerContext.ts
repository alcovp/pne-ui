import React from 'react'
import type { OverlayHostProps } from './OverlayHost'

/** Internal bridge used by overlay content that opens a nested portal. */
export const OverlayPortalContainerContext = React.createContext<OverlayHostProps['container']>(undefined)

