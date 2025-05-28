import React, {useEffect, useState} from 'react';
import SearchUIExactSearchLabelSelect from '../select/SearchUIExactSearchLabelSelect';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';
import {PneTextField} from '../../../../..';
import { filtersInputSx } from './style';

export const ExactSearchCriterion = () => {

    const {t} = useTranslation()

    const exactSearchLabel = useSearchUIFiltersStore(s => s.exactSearchLabel || s.exactSearchLabels[0])
    const exactSearchValue = useSearchUIFiltersStore(s => s.exactSearchValue)
    const exactSearchLabels = useSearchUIFiltersStore(s => s.exactSearchLabels)
    const setExactCriterionSearchLabel = useSearchUIFiltersStore(s => s.setExactCriterionSearchLabel)
    const setExactCriterionSearchValue = useSearchUIFiltersStore(s => s.setExactCriterionSearchValue)

    const [searchValue, setSearchValue] = useState(exactSearchValue)

    useEffect(() => {
        setSearchValue(exactSearchValue)
    }, [exactSearchValue])

    useEffect(() => {
        setExactCriterionSearchValue(searchValue)
    }, [searchValue])

    return <Box sx={centerSx}>
        <PneTextField
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('search')}
            sx={filtersInputSx}
            size={'small'}
            variant={'filled'}
            InputProps={{
                disableUnderline: true,
            }}
        />
        <Box component={'span'} sx={{display: 'inline-block', color: '#8A94A6'}}>{t('in')}</Box>
        <SearchUIExactSearchLabelSelect
            value={exactSearchLabel}
            options={exactSearchLabels}
            onChange={setExactCriterionSearchLabel}
        />
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: '8px',
}
