import React, {useState} from 'react';
import {ExactCriterionSearchLabelEnum} from '../../types';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_LABEL_AUTOTEST_ID = 'criterion-label';
const CRITERION_LABEL_OPTIONS_AUTOTEST_ID = 'criterion-label-options';
const CRITERION_LABEL_OPTION_AUTOTEST_ID = 'criterion-label-option';

interface IProps {
    value: ExactCriterionSearchLabelEnum,
    onChange: (value: ExactCriterionSearchLabelEnum) => void,
    options: ExactCriterionSearchLabelEnum[],
}

const SearchUIExactSearchLabelSelect = (props: IProps) => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.ExactCriterionSearchLabelEnum'})
    const autoTestOwner = useSearchUIAutoTestScope()
    const {
        value,
        onChange,
        options,
    } = props
    const [open, setOpen] = useState(false)
    const exactSearchLabel = t('react.searchUI.exactSearch.label', {defaultValue: 'Exact search field'})

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={optionRenderer(value)}
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
            value={value}
            onChange={onChange}
            options={options}
            getOptionProps={option => createAutoTestAttributes(
                CRITERION_LABEL_OPTION_AUTOTEST_ID,
                option,
            )}
            MenuProps={{
                slotProps: {
                    list: createSearchUIOwnedAutoTestAttributes(
                        CRITERION_LABEL_OPTIONS_AUTOTEST_ID,
                        autoTestOwner,
                    ),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(CRITERION_LABEL_AUTOTEST_ID, value),
                'aria-label': exactSearchLabel,
            }}
        />
    </Box>
}

export default SearchUIExactSearchLabelSelect
