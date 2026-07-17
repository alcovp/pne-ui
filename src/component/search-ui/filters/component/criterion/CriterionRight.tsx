import React from 'react';
import {CriterionTypeEnum} from '../../types';
import SearchUIFiltersCriterionHeaderClearButton from '../button/SearchUIFiltersCriterionHeaderClearButton';
import SearchUIFiltersCriterionHeaderRemoveButton from '../button/SearchUIFiltersCriterionHeaderRemoveButton';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionRight = (props: Props) => {
    const {
        criterionType
    } = props
    const {t} = useTranslation()

    const predefinedCriteria = useSearchUIFiltersStore(s => s.predefinedCriteria)
    const removablePredefinedCriteria = useSearchUIFiltersStore(s => s.config?.removablePredefinedCriteria)
    const clearCriterion = useSearchUIFiltersStore(s => s.clearCriterion)
    const removeCriterion = useSearchUIFiltersStore(s => s.removeCriterion)

    const clear = () => {
        clearCriterion(criterionType)
    }

    const remove = () => {
        removeCriterion(criterionType)
    }

    const hasRemoveButton = !predefinedCriteria.includes(criterionType)
        || removablePredefinedCriteria?.includes(criterionType)
    const criterionLabel = t('react.CriterionTypeEnum.' + criterionType)
    const clearLabel = `${t('react.searchUI.criterion.clear', {defaultValue: 'Clear filter'})}: ${criterionLabel}`
    const removeLabel = `${t('react.searchUI.criterion.remove', {defaultValue: 'Remove filter'})}: ${criterionLabel}`

    return <Box sx={boxSx}>
        <SearchUIFiltersCriterionHeaderClearButton
            ariaLabel={clearLabel}
            onClick={clear}
        />
        {hasRemoveButton && <SearchUIFiltersCriterionHeaderRemoveButton
            ariaLabel={removeLabel}
            onClick={remove}
        />}
    </Box>
}

const boxSx: SxProps = {
    display: 'flex',
    ml: 'auto',
    alignItems: 'center',
}
