import React from 'react';
import {STATUS_CRITERION_VALUES} from '../../types';
import {useSearchUIStore} from '../../state/store';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';

export const StatusCriterion = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.StatusCriterionEnum'})

    const {
        status,
        setStatusCriterion,
    } = useSearchUIStore((store) => ({
        status: store.status,
        setStatusCriterion: store.setStatusCriterion,
    }))

    return <Box sx={centerSx}>
        {STATUS_CRITERION_VALUES.map(value => {
            const selected = value === status
            return <Chip
                onClick={() => setStatusCriterion(value)}
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
