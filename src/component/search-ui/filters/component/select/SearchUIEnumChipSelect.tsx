import {Box, Chip, SxProps} from '@mui/material';
import React, {ReactNode} from 'react';

import {createAutoTestAttributes} from '../../../../AutoTestAttribute';

const CRITERION_OPTION_AUTOTEST_ID = 'criterion-option'

type Props<T extends string> = {
    value: T
    options: readonly T[]
    onChange: (value: T) => void
    getOptionLabel: (value: T) => ReactNode
    ariaLabel: string
}

export const SearchUIEnumChipSelect = <T extends string, >(props: Props<T>) => {
    const {
        value,
        options,
        onChange,
        getOptionLabel,
        ariaLabel,
    } = props

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
