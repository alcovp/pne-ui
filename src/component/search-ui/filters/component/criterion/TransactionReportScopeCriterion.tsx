import React from 'react'
import {Box, SxProps} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {PneTextField} from '../../../../..'
import {TRANSACTION_REPORT_SCOPES} from '../../types'
import {useSearchUIFiltersStore} from '../../state/store'
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect'

export const TransactionReportScopeCriterion = () => {
    const {t} = useTranslation()

    const scope = useSearchUIFiltersStore(state => state.scope)
    const transactionIds = useSearchUIFiltersStore(state => state.transactionIds)
    const setTransactionReportScopeCriterion = useSearchUIFiltersStore(
        state => state.setTransactionReportScopeCriterion,
    )
    const setTransactionIdsCriterion = useSearchUIFiltersStore(
        state => state.setTransactionIdsCriterion,
    )

    return <Box sx={criterionSx}>
        <SearchUIEnumChipSelect
            value={scope}
            options={TRANSACTION_REPORT_SCOPES}
            onChange={setTransactionReportScopeCriterion}
            getOptionLabel={value => t(`transactionReportScope.${value}`)}
            ariaLabel={t('react.CriterionTypeEnum.TRANSACTION_REPORT_SCOPE')}
        />
        {scope !== 'ALL' ? <PneTextField
            value={transactionIds}
            onChange={event => setTransactionIdsCriterion(event.target.value)}
            label={t('react.searchUI.transactionIds')}
            multiline
            rows={6}
            fullWidth
            size={'small'}
            variant={'outlined'}
            slotProps={{
                htmlInput: {
                    'aria-label': t('react.searchUI.transactionIds'),
                },
            }}
            sx={transactionIdsSx}
        /> : null}
    </Box>
}

const criterionSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    width: '100%',
    py: '8px',
}

const transactionIdsSx: SxProps = {
    width: '100%',
    maxWidth: '400px',
    '& .MuiInputBase-input': {
        fontSize: '13px',
        lineHeight: '18px',
    },
}
