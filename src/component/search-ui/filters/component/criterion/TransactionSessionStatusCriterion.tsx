import React from 'react'
import { Box, Chip, FormControlLabel, SxProps } from '@mui/material'
import { PneCheckbox, PneModal, PneSelect, useModal } from '../../../../..'
import { useSearchUIFiltersStore } from '../../state/store'
import { TransactionSessionGroup, TransactionSessionStatus } from '../../types'
import { useTranslation } from 'react-i18next'

export const TransactionSessionStatusCriterion = () => {
    const {
        open,
        handleOpen,
        handleClose,
    } = useModal()

    const {t} = useTranslation()

    const transactionSessionStatusGroup = useSearchUIFiltersStore(s => s.transactionSessionStatusGroup)
    const transactionSessionStatuses = useSearchUIFiltersStore(s => s.transactionSessionStatuses)
    const setGroup = useSearchUIFiltersStore(s => s.setTransactionSessionStatusGroupCriterion)
    const setStatuses = useSearchUIFiltersStore(s => s.setTransactionSessionStatusesCriterion)
    const availableStatuses = useSearchUIFiltersStore(s => s.prefetchedData.transactionSessionStatuses)

    const copyStatuses = (statuses: TransactionSessionStatus[]) => statuses.map(status => ({ ...status }))

    const toggleStatus = (statusDisplayName: string) => {
        setStatuses(transactionSessionStatuses.map(status => {
            if (status.displayName !== statusDisplayName) {
                return status
            }

            return {
                ...status,
                selected: !status.selected,
            }
        }))
    }

    const changeGroup = (group: TransactionSessionGroup) => {
        setGroup(group)
        const statuses = availableStatuses?.get(group) ?? []
        setStatuses(copyStatuses(statuses))
    }

    const groupOptions = availableStatuses ? Array.from(availableStatuses.keys()) : []
    const selectedStatuses = transactionSessionStatuses.filter(status => status.selected)

    return <>
        <Box sx={containerSx} onClick={handleOpen}>
            <Box sx={chipsRowSx}>
                <Chip label={transactionSessionStatusGroup} size={'small'}/>
            </Box>
            <Box sx={chipsRowSx}>
                {selectedStatuses.map(status =>
                    <Chip label={status.displayName} size={'small'} key={status.displayName}/>)
                }
            </Box>
        </Box>
        <PneModal
            open={open}
            onClose={handleClose}
            title={t('react.searchUI.addSessionStatusTitle')}
            containerSx={modalContainerSx}
        >
            <Box sx={modalContentSx}>
                <PneSelect
                    value={transactionSessionStatusGroup}
                    onChange={value => changeGroup(value as TransactionSessionGroup)}
                    options={groupOptions}
                    label={t('react.searchUI.transactionSessionStatusGroup')}
                />
                <Box sx={checkboxesSx}>
                    {transactionSessionStatuses.map(status => (
                        <Box key={status.displayName} sx={checkboxItemSx}>
                            <FormControlLabel
                                label={status.displayName}
                                control={<PneCheckbox
                                    checked={status.selected}
                                    onChange={() => toggleStatus(status.displayName)}
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

const modalContainerSx: SxProps = {
    width: {
        xs: 'clamp(360px, calc(100vw - 32px), 600px)',
        sm: '600px',
    },
    minWidth: 0,
    maxWidth: '600px',
}
