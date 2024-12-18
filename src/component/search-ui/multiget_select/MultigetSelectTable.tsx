import React from 'react';
import {Box, Divider, Pagination} from "@mui/material";
import {AbstractEntity, PneButton} from "../../../index";
import {MULTIGET_PAGE_SIZE} from "./MultigetSelect";
import {useTranslation} from "react-i18next";
import {SxProps} from "@mui/material/styles";
import {useMultigetSelectStore} from "./state/store";

export const MultigetSelectTable = () => {

    const {t} = useTranslation()

    const {
        filterType,
        availableItems,
        selectedItems,
        setSelectedItems,
        currentPage,
        setCurrentPage,
        hasNextPage,
        isLoading,
    } = useMultigetSelectStore()((store) => ({
        filterType: store.filterType,
        availableItems: store.availableItems,
        selectedItems: store.selectedItems,
        setSelectedItems: store.setSelectedItems,
        currentPage: store.currentPage,
        setCurrentPage: store.setCurrentPage,
        hasNextPage: store.hasNextPage,
        isLoading: store.isLoading,
    }))

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

    return <Box sx={tableSx}>
        <Box sx={columnSx}>
            <Box sx={headerSx}>
                <Box component={'span'} sx={headerTitleSx}>
                    {t('react.searchUI.available')}
                </Box>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '360px'}}>
                {availableItems.slice(0, MULTIGET_PAGE_SIZE).map((entity, index) => {
                    const rowSelected = selectedItems.some(e => +e.id === +entity.id);
                    return <Box
                        sx={{
                            ...rowSx,
                            visibility: rowSelected ? 'hidden' : 'visible',
                        }}
                        key={index}
                        onClick={() => onEntityClick(entity)}
                        title={entity.displayName}
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
                size='small'
                shape='rounded'
            />
        </Box>
        <Divider orientation={'vertical'} flexItem/>
        <Box sx={columnSx}>
            <Box sx={{...headerSx, justifyContent: 'space-between',}}>
                <Box component={'span'} sx={headerTitleSx}>
                    {filterType === 'ALL' ? t('react.searchUI.excluded') : t('react.searchUI.selected')}
                </Box>
                <PneButton
                    color={'pneText'}
                    variant={'text'}
                    size={'small'}
                    onClick={() => setSelectedItems([])}
                >{t('clear')}</PneButton>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: '1 1 0'}}>
                {selectedItems.map((entity, index) =>
                    <Box
                        sx={rowSx}
                        key={index}
                        onClick={() => onSelectedClick(entity)}
                        title={entity.displayName}
                    >
                        {entity.displayName}
                    </Box>
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
    flexShrink: 0,
    lineHeight: '35px',
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