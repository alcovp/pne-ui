import React from 'react'

/** Whether a node would put anything on the page: an empty or blank string, `null`, `false` and an empty list would not. */
export const hasRenderableContent = (value: React.ReactNode): boolean => {
    if (typeof value === 'string') return value.trim().length > 0
    // The one place that needs React's own idea of an empty child list.
    // eslint-disable-next-line @eslint-react/no-children-to-array
    return React.Children.toArray(value).length > 0
}
