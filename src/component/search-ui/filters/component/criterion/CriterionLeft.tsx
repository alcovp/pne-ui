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
    const label = t('react.CriterionTypeEnum.' + criterionType)

    // A name that does not fit its column is cut with an ellipsis, never wrapped; the title holds the rest.
    return <Box sx={titleSx} title={label}>
        <Box component={'span'}>
            {label}
        </Box>
    </Box>
}

const titleSx: SxProps = {
    minWidth: '150px',
    maxWidth: '100%',
    fontSize: '15px',
    lineHeight: '20px',
    color: '#38434D', //TODO use theme
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}
