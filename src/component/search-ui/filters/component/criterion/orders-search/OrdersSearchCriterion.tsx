import React from 'react';
import {useTranslation} from 'react-i18next';
import {Box, SxProps} from '@mui/material';
import {SearchUIOrdersSearchLabelSelect} from "../../select/SearchUIOrdersSearchLabelSelect";
import {OrdersSearchInput} from "./OrdersSearchInput";

export const OrdersSearchCriterion = () => {
    const {t} = useTranslation()

    return <Box sx={centerSx}>
        <OrdersSearchInput/>
        <Box component={'span'} sx={{display: 'inline-block', color: '#8A94A6'}}>{t('in')}</Box>
        <SearchUIOrdersSearchLabelSelect/>
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: '8px',
}