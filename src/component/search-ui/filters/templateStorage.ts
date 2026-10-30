import type {SearchUIDefaults} from '../SearchUIProvider'

/**
 * Where the template name last chosen in a settings context lives.
 *
 * Without host callbacks the name sits in `localStorage` under a key per context, as it
 * always did: every user of the browser shares it. A host that provides both
 * `getLastSearchTemplateName` and `saveLastSearchTemplateName` keeps the name itself, e.g.
 * on the server per user; the browser key is then read once more, to move a name the old
 * mechanism left behind, and deleted. A rejected host call means the host cannot store the
 * name right now (the server predates the feature, the request failed): that single read
 * or write falls back to the browser key, so an older server behaves as before.
 */

const LAST_TEMPLATE_NAME_STORAGE_KEY_PREFIX = 'last_template_name'

export const getLastSearchUITemplateStorageKey = (settingsContextName: string): string => (
    LAST_TEMPLATE_NAME_STORAGE_KEY_PREFIX + settingsContextName
)

type LastSearchUITemplateHost = Pick<
    SearchUIDefaults,
    'getLastSearchTemplateName' | 'saveLastSearchTemplateName' | 'peekLastSearchTemplateName'
>

export type LastSearchUITemplateName = {
    name: string | null
    /**
     * The host store is configured but empty, and the name comes from the browser key.
     * Confirm it with `rememberLastSearchUITemplateName` once it names an existing template,
     * or drop it with `discardLegacyLastSearchUITemplateName`.
     */
    legacy: boolean
}

const hasHostStore = (
    defaults: LastSearchUITemplateHost,
): defaults is LastSearchUITemplateHost & Required<Pick<
    LastSearchUITemplateHost,
    'getLastSearchTemplateName' | 'saveLastSearchTemplateName'
>> => (
    typeof defaults.getLastSearchTemplateName === 'function'
    && typeof defaults.saveLastSearchTemplateName === 'function'
)

const fromHostName = (hostName: string | null, key: string): LastSearchUITemplateName => {
    if (hostName) {
        // The host copy wins; the browser key, shared by every user of the browser, retires.
        localStorage.removeItem(key)
        return {name: hostName, legacy: false}
    }
    const browserName = localStorage.getItem(key)
    return {name: browserName, legacy: browserName !== null}
}

const writeBrowserName = (key: string, templateName: string | null): void => {
    if (templateName === null) {
        localStorage.removeItem(key)
    } else {
        localStorage.setItem(key, templateName)
    }
}

/**
 * Synchronous without a host store, so a page without a remembered name renders in the same
 * tick as before the host store existed.
 */
export const readLastSearchUITemplateName = (
    defaults: LastSearchUITemplateHost,
    settingsContextName: string,
): LastSearchUITemplateName | Promise<LastSearchUITemplateName> => {
    const key = getLastSearchUITemplateStorageKey(settingsContextName)
    if (!hasHostStore(defaults)) {
        return {name: localStorage.getItem(key), legacy: false}
    }

    // A host that already knows the answer gives it at once, so the panel needs no promise round.
    const peeked = defaults.peekLastSearchTemplateName?.(settingsContextName)
    if (peeked !== undefined) {
        return fromHostName(peeked, key)
    }

    return defaults.getLastSearchTemplateName(settingsContextName)
        .then(hostName => fromHostName(hostName, key))
        .catch((error: unknown): LastSearchUITemplateName => {
            console.warn('SearchUI: the host cannot read the last template name; using the browser storage', error)
            return {name: localStorage.getItem(key), legacy: false}
        })
}

/** Never rejects: a host that cannot store the name leaves it in the browser instead. */
export const rememberLastSearchUITemplateName = (
    defaults: LastSearchUITemplateHost,
    settingsContextName: string,
    templateName: string | null,
    criteriaCount?: number,
): Promise<void> => {
    const key = getLastSearchUITemplateStorageKey(settingsContextName)
    if (!hasHostStore(defaults)) {
        // The browser keeps the name only: the count is for the host store and its skeleton.
        writeBrowserName(key, templateName)
        return Promise.resolve()
    }

    return defaults.saveLastSearchTemplateName({
        contextName: settingsContextName,
        templateName,
        ...(templateName !== null && criteriaCount !== undefined ? {criteriaCount} : {}),
    })
        .then(() => {
            localStorage.removeItem(key)
        })
        .catch((error: unknown) => {
            console.warn('SearchUI: the host cannot store the last template name; using the browser storage', error)
            writeBrowserName(key, templateName)
        })
}

export const forgetLastSearchUITemplateName = (
    defaults: LastSearchUITemplateHost,
    settingsContextName: string,
): Promise<void> => rememberLastSearchUITemplateName(defaults, settingsContextName, null)

/** Drops a browser-kept name that proved stale without troubling the host store, which holds nothing for the context. */
export const discardLegacyLastSearchUITemplateName = (settingsContextName: string): void => {
    localStorage.removeItem(getLastSearchUITemplateStorageKey(settingsContextName))
}
