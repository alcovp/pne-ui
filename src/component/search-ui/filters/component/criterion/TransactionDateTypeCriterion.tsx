import React from 'react'
import {Chip} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {useSearchUIFiltersStore} from '../../state/store'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'

const CRITERION_OPTION_AUTOTEST_ID = 'criterion-option'

/** BANK is deprecated, so CREATED is the only supported transaction date dimension. */
export const TransactionDateTypeCriterion = () => {
    const {t} = useTranslation()
    const datesType = useSearchUIFiltersStore(state => state.datesType)

    return <Chip
        {...createAutoTestAttributes(CRITERION_OPTION_AUTOTEST_ID, datesType)}
        label={t(`advancedSearch.transactionsDatesType.${datesType}`)}
        size={'small'}
    />
}
