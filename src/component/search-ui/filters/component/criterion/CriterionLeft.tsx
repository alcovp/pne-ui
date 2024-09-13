import React from 'react';
import {CriterionTypeEnum} from '../../types';
import {useTranslation} from 'react-i18next';
import {Box, SxProps} from '@mui/material';

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionLeft = (props: Props) => {
    const {t} = useTranslation()
    const {
        criterionType
    } = props

    return <Box sx={titleSx}>
        <Box component={'span'} sx={{display: 'inline-block'}}>
            {t('react.CriterionTypeEnum.' + criterionType)}
        </Box>
    </Box>
}

const titleSx: SxProps = {
    minWidth: '150px',
    fontSize: '15px',
    lineHeight: '20px',
    color: '#38434D', //TODO use theme
}
