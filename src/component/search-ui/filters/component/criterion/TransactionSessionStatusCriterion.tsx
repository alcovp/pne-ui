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
    const [initialStatusesSet, setInitialStatusesSet] = useState(transactionSessionStatuses.length > 0)

    useEffect(() => {
        getTransactionSessionStatuses()
            .then(setAvailableStatuses)
            .catch(console.error)
    }, [getTransactionSessionStatuses])

    useEffect(() => {
        if (!availableStatuses.size || initialStatusesSet) {
            return
        }

        const statuses = availableStatuses.get(transactionSessionStatusGroup) ?? []
        setStatuses([...statuses])
        setInitialStatusesSet(true)
    }, [availableStatuses, initialStatusesSet, setStatuses, transactionSessionStatusGroup])

    useEffect(() => {
        if (transactionSessionStatuses.length > 0 && !initialStatusesSet) {
            setInitialStatusesSet(true)
        }
    }, [initialStatusesSet, transactionSessionStatuses.length])

    const toggleStatus = (status: string) => {
        if (transactionSessionStatuses.includes(status)) {
            setStatuses(transactionSessionStatuses.filter(s => s !== status))
        } else {
            setStatuses([...transactionSessionStatuses, status])
        }
    }

    const changeGroup = (group: TransactionSessionGroup) => {
        setGroup(group)
        const statuses = availableStatuses.get(group) ?? []
        setStatuses([...statuses])
        setInitialStatusesSet(true)
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
        <PneModal open={open} onClose={handleClose} title={'react.searchUI.addSessionStatusTitle'}>
            <Box sx={modalContentSx}>
                <PneSelect
                    value={transactionSessionStatusGroup}
                    onChange={value => changeGroup(value as TransactionSessionGroup)}
                    options={groupOptions}
                    label={'react.searchUI.transactionSessionStatusGroup'}
                />
                <Box sx={checkboxesSx}>
                    {statusesForGroup.map(status => (
                        <Box key={status} sx={checkboxItemSx}>
                            <FormControlLabel
                                label={status}
                                control={<PneCheckbox
                                    checked={transactionSessionStatuses.includes(status)}
                                    onChange={() => toggleStatus(status)}
                                />}
                            />
                        </Box>
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

const checkboxItemSx: SxProps = {
    '&:not(:last-of-type)': {
        borderBottom: '1px solid #EFF2F5',
    },
}
