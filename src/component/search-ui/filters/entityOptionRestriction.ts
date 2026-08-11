import type {
    AbstractEntity,
    AbstractEntityAllableCollection,
} from '../../../common/paynet/type'

export type EntityOptionRestrictionFingerprint = Array<{
    displayName: string
    id: number
}>

export const normalizeAllowedEntityNames = (
    allowedNames: ReadonlyArray<string> | undefined,
): string[] | undefined => {
    if (allowedNames === undefined) {
        return undefined
    }

    return Array.from(new Set(allowedNames)).sort()
}

export const resolveAllowedEntityOptions = (
    options: ReadonlyArray<AbstractEntity>,
    allowedNames: ReadonlyArray<string>,
    configPath: string,
): AbstractEntity[] => {
    const normalizedNames = normalizeAllowedEntityNames(allowedNames) ?? []
    if (normalizedNames.length === 0) {
        throw new Error(`[pne-ui] ${configPath} must contain at least one name`)
    }

    const allowedNameSet = new Set(normalizedNames)
    const resolvedNames = new Set<string>()
    const resolvedIds = new Set<number>()
    const resolvedOptions = options.filter(option => {
        if (!allowedNameSet.has(option.displayName) || resolvedIds.has(option.id)) {
            return false
        }

        resolvedNames.add(option.displayName)
        resolvedIds.add(option.id)
        return true
    })
    const missingNames = normalizedNames.filter(name => !resolvedNames.has(name))
    const ambiguousNames = normalizedNames.filter(name => (
        options.filter(option => option.displayName === name).length > 1
    ))

    if (missingNames.length > 0) {
        throw new Error(
            `[pne-ui] ${configPath} contains names missing from the available options: `
            + missingNames.join(', '),
        )
    }

    if (ambiguousNames.length > 0) {
        throw new Error(
            `[pne-ui] ${configPath} contains names matching multiple available options: `
            + ambiguousNames.join(', '),
        )
    }

    return resolvedOptions
}

export const createEntityOptionRestrictionFingerprint = (
    options: ReadonlyArray<AbstractEntity> | undefined,
): EntityOptionRestrictionFingerprint | null => {
    if (options === undefined) {
        return null
    }

    return options
        .map(({displayName, id}) => ({displayName, id}))
        .sort((left, right) => (
            left.displayName === right.displayName
                ? left.id - right.id
                : left.displayName < right.displayName ? -1 : 1
        ))
}

export const normalizeRestrictedEntityCollection = (
    value: AbstractEntityAllableCollection,
    allowedOptions: ReadonlyArray<AbstractEntity>,
): AbstractEntityAllableCollection => {
    if (value.all) {
        return {
            all: true,
            entities: [],
        }
    }

    const selectedNames = new Set((value.entities ?? []).map(entity => entity.displayName))
    const selectedOptions = allowedOptions.filter(option => selectedNames.has(option.displayName))

    if (selectedOptions.length === 0) {
        return {
            all: true,
            entities: [],
        }
    }

    return {
        all: false,
        entities: selectedOptions,
    }
}

export const extractRestrictedEntityIds = (
    value: AbstractEntityAllableCollection,
    allowedOptions: ReadonlyArray<AbstractEntity>,
): number[] => {
    const normalizedValue = normalizeRestrictedEntityCollection(value, allowedOptions)

    return normalizedValue.all
        ? allowedOptions.map(option => option.id)
        : (normalizedValue.entities ?? []).map(option => option.id)
}
