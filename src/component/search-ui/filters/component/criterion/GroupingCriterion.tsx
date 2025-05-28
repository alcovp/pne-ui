import React from 'react';
import {useSearchUIFiltersStore} from '../../state/store';
import SearchUIGroupingDateTypeSelect from '../select/SearchUIGroupingDateTypeSelect';
import {useTranslation} from 'react-i18next';
import {Box, Chip, Link, SxProps} from '@mui/material';
import {AbstractEntitySelectModal, useModal} from '../../../../..';

export const GroupingCriterion = () => {
    const {t} = useTranslation()
    const {t: groupTypeRenderer} = useTranslation('', {keyPrefix: 'performanceReport.groupType'})
    const {open, handleOpen, handleClose} = useModal()

    const available = useSearchUIFiltersStore(s => s.grouping.availableGroupingTypes)
    const selected = useSearchUIFiltersStore(s => s.grouping.selectedGroupingTypes)
    const setGroupingCriterionGroups = useSearchUIFiltersStore(s => s.setGroupingCriterionGroups)

    const getLinkChildren = () => {
        return <Box sx={chipsSx}>
            {selected.map(group =>
                <Chip label={groupTypeRenderer(group)} key={group} size={'small'}/>
            )}
        </Box>
    }

    return <Box sx={centerSx}>
        <SearchUIGroupingDateTypeSelect/>
        <Link
            onClick={handleOpen}
            component="button"
            underline="hover"
            sx={linkSx}
        >
            {selected != null ? getLinkChildren() : 'Select groups'}
        </Link>
        <AbstractEntitySelectModal
            open={open}
            title={t('performanceReport.grouping')}
            handleSave={list => {
                setGroupingCriterionGroups(list.unmapped, list.mapped)
                handleClose()
            }}
            unMappedList={available}
            mappedList={selected}
            onClose={handleClose}
            loading={false}
            optionRenderer={groupTypeRenderer}
        />
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: '8px',
    width: '100%',
}

const linkSx: SxProps = {
    display: 'flex',
    width: '100%',
    fontSize: '13px',
}

const chipsSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '5px',
    rowGap: '5px',
    flexWrap: 'wrap',
    m: '8px 0',
}
