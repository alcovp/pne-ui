import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip } from '@mui/material'
import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AbstractEntity, PneSelect } from '../../../../..'
import { selectUnderChipSx } from './style'

interface IProps {
    value: AbstractEntity | null
    onChange: (value: AbstractEntity) => void
    options: readonly AbstractEntity[]
    placeholder?: ReactNode
    disabled?: boolean
    ariaLabel?: string
}

const SearchUIAbstractEntityChipSelect = (props: IProps) => {
    const { t } = useTranslation()
    const {
        value,
        onChange,
        options,
        placeholder = t('react.chooseOne'),
        disabled = false,
        ariaLabel,
    } = props
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (disabled) {
            setOpen(false)
        }
    }, [disabled])

    const openSelect = () => {
        if (!disabled) {
            setOpen(true)
        }
    }

    return <Box
        sx={{
            position: 'relative',
            display: 'inline-flex',
            maxWidth: '100%',
        }}
    >
        <Chip
            disabled={disabled}
            onDelete={openSelect}
            deleteIcon={<ExpandMoreIcon/>}
            label={value?.displayName ?? placeholder}
            size={'small'}
            sx={{ maxWidth: '100%' }}
        />
        <PneSelect
            disabled={disabled}
            inputProps={ariaLabel ? { 'aria-label': ariaLabel } : undefined}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={openSelect}
            sx={selectUnderChipSx}
            getOptionLabel={option => option.label}
            value={(value?.id ?? '') as unknown as AbstractEntity}
            onChange={value => onChange(value as AbstractEntity)}
            options={options}
        />
    </Box>
}

export default SearchUIAbstractEntityChipSelect
