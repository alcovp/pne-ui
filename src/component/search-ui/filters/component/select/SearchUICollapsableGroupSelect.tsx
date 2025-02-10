import React, {useEffect, useState} from 'react';
import {Box, MenuItem, Select, SelectChangeEvent, styled, Typography} from '@mui/material';
import {selectUnderChipSx} from "./style";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../state/store";
import {OrderSearchLabel} from "../../types";
import {useTranslation} from "react-i18next";

interface GroupConfig {
    id: string
    label: string
    items: {
        value: OrderSearchLabel
        label: string
    }[]
}

const GROUPS: GroupConfig[] = [
    {
        id: 'searchLabelGroupID.orders.main',
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
        label: 'searchLabelGroup.customer',
        items: [
            {value: 'customer_id', label: 'searchLabel.customer_id'},
            {value: 'customer_phone', label: 'searchLabel.customer_phone'},
            {value: 'customer_email', label: 'searchLabel.customer_email'},
            {value: 'customer_ip', label: 'searchLabel.customer_ip'},
            {value: 'customer_ip_country', label: 'searchLabel.customer_ip_country'},
            {value: 'customer_billing_country', label: 'searchLabel.customer_billing_country'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.sourceCard',
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
        label: 'searchLabelGroup.wire',
        items: [
            {value: 'account_number', label: 'searchLabel.account_number'},
            {value: 'routing_number', label: 'searchLabel.routing_number'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.cardPresentAPI',
        label: 'searchLabelGroup.cardPresentAPI',
        items: [
            {value: 'reader_id', label: 'searchLabel.reader_id'},
            {value: 'reader_key_serial_number', label: 'searchLabel.reader_key_serial_number'},
            {value: 'reader_device_serial_number', label: 'searchLabel.reader_device_serial_number'},
        ],
    },
    {
        id: 'searchLabelGroupID.orders.mobileAPI',
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
    open: boolean
    onClose: () => void
    onOpen: () => void
}

export const SearchUICollapsableGroupSelect = (props: Props) => {
    const {t} = useTranslation()

    const {
        ordersSearchLabel,
        setOrderSearchCriterionLabel,
    } = useSearchUIFiltersStore((store) => ({
        ordersSearchLabel: store.ordersSearchLabel,
        setOrderSearchCriterionLabel: store.setOrderSearchCriterionLabel,
    }))

    const [selectedValue, setSelectedValue] = useState<string>(ordersSearchLabel)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const stored = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                GROUPS.forEach(group => {
                    if (typeof parsed[group.id] !== 'boolean') {
                        parsed[group.id] = true
                    }
                })
                return parsed
            } catch (err) {
                console.error('Error parsing expandedGroups from localStorage:', err)
            }
        }
        const defaultState: Record<string, boolean> = {}
        GROUPS.forEach(group => {
            defaultState[group.id] = true
        })
        return defaultState
    })

    useEffect(() => {
        localStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify(expandedGroups))
    }, [expandedGroups])

    const handleChange = (event: SelectChangeEvent) => {
        setOrderSearchCriterionLabel(event.target.value as OrderSearchLabel)
    }

    const toggleGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId],
        }))
    }

    const menuItems: React.ReactNode[] = GROUPS.flatMap(group => {
        const isExpanded = expandedGroups[group.id];

        return [
            <MenuItem
                key={group.id}
                sx={{
                    bgcolor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    lineHeight: 1.5,
                    p: 1,
                }}
                disableRipple
            >
                <Box
                    onClick={(e) => toggleGroup(group.id, e)}
                    sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                    }}
                >
                    <Typography variant="subtitle2">{t(group.label)}</Typography>
                    {isExpanded ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small"/>}
                </Box>
            </MenuItem>,
            ...group.items.map(item => (
                <MenuItem
                    key={`${group.id}-${item.value}`}
                    value={item.value}
                    onClick={() => setSelectedValue(item.value)}
                    sx={{pl: 4, display: isExpanded ? 'block' : 'none'}}
                >
                    {t(item.label)}
                </MenuItem>
            ))
        ]
    })

    return <Select
        value={selectedValue}
        onChange={handleChange}
        displayEmpty
        MenuProps={{
            anchorOrigin: {vertical: 'bottom', horizontal: 'left'},
            transformOrigin: {vertical: 'top', horizontal: 'left'},
        }}
        fullWidth
        sx={selectUnderChipSx}
        {...props}
    >
        {menuItems}
    </Select>
}