import React, {useState} from 'react';
import {DateRangeSpecType} from '../../types';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIStore} from '../../state/store';
import {ExpandMore} from '@mui/icons-material';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';

interface IProps {
    value: DateRangeSpecType
    onChange: (value: DateRangeSpecType) => void
    options: readonly DateRangeSpecType[]
}

const SearchUIDateRangeSpecTypeSelect = (props: IProps) => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.DateRangeSpecType'})
    const {
        value,
        onChange,
        options,
    } = props
    const {
        dateRangeSpecType
    } = useSearchUIStore((store) => ({
        dateRangeSpecType: store.dateRangeSpec.dateRangeSpecType,
    }))
    const [open, setOpen] = useState(false)

    const withInputNear = dateRangeSpecType === 'EXACTLY'
        || dateRangeSpecType === 'DAYS_BEFORE'
        || dateRangeSpecType === 'HOURS_BEFORE'

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

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={optionRenderer(value)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={value}
            onChange={(value) => onChange(value as DateRangeSpecType)}
            options={options}
        />
    </Box>
}

export default SearchUIDateRangeSpecTypeSelect
