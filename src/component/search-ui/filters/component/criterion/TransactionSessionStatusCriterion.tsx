import React from 'react'
import { Box, Chip, FormControlLabel, SxProps } from '@mui/material'
import { PneCheckbox, PneModal, PneSelect, useModal } from '../../../../..'
import { useSearchUIFiltersStore } from '../../state/store'
import { TransactionSessionGroup, TransactionSessionStatus } from '../../types'
import { useTranslation } from 'react-i18next'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'

const CRITERION_TRANSACTION_SESSION_STATUS_AUTOTEST_ID = 'criterion-transaction-session-status'
const CRITERION_TRANSACTION_SESSION_STATUS_GROUP_VALUE_AUTOTEST_ID =
    'criterion-transaction-session-status-group-value'
const CRITERION_TRANSACTION_SESSION_STATUS_GROUP_AUTOTEST_ID =
    'criterion-transaction-session-status-group'
const CRITERION_TRANSACTION_SESSION_STATUS_GROUP_OPTIONS_AUTOTEST_ID =
    'criterion-transaction-session-status-group-options'
const CRITERION_TRANSACTION_SESSION_STATUS_GROUP_OPTION_AUTOTEST_ID =
    'criterion-transaction-session-status-group-option'
const CRITERION_TRANSACTION_SESSION_STATUS_OPTION_AUTOTEST_ID =
    'criterion-transaction-session-status-option'
const CRITERION_TRANSACTION_SESSION_STATUS_PANEL_AUTOTEST_ID =
    'criterion-transaction-session-status-panel'
const CRITERION_TRANSACTION_SESSION_STATUS_VALUE_AUTOTEST_ID =
    'criterion-transaction-session-status-value'

export const TransactionSessionStatusCriterion = () => {
    const {
        open,
        handleOpen,
        handleClose,
    } = useModal()

    const {t} = useTranslation()
    const autoTestOwner = useSearchUIAutoTestScope()
    const panelId = React.useId()

    const transactionSessionStatusGroup = useSearchUIFiltersStore(s => s.transactionSessionStatusGroup)
    const transactionSessionStatuses = useSearchUIFiltersStore(s => s.transactionSessionStatuses)
    const setGroup = useSearchUIFiltersStore(s => s.setTransactionSessionStatusGroupCriterion)
    const setStatuses = useSearchUIFiltersStore(s => s.setTransactionSessionStatusesCriterion)
    const availableStatuses = useSearchUIFiltersStore(s => s.prefetchedData.transactionSessionStatuses)
    const loading = useSearchUIFiltersStore(
        s => s.prefetchedDataLoading.transactionSessionStatuses,
    )

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
    const triggerLabel = t('react.searchUI.transactionSessionStatus', {
        defaultValue: 'Transaction session statuses',
    })
    const groupLabel = t('react.searchUI.transactionSessionStatusGroup', {
        defaultValue: 'Transaction session status group',
    })
    const modalTitle = t('react.searchUI.addSessionStatusTitle')
    const groupValue = groupOptions.includes(transactionSessionStatusGroup)
        ? transactionSessionStatusGroup
        : ''

    return <>
        <Box
            {...createAutoTestAttributes(
                CRITERION_TRANSACTION_SESSION_STATUS_AUTOTEST_ID,
                transactionSessionStatusGroup,
            )}
            component='button'
            type='button'
            sx={containerSx}
            onClick={handleOpen}
            aria-label={triggerLabel}
            aria-controls={open ? panelId : undefined}
            aria-expanded={open}
            aria-haspopup='dialog'
            aria-busy={loading}
        >
            <Box sx={chipsRowSx}>
                <Chip
                    {...createAutoTestAttributes(
                        CRITERION_TRANSACTION_SESSION_STATUS_GROUP_VALUE_AUTOTEST_ID,
                        transactionSessionStatusGroup,
                    )}
                    label={transactionSessionStatusGroup}
                    size={'small'}
                />
            </Box>
            <Box sx={chipsRowSx}>
                {selectedStatuses.map(status =>
                    <Chip
                        {...createAutoTestAttributes(
                            CRITERION_TRANSACTION_SESSION_STATUS_VALUE_AUTOTEST_ID,
                            status.displayName,
                        )}
                        label={status.displayName}
                        size={'small'}
                        key={status.displayName}
                    />)
                }
            </Box>
        </Box>
        <PneModal
            open={open}
            onClose={handleClose}
            title={modalTitle}
            containerSx={modalContainerSx}
            containerProps={{
                ...createSearchUIOwnedAutoTestAttributes(
                    CRITERION_TRANSACTION_SESSION_STATUS_PANEL_AUTOTEST_ID,
                    autoTestOwner,
                ),
                id: panelId,
                role: 'dialog',
                'aria-label': modalTitle,
                'aria-modal': true,
                'aria-busy': loading,
            }}
            closeButtonProps={{
                'aria-label': t('close', {defaultValue: 'Close'}),
            }}
        >
            <Box sx={modalContentSx}>
                <PneSelect
                    value={groupValue}
                    onChange={value => changeGroup(value as TransactionSessionGroup)}
                    options={groupOptions}
                    label={groupLabel}
                    disabled={loading || groupOptions.length === 0}
                    getOptionProps={option => createAutoTestAttributes(
                        CRITERION_TRANSACTION_SESSION_STATUS_GROUP_OPTION_AUTOTEST_ID,
                        option.value,
                    )}
                    MenuProps={{
                        slotProps: {
                            list: createSearchUIOwnedAutoTestAttributes(
                                CRITERION_TRANSACTION_SESSION_STATUS_GROUP_OPTIONS_AUTOTEST_ID,
                                autoTestOwner,
                            ),
                        },
                    }}
                    SelectDisplayProps={{
                        ...createAutoTestAttributes(
                            CRITERION_TRANSACTION_SESSION_STATUS_GROUP_AUTOTEST_ID,
                            transactionSessionStatusGroup,
                        ),
                        'aria-label': groupLabel,
                        'aria-busy': loading,
                    }}
                />
                <Box sx={checkboxesSx}>
                    {transactionSessionStatuses.map(status => (
                        <Box key={status.displayName} sx={checkboxItemSx}>
                            <FormControlLabel
                                label={status.displayName}
                                control={<PneCheckbox
                                    checked={status.selected}
                                    disabled={loading}
                                    onChange={() => toggleStatus(status.displayName)}
                                    slotProps={{
                                        input: createAutoTestAttributes(
                                            CRITERION_TRANSACTION_SESSION_STATUS_OPTION_AUTOTEST_ID,
                                            status.displayName,
                                        ),
                                    }}
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
    appearance: 'none',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    font: 'inherit',
    rowGap: '4px',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
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
