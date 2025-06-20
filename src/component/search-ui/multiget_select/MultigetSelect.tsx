import React, {useContext, useEffect} from 'react'
import {Alert, Box, Divider, FormControlLabel, SxProps, ToggleButton, ToggleButtonGroup} from '@mui/material'
import {LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../filters/types'
import {useTranslation} from 'react-i18next'
import {AbstractEntity, PneButton, PneSwitch, PneTextField} from '../../..'
import {SearchUIDefaultsContext} from '../SearchUIProvider'
import {useMultigetSelectStore} from './state/store'
import {MultigetSearchLabel} from './state/type'
import {MultigetSelectTable} from './MultigetSelectTable'
// import {raiseUIError} from '../../../../error'; //TODO migration

type Props = {
    multigetCriterion: MultigetCriterion
    linkedMultigetCriteria: MultigetCriterion[]
    onSave: (criterion: MultigetCriterion) => void
    onCancel: () => void
}

export const MULTIGET_PAGE_SIZE = 10

export const MultigetSelect = (props: Props) => {
    const {
        multigetCriterion,
        linkedMultigetCriteria,
        onSave,
        onCancel,
    } = props
    const {t} = useTranslation()
    const {getMatchLinkedItems} = useContext(SearchUIDefaultsContext)

    const filterType = useMultigetSelectStore()(s => s.filterType)
    const onlyEnabledStatus = useMultigetSelectStore()(s => s.onlyEnabledStatus)
    const searchString = useMultigetSelectStore()(s => s.searchString)
    const searchLabel = useMultigetSelectStore()(s => s.searchLabel)
    const selectedItems = useMultigetSelectStore()(s => s.selectedItems)
    const currentPage = useMultigetSelectStore()(s => s.currentPage)
    const setFilterType = useMultigetSelectStore()(s => s.setFilterType)
    const setOnlyEnabledStatus = useMultigetSelectStore()(s => s.setOnlyEnabledStatus)
    const setSearchString = useMultigetSelectStore()(s => s.setSearchString)
    const setSearchLabel = useMultigetSelectStore()(s => s.setSearchLabel)
    const setAvailableItems = useMultigetSelectStore()(s => s.setAvailableItems)
    const setSelectedItems = useMultigetSelectStore()(s => s.setSelectedItems)
    const setCurrentPage = useMultigetSelectStore()(s => s.setCurrentPage)
    const setHasNextPage = useMultigetSelectStore()(s => s.setHasNextPage)
    const setLoading = useMultigetSelectStore()(s => s.setLoading)

    useEffect(() => {
        setFilterType(multigetCriterion.filterType)
    }, [multigetCriterion.filterType])

    useEffect(() => {
        setSelectedItems(parseInitialSelectedEntities(multigetCriterion))
    }, [
        multigetCriterion.filterType,
        multigetCriterion.deselectedItems,
        multigetCriterion.deselectedItemNames,
    ])

    useEffect(() => {
        setLoading(true)
        getMatchLinkedItems({
            type: multigetCriterion.entityType,
            searchString: searchLabel !== 'all' ? (searchLabel + ':' + searchString) : searchString,
            status: onlyEnabledStatus ? 'E' : null,
            startRow: (currentPage - 1) * MULTIGET_PAGE_SIZE,
            numRows: MULTIGET_PAGE_SIZE,
            criteria: linkedMultigetCriteria,
        })
            .then(entities => {
                if (!entities.length && currentPage > 1) {
                    setCurrentPage(1)
                } else {
                    setAvailableItems(entities)
                    setLoading(false)
                }
                setHasNextPage(entities.length > MULTIGET_PAGE_SIZE)
            })
            // .catch(raiseUIError);
            .catch(console.error)
    }, [
        searchString,
        searchLabel,
        filterType,
        currentPage,
        onlyEnabledStatus,
        linkedMultigetCriteria,
    ])

    const getSelectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return []
        } else {
            return selectedItems
        }
    }

    const getDeselectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return selectedItems
        } else {
            return []
        }
    }

    const getCurrentMultigetCriterion = (): MultigetCriterion => {
        return {
            entityType: multigetCriterion.entityType,
            filterType: filterType,
            searchString: /*searchStrings.join(',')*/ searchString,
            selectedItems: getSelectedItemsByFilterType().map(e => e.id).join(','),
            selectedItemNames: getSelectedItemsByFilterType().map(e => e.displayName).join(','),
            deselectedItems: getDeselectedItemsByFilterType().map(e => e.id).join(','),
            deselectedItemNames: getDeselectedItemsByFilterType().map(e => e.displayName).join(','),
        }
    }

    const onSaveClick = () => {
        setCurrentPage(1)
        onSave(getCurrentMultigetCriterion())
    }

    const onCancelClick = () => {
        setCurrentPage(1)
        onCancel()
    }

    const onExcludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.ALL)
    }

    const onIncludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.NONE)
    }

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchString(event.target.value)
    }

    const showGateSearchLabels = multigetCriterion.entityType === LinkedEntityTypeEnum.GATE
    const statusMakesSense = [
        LinkedEntityTypeEnum.PROCESSOR,
        LinkedEntityTypeEnum.GATE,
        LinkedEntityTypeEnum.PROJECT,
        LinkedEntityTypeEnum.ENDPOINT,
        LinkedEntityTypeEnum.MERCHANT,
        LinkedEntityTypeEnum.RESELLER,
        LinkedEntityTypeEnum.COMPANY,
    ].some(type => type === multigetCriterion.entityType)

    const showPoorSearchEngineImplementationAlert = /\s/.test(searchString) && searchLabel !== 'all'
    const poorSearchEngineImplementationAlert = t('react.searchUI.poorSearchEngine')

    return <>
        <Box sx={{display: 'flex', flexDirection: 'column', rowGap: '16px'}}>
            <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <ToggleButtonGroup
                    value={filterType}
                    exclusive
                    onChange={(e, value: MultichoiceFilterTypeEnum) => {
                        if (value === 'NONE') {
                            onIncludeClick()
                        } else {
                            onExcludeClick()
                        }
                    }}
                    size="small"
                    // color={'pneAccentuated'}
                >
                    <ToggleButton value={'NONE'} sx={toggleSx}>{t('react.searchUI.include')}</ToggleButton>
                    <ToggleButton value={'ALL'} sx={toggleSx}>{t('react.searchUI.exclude')}</ToggleButton>
                </ToggleButtonGroup>
                {statusMakesSense ? <FormControlLabel
                    label={t('react.searchUI.onlyEnabledStatus')}
                    control={<PneSwitch
                        checked={onlyEnabledStatus}
                        onChange={e => setOnlyEnabledStatus(e.target.checked)}
                    />}
                /> : null}
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', flexDirection: 'row', columnGap: '16px'}}>
                <PneTextField
                    value={searchString}
                    onChange={onSearchChange}
                    placeholder={t('search')}
                    fullWidth
                />
                {showGateSearchLabels ? <ToggleButtonGroup
                    value={searchLabel}
                    exclusive
                    onChange={(e, value: MultigetSearchLabel | null) => {
                        if (value !== null) {
                            setSearchLabel(value)
                        }
                    }}
                    sx={{display: 'flex', flex: '0 0 1'}}
                    size="small"
                >
                    <ToggleButton
                        value={'all' satisfies MultigetSearchLabel}
                        sx={toggleSx}
                    >{t('react.searchUI.all')}</ToggleButton>
                    <ToggleButton
                        value={'mid' satisfies MultigetSearchLabel}
                        sx={toggleSx}
                    >{t('MID')}</ToggleButton>
                    <ToggleButton
                        value={'descriptor' satisfies MultigetSearchLabel}
                        sx={toggleSx}
                    >{t('react.searchUI.descriptor')}</ToggleButton>
                </ToggleButtonGroup> : null}
            </Box>
            {showPoorSearchEngineImplementationAlert ? <Alert severity="warning">
                {poorSearchEngineImplementationAlert}
            </Alert> : null}
            <Divider/>
            <MultigetSelectTable/>
            <Divider/>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'end', mt: '15px'}}>
            <Box sx={{display: 'flex', gap: '20px'}}>
                <PneButton color={'pneNeutral'} onClick={onCancelClick}>{t('cancel')}</PneButton>
                <PneButton onClick={onSaveClick}>{t('save')}</PneButton>
            </Box>
        </Box>
    </>
}

const parseInitialSelectedEntities = (multigetCriterion: MultigetCriterion): AbstractEntity[] => {
    let selectedIds: string[]
    let selectedNames: string[]
    if (multigetCriterion.filterType === MultichoiceFilterTypeEnum.ALL) {
        selectedIds = multigetCriterion.deselectedItems.split(',')
        selectedNames = multigetCriterion.deselectedItemNames.split(',')
    } else {
        selectedIds = multigetCriterion.selectedItems.split(',')
        selectedNames = multigetCriterion.selectedItemNames.split(',')
    }
    const entities: AbstractEntity[] = []

    for (let i = 0; i < selectedIds.length; i++) {
        if (selectedIds[i]) {
            entities.push({
                id: parseInt(selectedIds[i]),
                displayName: selectedNames[i],
            })
        }
    }
    return entities
}

const toggleSx: SxProps = {textTransform: 'none'}