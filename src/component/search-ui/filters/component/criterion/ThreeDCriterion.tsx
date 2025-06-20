import React from 'react';
import {ThreeDCriterionEnum} from '../../types';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';

export const ThreeDCriterion = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.ThreeDCriterionEnum'})

    const threeD = useSearchUIFiltersStore(s => s.threeD)
    const set3DCriterion = useSearchUIFiltersStore(s => s.set3DCriterion)

    const options = [
        ThreeDCriterionEnum.ANY,
        ThreeDCriterionEnum.NO,
        ThreeDCriterionEnum.YES,
    ]

    return <Box sx={centerSx}>
        {options.map(value => {
            const selected = value === threeD
            return <Chip
                onClick={() => set3DCriterion(value)}
                key={value}
                label={optionRenderer(value)}
                color={selected ? 'primary' : 'default'}
                size={'small'}
            />
        })}
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    columnGap: '5px',
}
