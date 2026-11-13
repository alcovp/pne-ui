import React from 'react'
import {Box, Pagination} from '@mui/material'
import {AbstractEntity} from '../../../common/paynet/type'
import PneButton from '../../PneButton'
import {MULTIGET_PAGE_SIZE} from './constants'
import {useTranslation} from 'react-i18next'
import type {SxProps, Theme} from '@mui/material/styles'
import {useMultigetSelectStore} from './state/store'
import {createAutoTestAttributes} from '../../AutoTestAttribute'
import {resolvePneSemanticPalette} from '../../../createTheme'
import {PneCloseIcon} from '../../dropdown/dropdownLook'
import PneNextPageIcon from '../../table/PneNextPageIcon'
import {
    createTableControlCurrentStyle,
    createTableControlShellStyle,
    createTableControlTextButtonStyle,
} from '../../table/tableControlButtonStyle'

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
            <Box sx={availableListSx}>
                {availableItems.slice(0, MULTIGET_PAGE_SIZE).map(entity => {
                    const rowSelected = selectedItems.some(e => +e.id === +entity.id)
                    return <Box
                        {...createAutoTestAttributes(CRITERION_MULTIGET_ADD_AUTOTEST_ID, entity.id)}
                        component='button'
                        type='button'
                        sx={rowSelected ? hiddenAddRowSx : addRowSx}
                        key={entity.id}
                        onClick={() => onEntityClick(entity)}
                        title={entity.displayName}
                        aria-label={`${addEntityLabel}: ${entity.displayName}`}
                    >
                        <Box component='span' sx={rowLabelSx}>{entity.displayName}</Box>
                        <PneNextPageIcon/>
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
                sx={paginationSx}
            />
        </Box>
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
            <Box sx={selectedListSx}>
                {selectedItems.map(entity =>
                    <Box
                        {...createAutoTestAttributes(CRITERION_MULTIGET_REMOVE_AUTOTEST_ID, entity.id)}
                        component='button'
                        type='button'
                        sx={removeRowSx}
                        key={entity.id}
                        onClick={() => onSelectedClick(entity)}
                        title={entity.displayName}
                        aria-label={`${removeEntityLabel}: ${entity.displayName}`}
                    >
                        <Box component='span' sx={rowLabelSx}>{entity.displayName}</Box>
                        <PneCloseIcon sx={{fontSize: 16}}/>
                    </Box>,
                )}
            </Box>
        </Box>
    </Box>
}

// UI Kit Transfer list: two lists side by side, each in a box with a hairline, a caption over it.
const tableSx = {display: 'flex', flexDirection: 'row', columnGap: '16px', width: '100%'}
const columnSx = {display: 'flex', flexDirection: 'column', rowGap: '8px', flex: '1 1 0', minWidth: 0}
const headerSx = {display: 'flex', flexDirection: 'row', alignItems: 'center', minHeight: '24px'}
const headerTitleSx: SxProps<Theme> = {
    color: 'text.secondary',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
}

const listBoxSx = (theme: Theme) => ({
    borderRadius: '8px',
    boxShadow: `inset 0 0 0 1px ${resolvePneSemanticPalette(theme).dropdown.panel.ring}`,
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '4px',
})

// A page of rows and the 4px inset of the box: the list keeps its height on a short page.
const availableListSx: SxProps<Theme> = theme => ({
    ...listBoxSx(theme),
    minHeight: `${MULTIGET_PAGE_SIZE * 32 + 8}px`,
})

const selectedListSx: SxProps<Theme> = theme => ({
    ...listBoxSx(theme),
    flex: '1 1 0',
    overflowY: 'auto',
})

/**
 * A row of a list: 32px, 14/20, the name and the sign of what a click does at the end - an arrow moves
 * the entity to the other list, a cross takes it back. The sign takes its colour under the pointer.
 */
const createRowSx = (signHover: (theme: Theme) => string): SxProps<Theme> => theme => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    return {
        alignItems: 'center',
        appearance: 'none',
        background: 'transparent',
        border: 0,
        borderRadius: '4px',
        boxSizing: 'border-box',
        color: dropdown.option.text,
        columnGap: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexShrink: 0,
        font: 'inherit',
        fontSize: '14px',
        lineHeight: '20px',
        minHeight: '32px',
        padding: '6px 8px 6px 12px',
        textAlign: 'left',
        width: '100%',
        '& svg': {
            color: dropdown.chip.remove,
            flexShrink: 0,
        },
        '&:hover, &:focus-visible': {
            background: dropdown.option.hover,
        },
        '&:hover svg, &:focus-visible svg': {
            color: signHover(theme),
        },
        '&:focus-visible': {
            outline: `2px solid ${resolvePneSemanticPalette(theme).focusRing}`,
            outlineOffset: '-2px',
        },
    }
}

const addRowSx = createRowSx(theme => resolvePneSemanticPalette(theme).link)
const removeRowSx = createRowSx(theme => theme.palette.error.main)

// An entity that is already picked keeps its place on the page, unseen.
const hiddenAddRowSx: SxProps<Theme> = theme => ({
    ...(addRowSx as (theme: Theme) => object)(theme),
    visibility: 'hidden',
})

const rowLabelSx: SxProps = {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}

// The pages are the buttons of the table's pagination: 24px in a white shell, the page in force filled.
const paginationSx: SxProps<Theme> = theme => ({
    '& .MuiPagination-ul': {
        ...createTableControlShellStyle(theme, 'actions'),
        display: 'inline-flex',
        flexWrap: 'nowrap',
    },
    '& .MuiPaginationItem-root': {
        ...createTableControlTextButtonStyle(theme),
        margin: 0,
        minWidth: '24px',
    },
    '& .MuiPaginationItem-root.Mui-selected': createTableControlCurrentStyle(theme),
    '& .MuiPaginationItem-root.Mui-disabled': {
        opacity: 1,
    },
    '& .MuiPaginationItem-icon': {
        fontSize: '16px',
    },
})
