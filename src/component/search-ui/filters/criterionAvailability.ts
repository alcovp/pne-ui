import {
    CriterionTypeEnum,
    SearchUICriterionAvailabilityRule,
    SearchUIConditions,
} from './types'

type CriterionAvailabilityConfig = {
    criterionAvailabilityRules?: SearchUICriterionAvailabilityRule[]
}

export const getCriteriaWithAvailabilityRules = (
    config: CriterionAvailabilityConfig | undefined,
): CriterionTypeEnum[] => (
    Array.from(new Set(
        (config?.criterionAvailabilityRules ?? []).map(rule => rule.criterion),
    ))
)

export const isCriterionAvailable = (
    criterion: CriterionTypeEnum,
    conditions: Readonly<SearchUIConditions>,
    config: CriterionAvailabilityConfig | undefined,
): boolean => {
    const rules = config?.criterionAvailabilityRules ?? []
    return rules
        .filter(rule => rule.criterion === criterion)
        .every(rule => rule.isAvailable(conditions))
}
