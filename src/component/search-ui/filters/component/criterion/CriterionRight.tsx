import React from 'react';
import {CriterionTypeEnum} from '../../types';
import SearchUIFiltersCriterionHeaderClearButton from '../button/SearchUIFiltersCriterionHeaderClearButton';
import SearchUIFiltersCriterionHeaderRemoveButton from '../button/SearchUIFiltersCriterionHeaderRemoveButton';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {SEARCH_UI_FILTERS_ICON_GAP} from '../../layout';

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionRight = (props: Props) => {
    const {
        criterionType,
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

    const clearButton = <SearchUIFiltersCriterionHeaderClearButton
        ariaLabel={clearLabel}
        onClick={clear}
    />
    const removeButton = hasRemoveButton ? <SearchUIFiltersCriterionHeaderRemoveButton
        ariaLabel={removeLabel}
        onClick={remove}
    /> : null

    // UI Kit Filter row: the reset first, then the cross. The reset of every row stands on one
    // vertical, with or without a cross beside it.
    return <Box sx={boxSx}>
        {clearButton}
        {removeButton}
    </Box>
}

const boxSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: SEARCH_UI_FILTERS_ICON_GAP,
}
