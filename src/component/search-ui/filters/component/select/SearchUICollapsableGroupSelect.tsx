import React, {use, useId, useRef, useState} from 'react'
import {Box, InputAdornment, Popover, SxProps} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {resolvePneSemanticPalette} from '../../../../../createTheme'
import {createPneMenuPanelStyle, createPnePickedRowStyle, PneChevronDownIcon} from '../../../../dropdown/dropdownLook'
import {useSearchUIFiltersStore} from '../../state/store'
import {OrderSearchLabel} from '../../types'
import {useTranslation} from 'react-i18next'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {createSearchUIOwnedAutoTestAttributes, useSearchUIAutoTestScope} from '../../AutoTestScope'
import {SearchUIDefaultsContext} from '../../../SearchUIProvider'
import PneTextField from '../../../../PneTextField'

const CRITERION_LABEL_OPTIONS_AUTOTEST_ID = 'criterion-label-options'
const CRITERION_LABEL_GROUP_AUTOTEST_ID = 'criterion-label-group'
const CRITERION_LABEL_OPTION_AUTOTEST_ID = 'criterion-label-option'
const CRITERION_LABEL_SEARCH_AUTOTEST_ID = 'criterion-label-search'
const CRITERION_LABEL_SEARCH_EMPTY_AUTOTEST_ID = 'criterion-label-search-empty'

interface GroupConfig {
    id: string
    autoTestValue: string
    label: string
    items: {
        value: OrderSearchLabel
        label: string
    }[]
}

const CMS_ORDER_SEARCH_LABELS: ReadonlySet<OrderSearchLabel> = new Set(['customer_id', 'merchant_customer_identifier'])

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
    const {anchorEl, id, open, onClose} = props
    const autoTestOwner = useSearchUIAutoTestScope()
    const fieldLabel = t('react.searchUI.ordersSearch.label', {defaultValue: 'Order search field'})

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
            slotProps={{
                paper: {
                    ...createSearchUIOwnedAutoTestAttributes(CRITERION_LABEL_OPTIONS_AUTOTEST_ID, autoTestOwner),
                    id,
                    role: 'dialog',
                    'aria-label': fieldLabel,
                    'aria-modal': true,
                    sx: optionsDialogSx,
                },
                transition: {onEntering: revealPickedOption},
            }}
        >
            <SearchUIOrdersSearchLabelOptions id={id} fieldLabel={fieldLabel} onClose={onClose} />
        </Popover>
    )
}

type OptionsProps = {
    id: string
    fieldLabel: string
    onClose: () => void
}

