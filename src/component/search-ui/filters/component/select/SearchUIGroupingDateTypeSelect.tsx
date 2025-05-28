import React, {useState} from 'react';
import {GROUPING_DATE_TYPES, GroupingDateType} from '../../types';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {selectUnderChipSx} from './style';
import {ExpandMore} from '@mui/icons-material';
import {PneSelect} from '../../../../..';

const SearchUIGroupingDateTypeSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'performanceReport.groupType'})

    const dateType = useSearchUIFiltersStore(s => s.grouping.dateType)
    const setGroupingCriterionDateType = useSearchUIFiltersStore(s => s.setGroupingCriterionDateType)

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(dateType)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={dateType}
            onChange={(value) => setGroupingCriterionDateType(value as GroupingDateType)}
            options={GROUPING_DATE_TYPES}
        />
    </Box>
}

export default SearchUIGroupingDateTypeSelect
