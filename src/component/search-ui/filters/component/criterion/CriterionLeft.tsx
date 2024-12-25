import React from 'react';
import {CriterionTypeEnum} from '../../types';
import {useTranslation} from 'react-i18next';
import {Box, SxProps} from '@mui/material';
import {usePneTheme} from "../../../../../usePneTheme";
// import {usePneTheme} from "../../../../../usePneTheme";

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionLeft = (props: Props) => {
    const {
        criterionType
    } = props

    const {t} = useTranslation()
    // const theme = usePneTheme()

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
