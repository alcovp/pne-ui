import React from 'react'
import {useTranslation} from 'react-i18next'
import {TRANSACTION_RECURRENT_FILTERS} from '../../types'
import {useSearchUIFiltersStore} from '../../state/store'
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect'

export const TransactionRecurrentFilterCriterion = () => {
    const {t} = useTranslation()

    const recurrentFilter = useSearchUIFiltersStore(state => state.recurrentFilter)
    const setTransactionRecurrentFilterCriterion = useSearchUIFiltersStore(
        state => state.setTransactionRecurrentFilterCriterion,
    )

    return <SearchUIEnumChipSelect
        value={recurrentFilter}
        options={TRANSACTION_RECURRENT_FILTERS}
        onChange={setTransactionRecurrentFilterCriterion}
        getOptionLabel={value => t(`recurrentFilterType.${value}`)}
        ariaLabel={t('react.CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER')}
    />
}
