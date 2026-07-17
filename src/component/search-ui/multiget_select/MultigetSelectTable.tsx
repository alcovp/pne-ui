import React from 'react'
import {Box, Divider, Pagination} from '@mui/material'
import {AbstractEntity, PneButton} from '../../../index'
import {MULTIGET_PAGE_SIZE} from './MultigetSelect'
import {useTranslation} from 'react-i18next'
import {SxProps} from '@mui/material/styles'
import {useMultigetSelectStore} from './state/store'
import {createAutoTestAttributes} from '../../AutoTestAttribute'

const CRITERION_MULTIGET_AVAILABLE_AUTOTEST_ID = 'criterion-multiget-available'
const CRITERION_MULTIGET_SELECTED_AUTOTEST_ID = 'criterion-multiget-selected'
const CRITERION_MULTIGET_ADD_AUTOTEST_ID = 'criterion-multiget-add'
const CRITERION_MULTIGET_REMOVE_AUTOTEST_ID = 'criterion-multiget-remove'

export const MultigetSelectTable = () => {

    const {t} = useTranslation()

    const filterType = useMultigetSelectStore()(s => s.filterType)
    const availableItems = useMultigetSelectStore()(s => s.availableItems)
    const selectedItems = useMultigetSelectStore()(s => s.selectedItems)
    const currentPage = useMultigetSelectStore()(s => s.currentPage)
    const hasNextPage = useMultigetSelectStore()(s => s.hasNextPage)
    const isLoading = useMultigetSelectStore()(s => s.isLoading)
    const setSelectedItems = useMultigetSelectStore()(s => s.setSelectedItems)
    const setCurrentPage = useMultigetSelectStore()(s => s.setCurrentPage)

    const onEntityClick = (entity: AbstractEntity) => {
        if (!selectedItems.some(e => +e.id === +entity.id)) {
            setSelectedItems([...selectedItems, entity])
        } else {
            setSelectedItems([...selectedItems.filter(e => +e.id !== +entity.id)])
        }
    }

    const onSelectedClick = (entity: AbstractEntity) => {
        setSelectedItems([...selectedItems.filter(e => +e.id !== +entity.id)])
    }

    const knownPagesCount = hasNextPage ? currentPage + 1 : currentPage
    const availableLabel = t('react.searchUI.available')
    const selectedLabel = filterType === 'ALL'
        ? t('react.searchUI.excluded')
        : t('react.searchUI.selected')
    const addEntityLabel = filterType === 'ALL'
        ? t('react.searchUI.multiget.excludeEntity', {defaultValue: 'Exclude entity'})
        : t('react.searchUI.multiget.selectEntity', {defaultValue: 'Select entity'})
    const removeEntityLabel = filterType === 'ALL'
        ? t('react.searchUI.multiget.includeEntity', {defaultValue: 'Include entity'})
        : t('react.searchUI.multiget.removeEntity', {defaultValue: 'Remove selected entity'})

    return <Box sx={tableSx}>
        <Box
            {...createAutoTestAttributes(CRITERION_MULTIGET_AVAILABLE_AUTOTEST_ID)}
            sx={columnSx}
            role='group'
            aria-label={availableLabel}
            aria-busy={isLoading}
        >
            <Box sx={headerSx}>
                <Box component={'span'} sx={headerTitleSx}>
                    {t('react.searchUI.available')}
                </Box>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '360px'}}>
                {availableItems.slice(0, MULTIGET_PAGE_SIZE).map(entity => {
                    const rowSelected = selectedItems.some(e => +e.id === +entity.id)
                    return <Box
                        {...createAutoTestAttributes(CRITERION_MULTIGET_ADD_AUTOTEST_ID, entity.id)}
                        component='button'
                        type='button'
                        sx={{
                            ...rowSx,
                            visibility: rowSelected ? 'hidden' : 'visible',
                        }}
                        key={entity.id}
                        onClick={() => onEntityClick(entity)}
                        title={entity.displayName}
                        aria-label={`${addEntityLabel}: ${entity.displayName}`}
                    >
                        {entity.displayName}
                    </Box>
                })}
            </Box>
            <Pagination
                count={knownPagesCount}
                page={currentPage}
                siblingCount={0}
                showFirstButton
                onChange={(event, value: number) => {
                    if (value === currentPage) {
                        return
                    }
                    setCurrentPage(value)
                }}
                disabled={isLoading}
                size="small"
                shape="rounded"
            />
        </Box>
        <Divider orientation={'vertical'} flexItem/>
        <Box
            {...createAutoTestAttributes(CRITERION_MULTIGET_SELECTED_AUTOTEST_ID)}
            sx={columnSx}
            role='group'
            aria-label={selectedLabel}
        >
            <Box sx={{...headerSx, justifyContent: 'space-between'}}>
                <Box component={'span'} sx={headerTitleSx}>
                    {filterType === 'ALL' ? t('react.searchUI.excluded') : t('react.searchUI.selected')}
                </Box>
                <PneButton
                    pneStyle={'text'}
                    size={'small'}
                    onClick={() => setSelectedItems([])}
                >{t('clear')}</PneButton>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: '1 1 0'}}>
                {selectedItems.map(entity =>
                    <Box
                        {...createAutoTestAttributes(CRITERION_MULTIGET_REMOVE_AUTOTEST_ID, entity.id)}
                        component='button'
                        type='button'
                        sx={rowSx}
                        key={entity.id}
                        onClick={() => onSelectedClick(entity)}
                        title={entity.displayName}
                        aria-label={`${removeEntityLabel}: ${entity.displayName}`}
                    >
                        {entity.displayName}
                    </Box>,
                )}
            </Box>
        </Box>
    </Box>
}

const tableSx = {display: 'flex', flexDirection: 'row', columnGap: '16px', width: '100%'}
const columnSx = {display: 'flex', flexDirection: 'column', rowGap: '5px', flex: '1 1 0', minWidth: 0}
const headerSx = {display: 'flex', flexDirection: 'row', alignItems: 'center'}
const headerTitleSx = {fontSize: '14px', fontWeight: '700', lineHeight: '30px'}
const rowSx: SxProps = {
    appearance: 'none',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    flexShrink: 0,
    font: 'inherit',
    lineHeight: '35px',
    padding: 0,
    textAlign: 'left',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:hover': {
        background: '#f5f5f5',
    },
    '&:not(:last-child)': {
        borderBottom: '1px solid #ebebeb',
    },
}
