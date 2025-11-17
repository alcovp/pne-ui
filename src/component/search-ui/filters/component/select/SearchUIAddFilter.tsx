import React, {useState} from 'react';
import {CriterionTypeEnum} from '../../types';
import {Box, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {ExpandMore} from '@mui/icons-material';
import {PneButton, PneSelect} from '../../../../..';

type Props = {
    onChange: (value: CriterionTypeEnum) => void
    options: CriterionTypeEnum[]
}

const SearchUIAddFilter = (props: Props) => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.CriterionTypeEnum'})
    const {
        onChange,
        options,
    } = props
    const [open, setOpen] = useState(false)

    return <Box sx={relativeContainerSx}>
        <PneButton
            onClick={() => setOpen(true)}
            size={'small'}
            endIcon={<ExpandMore/>}
            sx={addFilterButtonSx}
        >{t('react.searchUI.addCriterion')}</PneButton>
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            options={options}
            onChange={(value) => onChange(value as CriterionTypeEnum)}
            sx={selectSx}
            value={''}
            getOptionLabel={opt => optionRenderer(opt.label)}
        />
    </Box>
}

export default SearchUIAddFilter

const relativeContainerSx: SxProps = {
    position: 'relative',
}

const addFilterButtonSx: SxProps = {
    whiteSpace: 'nowrap',
}

const selectSx: SxProps = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    '& .MuiSvgIcon-root.MuiSelect-icon': {
        display: 'none',
    },
    '& .MuiSelect-select': {
        height: '100%',
        paddingY: 0,
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent !important',
    },
    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
        height: '100%',
    },
}
