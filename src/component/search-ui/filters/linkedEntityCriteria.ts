import {CriterionTypeEnum, LinkedEntityTypeEnum} from './types'

const criterionToLinkedEntityMap: Partial<Record<CriterionTypeEnum, LinkedEntityTypeEnum>> = {
    [CriterionTypeEnum.ENDPOINT]: LinkedEntityTypeEnum.ENDPOINT,
    [CriterionTypeEnum.PROJECT]: LinkedEntityTypeEnum.PROJECT,
    [CriterionTypeEnum.COMPANY]: LinkedEntityTypeEnum.COMPANY,
    [CriterionTypeEnum.GATE]: LinkedEntityTypeEnum.GATE,
    [CriterionTypeEnum.DEALER]: LinkedEntityTypeEnum.DEALER,
    [CriterionTypeEnum.MANAGER]: LinkedEntityTypeEnum.MANAGER,
    [CriterionTypeEnum.MERCHANT]: LinkedEntityTypeEnum.MERCHANT,
    [CriterionTypeEnum.PROCESSOR]: LinkedEntityTypeEnum.PROCESSOR,
    [CriterionTypeEnum.RESELLER]: LinkedEntityTypeEnum.RESELLER,
}

const linkedEntityToCriterionMap = new Map<LinkedEntityTypeEnum, CriterionTypeEnum>(
    (Object.entries(criterionToLinkedEntityMap) as [CriterionTypeEnum, LinkedEntityTypeEnum][])
        .map(([criterion, entityType]) => [entityType, criterion]),
)

export const getLinkedEntityTypeByCriterion = (criterion: CriterionTypeEnum): LinkedEntityTypeEnum | null => (
    criterionToLinkedEntityMap[criterion] ?? null
)

export const getCriterionByLinkedEntityType = (entityType: LinkedEntityTypeEnum): CriterionTypeEnum | null => (
    linkedEntityToCriterionMap.get(entityType) ?? null
)

export const isLinkedEntityCriterionActive = (
    criteria: CriterionTypeEnum[],
    entityType: LinkedEntityTypeEnum,
): boolean => criteria.some(criterion => getLinkedEntityTypeByCriterion(criterion) === entityType)