/** The content of the open panel. It lives only while the panel is open, so every opening starts with an empty search. */
const SearchUIOrdersSearchLabelOptions = ({id, fieldLabel, onClose}: OptionsProps) => {
    const {t} = useTranslation()

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const setOrderSearchCriterionLabel = useSearchUIFiltersStore(s => s.setOrderSearchCriterionLabel)
    const radioGroupId = useId()
    const {showCMSOrderSearchLabels} = use(SearchUIDefaultsContext)
    const cmsOrderSearchLabelsVisible = showCMSOrderSearchLabels()
    const visibleGroups = cmsOrderSearchLabelsVisible
        ? ORDERS_SEARCH_LABEL_GROUPS
        : ORDERS_SEARCH_LABEL_GROUPS.map(group => ({
              ...group,
              items: group.items.filter(item => !CMS_ORDER_SEARCH_LABELS.has(item.value)),
          }))

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(readExpandedGroups)
    const [query, setQuery] = useState('')
    const [lockedWidth, setLockedWidth] = useState<number>()
    const rootRef = useRef<HTMLDivElement>(null)

    // A query shows the matching fields of every group, folded or not. A group whose name matches shows all its fields.
    const normalizedQuery = normalizeSearch(query)
    const filtering = normalizedQuery !== ''
    const shownGroups = filtering
        ? visibleGroups
              .map(group =>
                  normalizeSearch(t(group.label)).includes(normalizedQuery)
                      ? group
                      : {
                            ...group,
                            items: group.items.filter(item => normalizeSearch(t(item.label)).includes(normalizedQuery)),
                        },
              )
              .filter(group => group.items.length > 0)
        : visibleGroups
    const firstMatch = filtering ? shownGroups[0]?.items[0] : undefined
    const searchLabel = t('react.searchUI.search', {defaultValue: 'Search'})

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

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // The panel is as wide as its longest field name; a shorter list of matches must not narrow it.
        if (lockedWidth === undefined) setLockedWidth(rootRef.current?.offsetWidth || undefined)
        setQuery(event.target.value)
    }

    const handleSearchKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            focusFirstChoice(rootRef.current)
        } else if (event.key === 'Enter' && firstMatch) {
            event.preventDefault()
            handleChange(firstMatch.value)
        }
    }

    const renderOptions = (group: GroupConfig) =>
        group.items.map(item => {
            const checked = ordersSearchLabel === item.value
            const optionId = `${id}-option-${item.value}`

            return (
                <Box
                    component={'label'}
                    htmlFor={optionId}
                    key={item.value}
                    data-pne-picked={checked ? '' : undefined}
                    sx={optionLabelSx}
                >
                    <Box
                        {...createAutoTestAttributes(CRITERION_LABEL_OPTION_AUTOTEST_ID, item.value)}
                        component={'input'}
                        id={optionId}
                        type={'radio'}
                        name={radioGroupId}
                        value={item.value}
                        checked={checked}
                        onChange={() => handleChange(item.value)}
                        onClick={() => {
                            if (checked) onClose()
                        }}
                        sx={radioSx}
                    />
                    {t(item.label)}
                </Box>
            )
        })

    return (
        <Box ref={rootRef} sx={lockedWidth === undefined ? rootSx : {...rootSx, minWidth: `${lockedWidth}px`}}>
            <Box sx={searchSx}>
                <PneTextField
                    size='large'
                    aria-label={searchLabel}
                    autoComplete={'off'}
                    autoFocus
                    fullWidth
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchLabel}
                    slotProps={{
                        htmlInput: createAutoTestAttributes(CRITERION_LABEL_SEARCH_AUTOTEST_ID),
                        input: {
                            startAdornment: (
                                <InputAdornment position={'start'}>
                                    <SearchRoundedIcon sx={{fontSize: 16}} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    type={'search'}
                    value={query}
                />
            </Box>
            <Box component={'fieldset'} sx={fieldsetSx}>
                <Box component={'legend'} sx={visuallyHiddenSx}>
                    {fieldLabel}
                </Box>
                {shownGroups.length === 0 ? (
                    <Box
                        {...createAutoTestAttributes(CRITERION_LABEL_SEARCH_EMPTY_AUTOTEST_ID)}
                        role={'status'}
                        sx={searchEmptySx}
                    >
                        {t('react.searchUI.ordersSearch.noMatches', {defaultValue: 'Nothing found'})}
                    </Box>
                ) : null}
                {shownGroups.map(group => {
                    // The ids follow the group, not its place: a query leaves some groups out.
                    const captionId = `${id}-summary-${group.autoTestValue}`
                    const optionsId = `${id}-group-${group.autoTestValue}`

                    // Matches are shown as a plain list under their group names: nothing folds while a query is typed.
                    if (filtering) {
                        return (
                            <Box key={group.id} data-pne-group={''} role={'group'} aria-labelledby={captionId}>
                                <Box id={captionId} sx={groupCaptionSx}>
                                    {t(group.label)}
                                </Box>
                                {renderOptions(group)}
                            </Box>
                        )
                    }

                    const isExpanded = expandedGroups[group.id]

                    return (
                        <Box
                            component={'details'}
                            key={group.id}
                            data-pne-group={''}
                            open={isExpanded}
                            onToggle={(event: React.SyntheticEvent<HTMLDetailsElement>) => {
                                handleToggle(group.id, event.currentTarget.open)
                            }}
                        >
                            <Box
                                {...createAutoTestAttributes(CRITERION_LABEL_GROUP_AUTOTEST_ID, group.autoTestValue)}
                                component={'summary'}
                                id={captionId}
                                tabIndex={0}
                                aria-controls={optionsId}
                                aria-expanded={isExpanded}
                                sx={groupSummarySx}
                            >
                                {t(group.label)}
                                <PneChevronDownIcon
                                    aria-hidden={true}
                                    sx={isExpanded ? expandedChevronSx : chevronSx}
                                />
                            </Box>
                            <Box id={optionsId} role={'group'} aria-labelledby={captionId}>
                                {renderOptions(group)}
                            </Box>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}

const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase()

// The panel opens with the cursor in the search field, so focus no longer brings the picked field into view.
const revealPickedOption = (paper: HTMLElement) => {
    const picked = paper.querySelector<HTMLElement>('[data-pne-picked]')
    if (picked) paper.scrollTop = picked.offsetTop - (paper.clientHeight - picked.offsetHeight) / 2
}

// Down from the search field: to the picked field when its row is shown, else to the first row, else to the first group.
const focusFirstChoice = (root: HTMLElement | null) => {
    const shown = Array.from(root?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []).filter(radio => {
        const group = radio.closest('details')
        return group === null || group.open
    })
    const target = shown.find(radio => radio.checked) ?? shown[0] ?? root?.querySelector<HTMLElement>('summary')
    target?.focus()
}

const createDefaultExpandedGroups = (): Record<string, boolean> =>
    Object.fromEntries(ORDERS_SEARCH_LABEL_GROUPS.map(group => [group.id, true]))

const readExpandedGroups = (): Record<string, boolean> => {
    const defaults = createDefaultExpandedGroups()

    try {
        const stored = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY)
        if (!stored) return defaults

        const parsed = JSON.parse(stored) as Record<string, unknown>

        return Object.fromEntries(
            ORDERS_SEARCH_LABEL_GROUPS.map(group => [
                group.id,
                typeof parsed?.[group.id] === 'boolean' ? parsed[group.id] : true,
            ]),
        ) as Record<string, boolean>
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

// UI Kit Dropdown list: the panel of the theme's lists, wide enough for the longest field name.
const optionsDialogSx: SxProps<Theme> = theme => ({
    ...createPneMenuPanelStyle(theme),
    width: 'max-content',
    minWidth: '280px',
    maxWidth: 'min(420px, calc(100vw - 32px))',
    maxHeight: 'min(480px, calc(100vh - 32px))',
})

// The panel's ring is drawn inside the panel: the content starts a pixel below the edge and leaves the ring in view.
const rootSx = {
    pt: '1px',
}

// UI Kit Dropdown list, the search row: as high as a row of the list, it stays at the top while the fields
// scroll under it. With the pixel above it keeps the panel's 4px inset; the 4px below are the gap to the list.
const searchSx: SxProps<Theme> = theme => ({
    backgroundColor: resolvePneSemanticPalette(theme).dropdown.panel.fill,
    m: '0 4px',
    p: '3px 0 4px',
    position: 'sticky',
    top: '1px',
    zIndex: 1,
})

// UI Kit Dropdown list, nothing found: the text in the middle of two rows.
const searchEmptySx: SxProps<Theme> = theme => ({
    alignItems: 'center',
    color: resolvePneSemanticPalette(theme).dropdown.status.text,
    display: 'flex',
    fontSize: '14px',
    justifyContent: 'center',
    lineHeight: '20px',
    minHeight: '80px',
    padding: '8px 12px',
    textAlign: 'center',
})

const fieldsetSx: SxProps = {
    border: 0,
    m: 0,
    // The 4px inset of the panel around its rows; the search row above carries the top one.
    p: '0 4px 4px',
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

// UI Kit Dropdown list, group caption: 12/16 Medium in the muted text colour at the foot of a 28px
// row; groups are split by a hairline.
const groupCaptionStyle = (theme: Theme) => {
    const pne = resolvePneSemanticPalette(theme)
    return {
        alignItems: 'flex-end',
        borderRadius: '4px',
        boxSizing: 'border-box',
        color: pne.dropdown.status.text,
        display: 'flex',
        fontSize: '12px',
        fontWeight: 500,
        height: '28px',
        justifyContent: 'space-between',
        lineHeight: '16px',
        padding: '0 12px 4px',
        '[data-pne-group] + [data-pne-group] > &': {
            borderRadius: '0 0 4px 4px',
            borderTop: `1px solid ${pne.dropdown.panel.ring}`,
            height: '33px',
            marginTop: '4px',
        },
    }
}

const groupCaptionSx: SxProps<Theme> = groupCaptionStyle

// The caption that folds its group carries the list's chevron.
const groupSummarySx: SxProps<Theme> = theme => ({
    ...groupCaptionStyle(theme),
    cursor: 'pointer',
    listStyle: 'none',
    '&::-webkit-details-marker': {
        display: 'none',
    },
    '&:focus-visible': {
        outline: `2px solid ${resolvePneSemanticPalette(theme).focusRing}`,
        outlineOffset: '-2px',
    },
})

const chevronSx: SxProps<Theme> = {
    fontSize: '16px',
}

const expandedChevronSx: SxProps<Theme> = {
    fontSize: '16px',
    transform: 'rotate(180deg)',
}

// UI Kit Dropdown/Option of the panel's lists (a 40px row, 14/20 text): the pointer and the keyboard
// highlight the row, the picked one is tinted and carries the check at its end. The radio button
// itself is not drawn: it lies over the whole row, so the row takes the click and the focus.
const optionLabelSx: SxProps<Theme> = theme => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    return {
        alignItems: 'center',
        borderRadius: '4px',
        boxSizing: 'border-box',
        color: dropdown.option.text,
        cursor: 'pointer',
        display: 'flex',
        fontSize: '14px',
        lineHeight: '20px',
        minHeight: '40px',
        padding: '10px 12px',
        position: 'relative',
        '&:hover, &:focus-within': {
            backgroundColor: dropdown.option.hover,
        },
        '&[data-pne-picked]': createPnePickedRowStyle(theme),
        '&[data-pne-picked]:hover, &[data-pne-picked]:focus-within': {
            backgroundColor: dropdown.option.hover,
        },
    }
}

const radioSx: SxProps = {
    appearance: 'none',
    cursor: 'pointer',
    height: '100%',
    inset: 0,
    m: 0,
    opacity: 0,
    position: 'absolute',
    width: '100%',
}
