import React, { useContext, useEffect, useState } from 'react'
import { Box, Chip, FormControlLabel, SxProps } from '@mui/material'
import { PneCheckbox, PneModal, PneSelect, useModal } from '../../../../..'
import { useSearchUIFiltersStore } from '../../state/store'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import { TransactionSessionGroup } from '../../types'

export const TransactionSessionStatusCriterion = () => {
    const {
        open,
        handleOpen,
        handleClose,
    } = useModal()

    const transactionSessionStatusGroup = useSearchUIFiltersStore(s => s.transactionSessionStatusGroup)
    const transactionSessionStatuses = useSearchUIFiltersStore(s => s.transactionSessionStatuses)
    const setGroup = useSearchUIFiltersStore(s => s.setTransactionSessionStatusGroupCriterion)
    const setStatuses = useSearchUIFiltersStore(s => s.setTransactionSessionStatusesCriterion)

    const { getTransactionSessionStatuses } = useContext(SearchUIDefaultsContext)
    const [availableStatuses, setAvailableStatuses] = useState<Map<TransactionSessionGroup, string[]>>(new Map())

    useEffect(() => {
        getTransactionSessionStatuses()
            .then(setAvailableStatuses)
            .catch(console.error)
    }, [getTransactionSessionStatuses])

    const toggleStatus = (status: string) => {
        if (transactionSessionStatuses.includes(status)) {
            setStatuses(transactionSessionStatuses.filter(s => s !== status))
        } else {
            setStatuses([...transactionSessionStatuses, status])
        }
    }

    const changeGroup = (group: TransactionSessionGroup) => {
        setGroup(group)
        setStatuses([])
    }

    const groupOptions = Array.from(availableStatuses.keys())
    const statusesForGroup = availableStatuses.get(transactionSessionStatusGroup) ?? []

    return <>
        <Box sx={containerSx} onClick={handleOpen}>
            <Box sx={chipsRowSx}>
                <Chip label={transactionSessionStatusGroup} size={'small'}/>
            </Box>
            <Box sx={chipsRowSx}>
                {transactionSessionStatuses.map(status =>
                    <Chip label={status} size={'small'} key={status}/>)
                }
            </Box>
        </Box>
        <PneModal open={open} onClose={handleClose}>
            <Box sx={modalContentSx}>
                <PneSelect
                    value={transactionSessionStatusGroup}
                    onChange={value => changeGroup(value as TransactionSessionGroup)}
                    options={groupOptions}
                />
                <Box sx={checkboxesSx}>
                    {statusesForGroup.map(status => (
                        <FormControlLabel
                            key={status}
                            label={status}
                            control={<PneCheckbox
                                checked={transactionSessionStatuses.includes(status)}
                                onChange={() => toggleStatus(status)}
                            />}
                        />
                    ))}
                </Box>
            </Box>
        </PneModal>
    </>
}

export default TransactionSessionStatusCriterion

const containerSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '4px',
    cursor: 'pointer',
    width: '100%',
    m: '8px 0',
}

const chipsRowSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '5px',
    rowGap: '5px',
    flexWrap: 'wrap',
}

const modalContentSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
}

const checkboxesSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
}

