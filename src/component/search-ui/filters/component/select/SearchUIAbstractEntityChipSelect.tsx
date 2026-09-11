import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Chip } from '@mui/material'
import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AbstractEntity, PneSelect } from '../../../../..'
import { createAutoTestAttributes } from '../../../../AutoTestAttribute'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'
import { selectUnderChipSx } from './style'

interface AutoTestContract {
    controlId: string
    optionsId: string
    optionId: string
}

interface IProps {
    value: AbstractEntity | null
    onChange: (value: AbstractEntity) => void
    options: readonly AbstractEntity[]
    placeholder?: ReactNode
    disabled?: boolean
    loading?: boolean
    ariaLabel?: string
    autoTest?: AutoTestContract
}

const SearchUIAbstractEntityChipSelect = (props: IProps) => {
    const { t } = useTranslation()
    const {
        value,
        onChange,
        options,
        placeholder = t('react.chooseOne'),
        disabled = false,
        loading,
        ariaLabel,
        autoTest,
    } = props
    const [open, setOpen] = useState(false)
    const autoTestOwner = useSearchUIAutoTestScope()
    const selectedOption = value === null
        ? undefined
        : options.find(option => option.id === value.id)

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
            aria-hidden={autoTest ? true : undefined}
            tabIndex={autoTest ? -1 : undefined}
            sx={{
                maxWidth: '100%',
                pointerEvents: autoTest ? 'none' : undefined,
            }}
        />
        <PneSelect
            disabled={disabled}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={openSelect}
            sx={selectUnderChipSx}
            getOptionKey={option => option.id}
            getOptionLabel={option => option.displayName}
            value={selectedOption ?? null}
            onChange={onChange}
            options={options}
            getOptionProps={autoTest
                ? option => createAutoTestAttributes(autoTest.optionId, option.id)
                : undefined}
            MenuProps={autoTest
                ? {
                    slotProps: {
                        list: createSearchUIOwnedAutoTestAttributes(
                            autoTest.optionsId,
                            autoTestOwner,
                        ),
                    },
                }
                : undefined}
            SelectDisplayProps={{
                ...(autoTest
                    ? createAutoTestAttributes(autoTest.controlId, value?.id)
                    : {}),
                ...(ariaLabel ? {'aria-label': ariaLabel} : {}),
                'aria-busy': loading,
            }}
        />
    </Box>
}

export default SearchUIAbstractEntityChipSelect
