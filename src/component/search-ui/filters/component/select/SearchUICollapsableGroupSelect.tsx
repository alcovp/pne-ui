import React, {useId, useState} from 'react';
import {Box, Popover, SxProps, Typography} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../state/store";
import {OrderSearchLabel} from "../../types";
import {useTranslation} from "react-i18next";
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_LABEL_OPTIONS_AUTOTEST_ID = 'criterion-label-options'
const CRITERION_LABEL_GROUP_AUTOTEST_ID = 'criterion-label-group'
const CRITERION_LABEL_OPTION_AUTOTEST_ID = 'criterion-label-option'

interface GroupConfig {
    id: string
    autoTestValue: string
    label: string
    items: {
        value: OrderSearchLabel
        label: string
    }[]
}

export const ORDERS_SEARCH_LABEL_GROUPS: GroupConfig[] = [
    {
        id: 'searchLabelGroupID.orders.main',
        autoTestValue: 'main',
        label: 'searchLabelGroup.main',
        items: [
            {value: 'merchant_invoice_id', label: 'searchLabel.merchant_invoice_id'},
            {value: 'order_id', label: 'searchLabel.order_id'},
            {value: 'processor_order_id', label: 'searchLabel.processor_order_id'},
            {value: 'purpose', label: 'searchLabel.purpose'},
            {value: 'transaction_amount', label: 'searchLabel.transaction_amount'},
            {value: 'session_token', label: 'searchLabel.session_token'},
            {value: 'batch_id', label: 'searchLabel.batch_id'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.customer',
        autoTestValue: 'customer',
        label: 'searchLabelGroup.customer',
        items: [
            {value: 'customer_id', label: 'searchLabel.customer_id'},
            {value: 'merchant_customer_identifier', label: 'searchLabel.merchant_customer_identifier'},
            {value: 'customer_phone', label: 'searchLabel.customer_phone'},
            {value: 'customer_email', label: 'searchLabel.customer_email'},
            {value: 'customer_ip', label: 'searchLabel.customer_ip'},
            {value: 'customer_ip_country', label: 'searchLabel.customer_ip_country'},
            {value: 'customer_billing_country', label: 'searchLabel.customer_billing_country'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.sourceCard',
        autoTestValue: 'source-card',
        label: 'searchLabelGroup.sourceCard',
        items: [
            {value: 'source_bank_name', label: 'searchLabel.source_bank_name'},
            {value: 'source_country', label: 'searchLabel.source_country'},
            {value: 'source_from_order_id', label: 'searchLabel.source_from_order_id'},
            {value: 'source_bin', label: 'searchLabel.source_bin'},
            {value: 'source_bin_range_from_order_id', label: 'searchLabel.source_bin_range_from_order_id'},
            {value: 'source_last4', label: 'searchLabel.source_last4'},
            {value: 'source_bin_last4', label: 'searchLabel.source_bin_last4'},
            {value: 'source_auth_code', label: 'searchLabel.source_auth_code'},
            {value: 'source_arn', label: 'searchLabel.source_arn'},
            {value: 'source_rrn', label: 'searchLabel.source_rrn'},
            {value: 'source_card_holder', label: 'searchLabel.source_card_holder'},
            {value: 'source_card_ref_id', label: 'searchLabel.source_card_ref_id'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.destinationCard',
        autoTestValue: 'destination-card',
        label: 'searchLabelGroup.destinationCard',
        items: [
            {value: 'dest_bank_name', label: 'searchLabel.dest_bank_name'},
            {value: 'dest_country', label: 'searchLabel.dest_country'},
            {value: 'dest_from_order_id', label: 'searchLabel.dest_from_order_id'},
            {value: 'dest_bin', label: 'searchLabel.dest_bin'},
            {value: 'dest_bin_range_from_order_id', label: 'searchLabel.dest_bin_range_from_order_id'},
            {value: 'dest_last4', label: 'searchLabel.dest_last4'},
            {value: 'dest_bin_last', label: 'searchLabel.dest_bin_last'},
            {value: 'dest_auth_code', label: 'searchLabel.dest_auth_code'},
            {value: 'dest_arn', label: 'searchLabel.dest_arn'},
            {value: 'dest_rrn', label: 'searchLabel.dest_rrn'},
            {value: 'dest_card_ref_id', label: 'searchLabel.dest_card_ref_id'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.wire',
        autoTestValue: 'wire',
        label: 'searchLabelGroup.wire',
        items: [
            {value: 'account_number', label: 'searchLabel.account_number'},
            {value: 'routing_number', label: 'searchLabel.routing_number'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.cardPresentAPI',
        autoTestValue: 'card-present-api',
        label: 'searchLabelGroup.cardPresentAPI',
        items: [
            {value: 'reader_id', label: 'searchLabel.reader_id'},
            {value: 'reader_key_serial_number', label: 'searchLabel.reader_key_serial_number'},
            {value: 'reader_device_serial_number', label: 'searchLabel.reader_device_serial_number'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.mobileAPI',
        autoTestValue: 'mobile-api',
        label: 'searchLabelGroup.mobileAPI',
        items: [
            {value: 'device_serial_number', label: 'searchLabel.device_serial_number'},
            {value: 'phone_serial_number', label: 'searchLabel.phone_serial_number'},
            {value: 'phone_imei', label: 'searchLabel.phone_imei'},
        ],
    },
]

const EXPANDED_GROUPS_STORAGE_KEY = 'SearchUI_ordersSearch_expandedGroups'

type Props = {
    anchorEl: HTMLButtonElement | null
    id: string
    open: boolean
    onClose: () => void
}

export const SearchUICollapsableGroupSelect = (props: Props) => {
    const {t} = useTranslation()
    const {
        anchorEl,
        id,
        open,
        onClose,
    } = props

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const setOrderSearchCriterionLabel = useSearchUIFiltersStore(s => s.setOrderSearchCriterionLabel)
    const autoTestOwner = useSearchUIAutoTestScope()
    const radioGroupName = useId()
    const fieldLabel = t('react.searchUI.ordersSearch.label', {defaultValue: 'Order search field'})

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(readExpandedGroups)

    const handleChange = (value: OrderSearchLabel) => {
        setOrderSearchCriterionLabel(value)
        onClose()
    }

    const handleToggle = (groupId: string, expanded: boolean) => {
        if (expandedGroups[groupId] === expanded) return

        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: expanded,
        }))
        writeExpandedGroup(groupId, expanded)
    }

    const selectedGroup = ORDERS_SEARCH_LABEL_GROUPS.find(group => (
        group.items.some(item => item.value === ordersSearchLabel)
    ))

    return <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
        slotProps={{paper: {
            ...createSearchUIOwnedAutoTestAttributes(
                CRITERION_LABEL_OPTIONS_AUTOTEST_ID,
                autoTestOwner,
            ),
            id,
            role: 'dialog',
            'aria-label': fieldLabel,
            'aria-modal': true,
            sx: optionsDialogSx,
        }}}
    >
        <Box component={'fieldset'} sx={fieldsetSx}>
            <Box component={'legend'} sx={visuallyHiddenSx}>{fieldLabel}</Box>
            {ORDERS_SEARCH_LABEL_GROUPS.map((group, groupIndex) => {
                const isExpanded = expandedGroups[group.id]
                const summaryId = `${id}-summary-${groupIndex}`
                const optionsId = `${id}-group-${groupIndex}`
                const shouldFocusSummary = selectedGroup === undefined
                    ? groupIndex === 0
                    : selectedGroup.id === group.id && !isExpanded

                return <Box
                    component={'details'}
                    key={group.id}
                    open={isExpanded}
                    onToggle={(event: React.SyntheticEvent<HTMLDetailsElement>) => {
                        handleToggle(group.id, event.currentTarget.open)
                    }}
                >
                    <Box
                        {...createAutoTestAttributes(
                            CRITERION_LABEL_GROUP_AUTOTEST_ID,
                            group.autoTestValue,
                        )}
                        component={'summary'}
                        id={summaryId}
                        tabIndex={0}
                        autoFocus={open && shouldFocusSummary}
                        aria-controls={optionsId}
                        aria-expanded={isExpanded}
                        sx={groupSummarySx}
                    >
                        <Typography variant={'subtitle2'}>{t(group.label)}</Typography>
                        {isExpanded
                            ? <ExpandLessIcon aria-hidden={true} fontSize={'small'}/>
                            : <ExpandMoreIcon aria-hidden={true} fontSize={'small'}/>
                        }
                    </Box>
                    <Box
                        id={optionsId}
                        role={'group'}
                        aria-labelledby={summaryId}
                    >
                        {group.items.map((item, itemIndex) => {
                            const checked = ordersSearchLabel === item.value
                            const optionId = `${id}-option-${groupIndex}-${itemIndex}`

                            return <Box
                                component={'label'}
                                htmlFor={optionId}
                                key={item.value}
                                sx={createOptionLabelSx(checked)}
                            >
                                <Box
                                    {...createAutoTestAttributes(
                                        CRITERION_LABEL_OPTION_AUTOTEST_ID,
                                        item.value,
                                    )}
                                    component={'input'}
                                    id={optionId}
                                    type={'radio'}
                                    name={radioGroupName}
                                    value={item.value}
                                    checked={checked}
                                    autoFocus={open && isExpanded && checked}
                                    onChange={() => handleChange(item.value)}
                                    onClick={() => {
                                        if (checked) onClose()
                                    }}
                                    sx={radioSx}
                                />
                                <Typography component={'span'} variant={'body2'}>
                                    {t(item.label)}
                                </Typography>
                            </Box>
                        })}
                    </Box>
                </Box>
            })}
        </Box>
    </Popover>
}

const createDefaultExpandedGroups = (): Record<string, boolean> => Object.fromEntries(
    ORDERS_SEARCH_LABEL_GROUPS.map(group => [group.id, true]),
)

const readExpandedGroups = (): Record<string, boolean> => {
    const defaults = createDefaultExpandedGroups()

    try {
        const stored = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY)
        if (!stored) return defaults

        const parsed = JSON.parse(stored) as Record<string, unknown>

        return Object.fromEntries(ORDERS_SEARCH_LABEL_GROUPS.map(group => [
            group.id,
            typeof parsed?.[group.id] === 'boolean' ? parsed[group.id] : true,
        ])) as Record<string, boolean>
    } catch {
        return defaults
    }
}

const writeExpandedGroup = (groupId: string, expanded: boolean) => {
    try {
        const persisted = readExpandedGroups()
        persisted[groupId] = expanded
        localStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify(persisted))
    } catch {
        // Expansion persistence is optional; the native disclosure remains usable.
    }
}

const optionsDialogSx: SxProps = {
    width: 'max-content',
    minWidth: '280px',
    maxWidth: 'min(420px, calc(100vw - 32px))',
    maxHeight: 'min(480px, calc(100vh - 32px))',
}

const fieldsetSx: SxProps = {
    border: 0,
    m: 0,
    p: 0,
    minWidth: 0,
}

const visuallyHiddenSx: SxProps = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    p: 0,
    m: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
}

const groupSummarySx: SxProps = {
    bgcolor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    lineHeight: 1.5,
    p: 1,
    cursor: 'pointer',
    listStyle: 'none',
    '&::-webkit-details-marker': {
        display: 'none',
    },
}

const createOptionLabelSx = (selected: boolean): SxProps => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: 1,
    pl: 4,
    pr: 2,
    py: 1,
    cursor: 'pointer',
    bgcolor: selected ? 'action.selected' : undefined,
    '&:hover': {
        bgcolor: 'action.hover',
    },
    '&:focus-within': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: '-2px',
    },
})

const radioSx: SxProps = {
    width: '16px',
    height: '16px',
    m: 0,
    flex: '0 0 auto',
    cursor: 'pointer',
    accentColor: 'currentColor',
}
