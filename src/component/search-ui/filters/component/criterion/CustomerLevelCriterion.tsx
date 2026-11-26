import React, {use, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {CustomerLevel} from '../../types'
import {SearchUIDefaultsContext} from '../../../SearchUIProvider'
import {getConcreteCustomerLevelMerchantId} from '../../customerLevelDependencies'
import {useSearchUIFiltersStore} from '../../state/store'
import SearchUIAbstractEntityChipSelect from '../select/SearchUIAbstractEntityChipSelect'

const CRITERION_CUSTOMER_LEVEL_AUTOTEST_ID = 'criterion-customer-level'
const CRITERION_CUSTOMER_LEVEL_OPTIONS_AUTOTEST_ID = 'criterion-customer-level-options'
const CRITERION_CUSTOMER_LEVEL_OPTION_AUTOTEST_ID = 'criterion-customer-level-option'

export const CustomerLevelCriterion = () => {
    const {t} = useTranslation()
    const {getCustomerLevels} = use(SearchUIDefaultsContext)

    const multigetCriteria = useSearchUIFiltersStore(state => state.multigetCriteria)
    const currencies = useSearchUIFiltersStore(state => state.currencies)
    const customerLevel = useSearchUIFiltersStore(state => state.customerLevel)
    const setCustomerLevel = useSearchUIFiltersStore(state => state.setCustomerLevelCriterion)

    const merchantId = getConcreteCustomerLevelMerchantId(multigetCriteria)
    const currencyIds = useMemo(
        () =>
            currencies.all
                ? []
                : (currencies.entities ?? []).map(currency => currency.id).sort((left, right) => left - right),
        [currencies],
    )
    const requestKey = merchantId === null ? null : `${merchantId}:${currencyIds.join(',')}`

    const [availableLevels, setAvailableLevels] = useState<CustomerLevel[]>([])
    const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null)
    const [failedRequestKey, setFailedRequestKey] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (merchantId === null || requestKey === null) {
            /* eslint-disable @eslint-react/set-state-in-effect -- no merchant: nothing to show */
            setAvailableLevels([])
            setLoadedRequestKey(null)
            setFailedRequestKey(null)
            setLoading(false)
            /* eslint-enable @eslint-react/set-state-in-effect */
            return
        }

        let active = true
        /* eslint-disable @eslint-react/set-state-in-effect -- a new request: the previous answer goes at once */
        setAvailableLevels([])
        setLoadedRequestKey(null)
        setFailedRequestKey(null)
        setLoading(true)
        /* eslint-enable @eslint-react/set-state-in-effect */

        getCustomerLevels({merchantId, currencyIds})
            .then(levels => {
                if (!active) {
                    return
                }
                setAvailableLevels(levels)
                setLoadedRequestKey(requestKey)
                setFailedRequestKey(null)
                setLoading(false)
            })
            .catch(error => {
                if (!active) {
                    return
                }
                console.error(error)
                setAvailableLevels([])
                setLoadedRequestKey(null)
                setFailedRequestKey(requestKey)
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
        const loadedLevelMissing =
            requestKey !== null &&
            loadedRequestKey === requestKey &&
            !availableLevels.some(level => level.id === customerLevel.id)

        if (merchantMissing || loadedLevelMissing) {
            setCustomerLevel(null)
        }
    }, [availableLevels, customerLevel, loadedRequestKey, requestKey, setCustomerLevel])

    const merchantSelected = merchantId !== null
    const loadFailed = requestKey !== null && failedRequestKey === requestKey
    const requestLoading =
        merchantSelected && requestKey !== null && (loading || (loadedRequestKey !== requestKey && !loadFailed))
    const noCustomerLevelsAvailable =
        merchantSelected &&
        !requestLoading &&
        !loadFailed &&
        loadedRequestKey === requestKey &&
        availableLevels.length === 0
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

    return (
        <SearchUIAbstractEntityChipSelect
            value={customerLevel}
            options={availableLevels}
            onChange={setCustomerLevel}
            disabled={!merchantSelected || requestLoading || loadFailed || noCustomerLevelsAvailable}
            loading={requestLoading}
            placeholder={placeholder}
            ariaLabel={t('react.CriterionTypeEnum.CUSTOMER_LEVEL', {
                defaultValue: 'Customer level',
            })}
            autoTest={{
                controlId: CRITERION_CUSTOMER_LEVEL_AUTOTEST_ID,
                optionsId: CRITERION_CUSTOMER_LEVEL_OPTIONS_AUTOTEST_ID,
                optionId: CRITERION_CUSTOMER_LEVEL_OPTION_AUTOTEST_ID,
            }}
        />
    )
}
