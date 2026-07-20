import React, {useState} from 'react';
import {GROUPING_DATE_TYPES} from '../../types';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {selectUnderChipSx} from './style';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {PneSelect} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_GROUPING_DATE_TYPE_AUTOTEST_ID = 'criterion-grouping-date-type'
const CRITERION_GROUPING_DATE_TYPE_OPTIONS_AUTOTEST_ID = 'criterion-grouping-date-type-options'
const CRITERION_GROUPING_DATE_TYPE_OPTION_AUTOTEST_ID = 'criterion-grouping-date-type-option'

const SearchUIGroupingDateTypeSelect = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'performanceReport.groupType'})
    const autoTestOwner = useSearchUIAutoTestScope()

    const dateType = useSearchUIFiltersStore(s => s.grouping.dateType)
    const setGroupingCriterionDateType = useSearchUIFiltersStore(s => s.setGroupingCriterionDateType)

    const [open, setOpen] = useState(false)
    const ariaLabel = t('react.searchUI.grouping.dateType', {
        defaultValue: 'Grouping date type',
    })

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={optionRenderer(dateType)}
            size={'small'}
            aria-hidden={true}
            tabIndex={-1}
            sx={{pointerEvents: 'none'}}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            getOptionLabel={optionRenderer}
            value={dateType}
            onChange={setGroupingCriterionDateType}
            options={GROUPING_DATE_TYPES}
            getOptionProps={option => createAutoTestAttributes(
                CRITERION_GROUPING_DATE_TYPE_OPTION_AUTOTEST_ID,
                option,
            )}
            MenuProps={{
                slotProps: {
                    list: createSearchUIOwnedAutoTestAttributes(
                        CRITERION_GROUPING_DATE_TYPE_OPTIONS_AUTOTEST_ID,
                        autoTestOwner,
                    ),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(
                    CRITERION_GROUPING_DATE_TYPE_AUTOTEST_ID,
                    dateType,
                ),
                'aria-label': ariaLabel,
            }}
        />
    </Box>
}

export default SearchUIGroupingDateTypeSelect
