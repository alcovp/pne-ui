import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomerLevel } from '../../../../..'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import { getConcreteCustomerLevelMerchantId } from '../../customerLevelDependencies'
import { useSearchUIFiltersStore } from '../../state/store'
import SearchUIAbstractEntityChipSelect from '../select/SearchUIAbstractEntityChipSelect'

export const CustomerLevelCriterion = () => {
    const { t } = useTranslation()
    const { getCustomerLevels } = useContext(SearchUIDefaultsContext)

    const multigetCriteria = useSearchUIFiltersStore(state => state.multigetCriteria)
    const currencies = useSearchUIFiltersStore(state => state.currencies)
    const customerLevel = useSearchUIFiltersStore(state => state.customerLevel)
    const setCustomerLevel = useSearchUIFiltersStore(state => state.setCustomerLevelCriterion)

    const merchantId = getConcreteCustomerLevelMerchantId(multigetCriteria)
    const currencyIds = useMemo(() => (
        currencies.all
            ? []
            : (currencies.entities ?? []).map(currency => currency.id).sort((left, right) => left - right)
    ), [currencies])
    const requestKey = merchantId === null ? null : `${merchantId}:${currencyIds.join(',')}`

    const [availableLevels, setAvailableLevels] = useState<CustomerLevel[]>([])
    const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (merchantId === null || requestKey === null) {
            setAvailableLevels([])
            setLoadedRequestKey(null)
            setLoading(false)
            return
        }

        let active = true
        setAvailableLevels([])
        setLoadedRequestKey(null)
        setLoading(true)

        getCustomerLevels({ merchantId, currencyIds })
            .then(levels => {
                if (!active) {
                    return
                }
                setAvailableLevels(levels)
                setLoadedRequestKey(requestKey)
                setLoading(false)
            })
            .catch(error => {
                if (!active) {
                    return
                }
                console.error(error)
                setAvailableLevels([])
                setLoadedRequestKey(requestKey)
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [currencyIds, getCustomerLevels, merchantId, requestKey])

    useEffect(() => {
        if (customerLevel === null) {
            return
        }

        const merchantMissing = requestKey === null
        const loadedLevelMissing = requestKey !== null
            && loadedRequestKey === requestKey
            && !availableLevels.some(level => level.id === customerLevel.id)

        if (merchantMissing || loadedLevelMissing) {
            setCustomerLevel(null)
        }
    }, [availableLevels, customerLevel, loadedRequestKey, requestKey, setCustomerLevel])

    const merchantSelected = merchantId !== null
    const noCustomerLevelsAvailable = merchantSelected
        && !loading
        && loadedRequestKey === requestKey
        && availableLevels.length === 0
    const selectMerchantPlaceholder = t('react.searchUI.customerLevel.selectMerchant', {
        defaultValue: 'Select a merchant first',
    })
    const noCustomerLevelsText = t('react.searchUI.customerLevel.noOptions', {
        defaultValue: 'No customer levels available',
    })
    const placeholder = !merchantSelected
        ? selectMerchantPlaceholder
        : noCustomerLevelsAvailable
            ? noCustomerLevelsText
            : t('react.chooseOne')

    return <SearchUIAbstractEntityChipSelect
        value={customerLevel}
        options={availableLevels}
        onChange={setCustomerLevel}
        disabled={!merchantSelected || loading || noCustomerLevelsAvailable}
        placeholder={placeholder}
        ariaLabel={t('react.CriterionTypeEnum.CUSTOMER_LEVEL', {
            defaultValue: 'Customer level',
        })}
    />
}
