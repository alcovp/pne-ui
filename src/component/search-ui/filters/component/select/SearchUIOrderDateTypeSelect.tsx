import React, {useState} from 'react';
import {ORDER_DATE_TYPES, OrderDate} from '../../types';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {ExpandMore} from '@mui/icons-material';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';

export const SearchUIOrderDateTypeSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'orders.orderlist.search.datesType'})

    const orderDateType = useSearchUIFiltersStore(s => s.orderDateType)
    const setDateRangeCriterionOrderDateType = useSearchUIFiltersStore(s => s.setDateRangeCriterionOrderDateType)

    const [open, setOpen] = useState(false)

    const selectSx: SxProps = {
        flexShrink: 0,
        width: '100%',
        [`& fieldset`]: {
            borderRadius: '0',
            borderColor: 'transparent !important',
            borderRightColor: 'transparent !important',
        },
        ...selectUnderChipSx
    }

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(orderDateType)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={orderDateType}
            onChange={orderDateType => setDateRangeCriterionOrderDateType(orderDateType as OrderDate)}
            options={ORDER_DATE_TYPES}
        />
    </Box>
}
