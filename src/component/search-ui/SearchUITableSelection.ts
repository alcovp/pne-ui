import type React from 'react'
import type {
    TableRowId,
    TableSelectionModel,
    TableSelectionUpdate,
} from '../table/tableSelection'
import type {
    TableSelectionChangeDetails,
    UseTableSelectionResult,
} from '../table/useTableSelection'
import type {SearchCriteria} from './filters/types'

export type SearchUITableSelectionScopeContext<
    TViewId extends string = string,
> = {
    /** Criteria that produced the currently applied result set; draft filters are intentionally excluded. */
    appliedSearchCriteria: Readonly<SearchCriteria> | null
    /** Active table View, when SearchUI is configured with views. */
    viewId?: TViewId
}

export type SearchUITableSelectionScope<
    TViewId extends string = string,
> = SearchUITableSelectionScopeContext<TViewId> & {
    /** Canonical in-memory identity used to reject stale selection work. */
    scopeKey: string
}

export type SearchUITableSelectionController<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = UseTableSelectionResult<D, TKey> & {
    scope: SearchUITableSelectionScope<TViewId>
    /** True while SearchUI is resolving the selectable all-results count. */
    selectingAllMatching: boolean
    /** Present only when resolveAllMatchingCount is configured. */
    selectAllMatchingResults?: () => Promise<TableSelectionUpdate<TKey>>
}

export type SearchUITableFactoryContext<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = SearchUITableSelectionScopeContext<TViewId> & {
    /** Present only when SearchUI table selection is configured. */
    selection?: SearchUITableSelectionController<D, TKey, TViewId>
}

export type SearchUITableSelectionRenderContext<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = SearchUITableSelectionScopeContext<TViewId> & {
    selection: SearchUITableSelectionController<D, TKey, TViewId>
}

type SearchUITableSelectionToolbarAccessibleName =
    | {
        toolbarAriaLabel: string
        toolbarAriaLabelledBy?: never
    }
    | {
        toolbarAriaLabel?: never
        toolbarAriaLabelledBy: string
    }

type SearchUITableSelectionBaseConfig<
    D extends object,
    TKey extends TableRowId,
    TViewId extends string,
> = SearchUITableSelectionToolbarAccessibleName & {
    getRowId: (row: D) => TKey
    isRowSelectable?: (row: D) => boolean
    maxSelected?: number
    disabled?: boolean
    /**
     * By default a View change starts a new selection scope. Enable only when
     * every View represents the same rows with compatible stable IDs.
     */
    preserveAcrossViews?: boolean
    /**
     * Resolve the selectable count for the applied result scope. SearchUI keeps
     * the request transient and applies the result only while that scope is current.
     * An in-flight request keeps the resolver active when it started; replacing
     * the callback affects the next request, while removing it cancels pending work.
     */
    resolveAllMatchingCount?: (
        scope: SearchUITableSelectionScope<TViewId>,
    ) => Promise<number>
    /** Consumer-owned, localized summary, status, and bulk actions. */
    renderControls: (
        context: SearchUITableSelectionRenderContext<D, TKey, TViewId>,
    ) => React.ReactNode
}

type SearchUIControlledTableSelectionConfig<TKey extends TableRowId> = {
    selection: TableSelectionModel<TKey>
    defaultSelection?: never
    onSelectionChange: (
        selection: TableSelectionModel<TKey>,
        details: TableSelectionChangeDetails,
    ) => void
}

type SearchUIUncontrolledTableSelectionConfig<TKey extends TableRowId> = {
    selection?: never
    defaultSelection?: TableSelectionModel<TKey>
    onSelectionChange?: (
        selection: TableSelectionModel<TKey>,
        details: TableSelectionChangeDetails,
    ) => void
}

export type SearchUITableSelectionConfig<
    D extends object,
    TKey extends TableRowId = TableRowId,
    TViewId extends string = string,
> = SearchUITableSelectionBaseConfig<D, TKey, TViewId> & (
    SearchUIControlledTableSelectionConfig<TKey>
    | SearchUIUncontrolledTableSelectionConfig<TKey>
)

export const createSearchUITableSelectionScopeKey = (
    appliedSearchCriteria: Readonly<SearchCriteria> | null,
    viewId: string | undefined,
    preserveAcrossViews: boolean,
): string => canonicalStringify({
    appliedSearchCriteria,
    viewId: preserveAcrossViews ? null : viewId ?? null,
})

const canonicalStringify = (value: unknown): string => JSON.stringify(canonicalize(value))

const canonicalize = (value: unknown): unknown => {
    if (value instanceof Date) {
        return value.toISOString()
    }

    if (Array.isArray(value)) {
        return value.map(canonicalize)
    }

    if (value !== null && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce<Record<string, unknown>>((result, key) => {
                const entry = canonicalize((value as Record<string, unknown>)[key])
                if (entry !== undefined) {
                    result[key] = entry
                }
                return result
            }, {})
    }

    return value
}
