const LAST_TEMPLATE_NAME_STORAGE_KEY_PREFIX = 'last_template_name'

export const getLastSearchUITemplateStorageKey = (settingsContextName: string): string => (
    LAST_TEMPLATE_NAME_STORAGE_KEY_PREFIX + settingsContextName
)
