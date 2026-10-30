import type {SearchUIDefaults} from '../SearchUIProvider'

/**
 * Where the fold of the filters panel lives: with the host, when it provides both
 * `getSearchFiltersCollapsed` and `saveSearchFiltersCollapsed` (e.g. on the server per user,
 * next to the last chosen template name), and nowhere otherwise. Nothing is kept in the
 * browser: a page without a host store opens expanded every time.
 */

type SearchUIFiltersCollapsedHost = Pick<
    SearchUIDefaults,
    'getSearchFiltersCollapsed' | 'saveSearchFiltersCollapsed' | 'peekSearchFiltersCollapsed'
>

const hasHostStore = (
    defaults: SearchUIFiltersCollapsedHost,
): defaults is SearchUIFiltersCollapsedHost & Required<Pick<
    SearchUIFiltersCollapsedHost,
    'getSearchFiltersCollapsed' | 'saveSearchFiltersCollapsed'
>> => (
    typeof defaults.getSearchFiltersCollapsed === 'function'
    && typeof defaults.saveSearchFiltersCollapsed === 'function'
)

/**
 * Synchronous without a host store, so such a page renders in the same tick as before.
 * Never rejects: a host that cannot answer leaves the panel expanded.
 */
export const readSearchUIFiltersCollapsed = (
    defaults: SearchUIFiltersCollapsedHost,
    settingsContextName: string,
): boolean | Promise<boolean> => {
    if (!hasHostStore(defaults)) {
        return false
    }

    // A host that already knows the answer gives it at once, so the panel needs no promise round.
    const peeked = defaults.peekSearchFiltersCollapsed?.(settingsContextName)
    if (peeked !== undefined) {
        return peeked === true
    }

    return defaults.getSearchFiltersCollapsed(settingsContextName)
        .then(collapsed => collapsed === true)
        .catch((error: unknown) => {
            console.warn('SearchUI: the host cannot read whether the filters are collapsed; opening them', error)
            return false
        })
}

/** Never rejects: a host that cannot store the fold leaves it to this mount. */
export const rememberSearchUIFiltersCollapsed = (
    defaults: SearchUIFiltersCollapsedHost,
    settingsContextName: string,
    collapsed: boolean,
): Promise<void> => {
    if (!hasHostStore(defaults)) {
        return Promise.resolve()
    }

    return defaults.saveSearchFiltersCollapsed({contextName: settingsContextName, collapsed})
        .catch((error: unknown) => {
            console.warn('SearchUI: the host cannot store whether the filters are collapsed', error)
        })
}
