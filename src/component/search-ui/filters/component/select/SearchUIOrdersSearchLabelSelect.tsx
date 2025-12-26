import React, {useState} from 'react';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../state/store";
import {SearchUICollapsableGroupSelect} from './SearchUICollapsableGroupSelect';

export const SearchUIOrdersSearchLabelSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'searchLabel'})

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
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