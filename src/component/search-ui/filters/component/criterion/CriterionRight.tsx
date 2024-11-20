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
    const {
        predefinedCriteria,
        removablePredefinedCriteria,
        clearCriterion,
        removeCriterion,
    } = useSearchUIFiltersStore((store) => ({
        predefinedCriteria: store.predefinedCriteria,
        removablePredefinedCriteria: store.config?.removablePredefinedCriteria,
        clearCriterion: store.clearCriterion,
        removeCriterion: store.removeCriterion,
    }))

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
