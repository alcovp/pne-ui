import React, { useState } from 'react'
import { Box, Chip } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { selectUnderChipSx } from './style'
import { AbstractEntity, PneSelect } from '../../../../..'
import { useTranslation } from 'react-i18next'

interface IProps {
    value: AbstractEntity | null,
    onChange: (value: AbstractEntity) => void,
    options: AbstractEntity[],
}

const NULL_OPTION: AbstractEntity = {
    id: 0,
    displayName: '',
}

const SearchUIProcessorLogEntryTypeSelect = (props: IProps) => {
    const { t } = useTranslation()
    const {
        value,
        onChange,
        options,
    } = props
    const [open, setOpen] = useState(false)

    return <Box sx={{ position: 'relative' }}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={value ? value.displayName : t('react.chooseOne')}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={opt => opt.label}
            value={value ? value : NULL_OPTION}
            onChange={(value) => onChange(value as AbstractEntity)}
            options={options}
        />
    </Box>
}

export default SearchUIProcessorLogEntryTypeSelect
