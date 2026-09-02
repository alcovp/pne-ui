import React, {useState} from 'react';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../state/store";
import {SearchUICollapsableGroupSelect} from './SearchUICollapsableGroupSelect';

export const SearchUIOrdersSearchLabelSelect = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'searchLabel'})

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const labelTip = ordersSearchLabel.startsWith('source_')
        ? t('orders.search.labelTip.source', {defaultValue: 'src.'})
        : ordersSearchLabel.startsWith('dest_')
            ? t('orders.search.labelTip.destination', {defaultValue: 'dest.'})
            : null

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={<Box component={'span'}>
                {optionRenderer(ordersSearchLabel)}
                {labelTip && <>
                    {' '}
                    <Box component={'span'} sx={labelTipSx}>{labelTip}</Box>
                </>}
            </Box>}
            size={'small'}
        />
        <SearchUICollapsableGroupSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        />
    </Box>
}

const labelTipSx = {
    color: 'text.secondary',
    fontSize: '10px',
    lineHeight: '12px',
}
