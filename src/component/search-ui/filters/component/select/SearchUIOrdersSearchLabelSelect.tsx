import React, {useState} from 'react';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {ExpandMore} from '@mui/icons-material';
import {useSearchUIFiltersStore} from "../../state/store";
import {SearchUICollapsableGroupSelect} from './SearchUICollapsableGroupSelect';

export const SearchUIOrdersSearchLabelSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'searchLabel'})

    const {
        ordersSearchLabel,
    } = useSearchUIFiltersStore((store) => ({
        ordersSearchLabel: store.ordersSearchLabel,
    }))

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(ordersSearchLabel)}
            size={'small'}
        />
        <SearchUICollapsableGroupSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        />
    </Box>
}