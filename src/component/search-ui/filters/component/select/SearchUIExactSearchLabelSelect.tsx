import React, {useState} from 'react';
import {ExactCriterionSearchLabelEnum} from '../../types';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';

interface IProps {
    value: ExactCriterionSearchLabelEnum,
    onChange: (value: ExactCriterionSearchLabelEnum) => void,
    options: ExactCriterionSearchLabelEnum[],
}

const SearchUIExactSearchLabelSelect = (props: IProps) => {
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.ExactCriterionSearchLabelEnum'})
    const {
        value,
        onChange,
        options,
    } = props
    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={optionRenderer(value)}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={value}
            onChange={(value) => onChange(value as ExactCriterionSearchLabelEnum)}
            options={options}
        />
    </Box>
}

export default SearchUIExactSearchLabelSelect
