import {CriterionTypeEnum, SearchUIConditions} from './types'
import {getCriterionByLinkedEntityType} from './linkedEntityCriteria'

export type ImpliedCriteria = {
    /** The declared predefined criteria plus the implied ones the page declared nowhere. */
    predefinedCriteria: CriterionTypeEnum[]
    /** Implied criteria the page lists as possible: active from the start and back after Default, removable meanwhile. */
    defaultCriteria: CriterionTypeEnum[]
    /** Implied criteria the page declared neither as predefined nor as possible: a page mistake to report. */
    undeclaredCriteria: CriterionTypeEnum[]
}

/**
 * A selection in `initialSearchConditions.multigetCriteria` means the page filters by that entity, so
 * its criterion is active from the start whether or not the page declared it: the user sees what the
 * search does, and Default brings the selection back. A criterion the page declared nowhere counts as
 * predefined, since the page gave the user no other way to have it.
 */
export const resolveImpliedCriteria = (
    predefinedCriteria: CriterionTypeEnum[],
    possibleCriteria: CriterionTypeEnum[],
    initialSearchConditions: Partial<SearchUIConditions> | undefined,
): ImpliedCriteria => {
    const implied = Array.from(new Set(
        (initialSearchConditions?.multigetCriteria ?? [])
            .map(selection => getCriterionByLinkedEntityType(selection.entityType))
            .filter((criterion): criterion is CriterionTypeEnum => criterion !== null)
            .filter(criterion => !predefinedCriteria.includes(criterion)),
    ))
    const defaultCriteria = implied.filter(criterion => possibleCriteria.includes(criterion))
    const undeclaredCriteria = implied.filter(criterion => !possibleCriteria.includes(criterion))

    return {
        predefinedCriteria: [...predefinedCriteria, ...undeclaredCriteria],
        defaultCriteria,
        undeclaredCriteria,
    }
}
