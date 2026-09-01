import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {Box, Chip, SxProps} from '@mui/material'
import React, {ReactNode, useState} from 'react'

import {PneSelect} from '../../../../..'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {selectUnderChipSx} from './style'

const CRITERION_OPTION_AUTOTEST_ID = 'criterion-option'
const CRITERION_SELECT_AUTOTEST_ID = 'criterion-select'

type Props<T extends string> = {
    value: T
    options: readonly T[]
    onChange: (value: T) => void
    getOptionLabel: (value: T) => ReactNode
    ariaLabel: string
    mode?: 'chips' | 'select'
}

/** Enum selector rendered either as a chip group or as a compact chip-backed dropdown. */
export const SearchUIEnumChipSelect = <T extends string, >(props: Props<T>) => {
    const {
        value,
        options,
        onChange,
        getOptionLabel,
        ariaLabel,
        mode = 'chips',
    } = props
    const [open, setOpen] = useState(false)

    if (mode === 'select') {
        return <Box sx={{position: 'relative', display: 'inline-flex', flexShrink: 0}}>
            <Chip
                onDelete={() => setOpen(true)}
                deleteIcon={<ExpandMoreIcon/>}
                label={getOptionLabel(value)}
                size={'small'}
            />
            <PneSelect
                aria-label={ariaLabel}
                SelectDisplayProps={createAutoTestAttributes(CRITERION_SELECT_AUTOTEST_ID)}
                open={open}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                sx={selectUnderChipSx}
                getOptionLabel={option => String(getOptionLabel(option))}
                getOptionProps={option => createAutoTestAttributes(
                    CRITERION_OPTION_AUTOTEST_ID,
                    option,
                )}
                value={value}
                onChange={onChange}
                options={options}
            />
        </Box>
    }

    return <Box role={'group'} aria-label={ariaLabel} sx={centerSx}>
        {options.map(option => {
            const selected = option === value

            return <Chip
                {...createAutoTestAttributes(CRITERION_OPTION_AUTOTEST_ID, option)}
                aria-pressed={selected}
                onClick={() => onChange(option)}
                key={option}
                label={getOptionLabel(option)}
                color={selected ? 'primary' : 'default'}
                size={'small'}
            />
        })}
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    columnGap: '5px',
}
