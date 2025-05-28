import React from 'react';
import {CriterionTypeEnum} from '../../types';
import SearchUIFiltersCriterionHeaderClearButton from '../button/SearchUIFiltersCriterionHeaderClearButton';
import SearchUIFiltersCriterionHeaderRemoveButton from '../button/SearchUIFiltersCriterionHeaderRemoveButton';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionRight = (props: Props) => {
    const {
        criterionType
    } = props

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

    return <Box sx={boxSx}>
        <SearchUIFiltersCriterionHeaderClearButton onClick={clear}/>
        {hasRemoveButton && <SearchUIFiltersCriterionHeaderRemoveButton onClick={remove}/>}
    </Box>
}

const boxSx: SxProps = {
    display: 'flex',
    ml: 'auto',
    alignItems: 'center',
}
