import React from 'react';
import {useSearchUIFiltersStore} from '../../state/store';
import SearchUIGroupingDateTypeSelect from '../select/SearchUIGroupingDateTypeSelect';
import {useTranslation} from 'react-i18next';
import {Box, Chip, Link, SxProps} from '@mui/material';
import {AbstractEntitySelectModal, useModal} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_GROUPING_GROUPS_AUTOTEST_ID = 'criterion-grouping-groups'
const CRITERION_GROUPING_AVAILABLE_AUTOTEST_ID = 'criterion-grouping-available'
const CRITERION_GROUPING_SELECTED_AUTOTEST_ID = 'criterion-grouping-selected'
const CRITERION_GROUPING_OPTION_AUTOTEST_ID = 'criterion-grouping-option'
const CRITERION_GROUPING_PANEL_AUTOTEST_ID = 'criterion-grouping-panel'
const CRITERION_GROUPING_SEARCH_AUTOTEST_ID = 'criterion-grouping-search'
const CRITERION_GROUPING_SEARCH_CLEAR_AUTOTEST_ID = 'criterion-grouping-search-clear'
const CRITERION_GROUPING_ADD_ALL_AUTOTEST_ID = 'criterion-grouping-add-all'
const CRITERION_GROUPING_REMOVE_ALL_AUTOTEST_ID = 'criterion-grouping-remove-all'
const CRITERION_GROUPING_VALUE_AUTOTEST_ID = 'criterion-grouping-value'

export const GroupingCriterion = () => {
    const {t} = useTranslation()
    const {t: groupTypeRenderer} = useTranslation('', {keyPrefix: 'performanceReport.groupType'})
    const {open, handleOpen, handleClose} = useModal()
    const autoTestOwner = useSearchUIAutoTestScope()
    const groupsDialogId = React.useId()

    const available = useSearchUIFiltersStore(s => s.grouping.availableGroupingTypes)
    const selected = useSearchUIFiltersStore(s => s.grouping.selectedGroupingTypes)
    const setGroupingCriterionGroups = useSearchUIFiltersStore(s => s.setGroupingCriterionGroups)
    const groupsLabel = t('react.searchUI.grouping.groups', {
        defaultValue: 'Grouping groups',
    })
    const modalTitle = t('performanceReport.grouping')
    const addGroupLabel = t('react.searchUI.grouping.add', {defaultValue: 'Add group'})
    const removeGroupLabel = t('react.searchUI.grouping.remove', {defaultValue: 'Remove group'})
    const availableGroupsLabel = t('react.searchUI.grouping.available', {
        defaultValue: 'Available grouping groups',
    })
    const selectedGroupsLabel = t('react.searchUI.grouping.selected', {
        defaultValue: 'Selected grouping groups',
    })
    const searchGroupsLabel = t('react.searchUI.grouping.search', {
        defaultValue: 'Search grouping groups',
    })

    const getLinkChildren = () => {
        return <Box sx={chipsSx}>
            {selected.map(group =>
                <Chip
                    {...createAutoTestAttributes(CRITERION_GROUPING_VALUE_AUTOTEST_ID, group)}
                    label={groupTypeRenderer(group)}
                    key={group}
                    size={'small'}
                />
            )}
        </Box>
    }

    return <Box sx={centerSx}>
        <SearchUIGroupingDateTypeSelect/>
        <Link
            {...createAutoTestAttributes(CRITERION_GROUPING_GROUPS_AUTOTEST_ID)}
            onClick={handleOpen}
            component="button"
            type="button"
            underline="hover"
            aria-label={groupsLabel}
            aria-controls={open ? groupsDialogId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            sx={linkSx}
        >
            {selected != null ? getLinkChildren() : 'Select groups'}
        </Link>
        <AbstractEntitySelectModal
            open={open}
            title={modalTitle}
            handleSave={list => {
                setGroupingCriterionGroups(list.unmapped, list.mapped)
                handleClose()
            }}
            unMappedList={available}
            mappedList={selected}
            onClose={handleClose}
            loading={false}
            optionRenderer={groupTypeRenderer}
            containerProps={{
                ...createSearchUIOwnedAutoTestAttributes(
                    CRITERION_GROUPING_PANEL_AUTOTEST_ID,
                    autoTestOwner,
                ),
                id: groupsDialogId,
            }}
            closeLabel={t('close', {defaultValue: 'Close'})}
            getItemAttributes={(item, list) => ({
                ...createAutoTestAttributes(
                    CRITERION_GROUPING_OPTION_AUTOTEST_ID,
                    item.displayName,
                ),
                'aria-label': `${list === 'AVAILABLE' ? addGroupLabel : removeGroupLabel}: ${
                    groupTypeRenderer(item.displayName)
                }`,
            })}
            elementAttributes={{
                searchInput: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_SEARCH_AUTOTEST_ID),
                    'aria-label': searchGroupsLabel,
                },
                searchClearButton: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_SEARCH_CLEAR_AUTOTEST_ID),
                    'aria-label': t('react.searchUI.grouping.search.clear', {
                        defaultValue: 'Clear grouping search',
                    }),
                },
                availableColumn: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_AVAILABLE_AUTOTEST_ID),
                    role: 'group',
                    'aria-label': availableGroupsLabel,
                },
                addAllButton: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_ADD_ALL_AUTOTEST_ID),
                    'aria-label': t('react.searchUI.grouping.addAll', {
                        defaultValue: 'Add all groups',
                    }),
                },
                addedColumn: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_SELECTED_AUTOTEST_ID),
                    role: 'group',
                    'aria-label': selectedGroupsLabel,
                },
                removeAllButton: {
                    ...createAutoTestAttributes(CRITERION_GROUPING_REMOVE_ALL_AUTOTEST_ID),
                    'aria-label': t('react.searchUI.grouping.removeAll', {
                        defaultValue: 'Remove all groups',
                    }),
                },
            }}
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
