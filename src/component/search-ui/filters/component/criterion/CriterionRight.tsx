import React from 'react';
import {CriterionTypeEnum} from '../../types';
import SearchUIFiltersCriterionHeaderClearButton from '../button/SearchUIFiltersCriterionHeaderClearButton';
import SearchUIFiltersCriterionHeaderRemoveButton from '../button/SearchUIFiltersCriterionHeaderRemoveButton';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import type {SearchUIFiltersLayout} from '../../layout';

type Props = {
    criterionType: CriterionTypeEnum
    layout?: SearchUIFiltersLayout
}

export const CriterionRight = (props: Props) => {
    const {
        criterionType,
        layout = 'header',
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

    // Compact rows put the cross left of the eraser: the eraser stays next to the value in every
    // row, and the remove action sits farther from the control it would take away.
    return layout === 'compact'
        ? <Box sx={compactBoxSx}>
            {removeButton}
            {clearButton}
        </Box>
        : <Box sx={boxSx}>
            {clearButton}
            {removeButton}
        </Box>
}

const boxSx: SxProps = {
    display: 'flex',
    ml: 'auto',
    alignItems: 'center',
}

const compactBoxSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
}
