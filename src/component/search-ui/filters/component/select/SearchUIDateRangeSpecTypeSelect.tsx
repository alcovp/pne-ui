import React, {useState} from 'react';
import {DATE_RANGE_SPEC_TYPES, DateRangeSpecType} from '../../types';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {ExpandMore} from '@mui/icons-material';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';

const SearchUIDateRangeSpecTypeSelect = () => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.DateRangeSpecType'})
    const {
        dateRangeSpec,
        setDateRangeCriterion,
    } = useSearchUIFiltersStore((store) => ({
        dateRangeSpec: store.dateRangeSpec,
        setDateRangeCriterion: store.setDateRangeCriterion,
    }))
    const [open, setOpen] = useState(false)

    const withInputNear = dateRangeSpec.dateRangeSpecType === 'EXACTLY'
        || dateRangeSpec.dateRangeSpecType === 'DAYS_BEFORE'
        || dateRangeSpec.dateRangeSpecType === 'HOURS_BEFORE'

    const selectSx: SxProps = {
        flexShrink: 0,
        width: withInputNear ? '50%' : '100%',
        [`& fieldset`]: {
            borderRadius: '0',
            borderColor: 'transparent !important',
            borderRightColor: withInputNear ? '#F1F5FA !important' : 'transparent !important',
        },
        ...selectUnderChipSx
    }

    const handleSetDateRangeSpecType = (dateRangeSpecType: DateRangeSpecType) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateRangeSpecType: dateRangeSpecType,
        })
    }

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(dateRangeSpec.dateRangeSpecType)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={dateRangeSpec.dateRangeSpecType}
            onChange={dateRangeSpec => handleSetDateRangeSpecType(dateRangeSpec as DateRangeSpecType)}
            options={DATE_RANGE_SPEC_TYPES}
        />
    </Box>
}

export default SearchUIDateRangeSpecTypeSelect
