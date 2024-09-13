import React from 'react';
import {MARKER_STATUS_CRITERION_VALUES} from '../../types';
import {useSearchUIStore} from '../../state/store';
import {useTranslation} from 'react-i18next';
import {Box, Chip, SxProps} from '@mui/material';

export const MarkerStatusCriterion = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.MarkerStatusCriterionEnum'})
    const {
        status,
        setStatusCriterion,
    } = useSearchUIStore((store) => ({
        status: store.markerStatus,
        setStatusCriterion: store.setMarkerStatusCriterion,
    }))

    return <Box sx={centerSx}>
        {MARKER_STATUS_CRITERION_VALUES.map(value => {
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
