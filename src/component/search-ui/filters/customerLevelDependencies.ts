import {
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
} from './types'

/**
 * Returns the merchant selected by an exact multiget criterion.
 * Customer levels are intentionally unavailable for ALL, SEARCH or multi-selection.
 */
export const getConcreteCustomerLevelMerchantId = (
    multigetCriteria: readonly MultigetCriterion[],
): number | null => {
    const merchantCriterion = multigetCriteria.find(
        criterion => criterion.entityType === LinkedEntityTypeEnum.MERCHANT,
    )

    if (!merchantCriterion || merchantCriterion.filterType !== MultichoiceFilterTypeEnum.NONE) {
        return null
    }

    const selectedIds = merchantCriterion.selectedItems
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)

    if (selectedIds.length !== 1) {
        return null
    }

    const merchantId = Number(selectedIds[0])
    return Number.isSafeInteger(merchantId) && merchantId > 0 ? merchantId : null
}
