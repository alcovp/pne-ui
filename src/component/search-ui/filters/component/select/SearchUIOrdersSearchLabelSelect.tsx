import React, {useState} from 'react';
import {ORDER_SEARCH_LABELS, OrderSearchLabel} from '../../types';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {ExpandMore} from '@mui/icons-material';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';
import {useSearchUIFiltersStore} from "../../state/store";

export const SearchUIOrdersSearchLabelSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'searchLabel'})

    const {
        ordersSearchLabel,
        setOrderSearchCriterionLabel,
    } = useSearchUIFiltersStore((store) => ({
        ordersSearchLabel: store.ordersSearchLabel,
        setOrderSearchCriterionLabel: store.setOrderSearchCriterionLabel,
    }))

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(ordersSearchLabel)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={ordersSearchLabel}
            onChange={(value) => setOrderSearchCriterionLabel(value as OrderSearchLabel)}
            options={ORDER_SEARCH_LABELS}
        />
    </Box>
}