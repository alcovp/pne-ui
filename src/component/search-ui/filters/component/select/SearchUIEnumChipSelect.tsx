import React, {ReactNode, useState} from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {Box, Chip} from '@mui/material'
import {PneSelect} from '../../../../..'
import {selectUnderChipSx} from './style'

interface IProps<T extends string> {
    value: T
    options: readonly T[]
    onChange: (value: T) => void
    getOptionLabel: (value: T) => ReactNode
    ariaLabel: string
}

/** Compact single-value selector shared by Search UI enum-like criteria. */
export const SearchUIEnumChipSelect = <T extends string, >(props: IProps<T>) => {
    const {
        value,
        options,
        onChange,
        getOptionLabel,
        ariaLabel,
    } = props

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative', display: 'inline-flex', flexShrink: 0}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={getOptionLabel(value)}
            size={'small'}
        />
        <PneSelect
            aria-label={ariaLabel}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={option => getOptionLabel(option.label as T)}
            value={value}
            onChange={option => onChange(option as T)}
            options={options}
        />
    </Box>
}
