import React, {useCallback, useEffect, useState} from 'react';
import SearchUIExactSearchLabelSelect from '../select/SearchUIExactSearchLabelSelect';
import {useTranslation} from 'react-i18next';
import {useSearchUIStore} from '../../state/store';
import {Box, SxProps} from '@mui/material';
import {PneTextField} from '../../../../..';
import debounce from 'lodash/debounce';

export const ExactSearchCriterion = () => {

    const {t} = useTranslation()
    const {
        exactSearchLabel,
        exactSearchValue,
        exactSearchLabels,
        setExactCriterionSearchLabel,
        setExactCriterionSearchValue,
    } = useSearchUIStore((store) => ({
        exactSearchLabel: store.exactSearchLabel,
        exactSearchValue: store.exactSearchValue,
        exactSearchLabels: store.exactSearchLabels,
        setExactCriterionSearchLabel: store.setExactCriterionSearchLabel,
        setExactCriterionSearchValue: store.setExactCriterionSearchValue,
    }))
    const [searchValue, setSearchValue] = useState(exactSearchValue)

    useEffect(() => {
        setSearchValue(exactSearchValue)
    }, [exactSearchValue])

    const debouncedSetSearchValueShort = useCallback(
        debounce(setExactCriterionSearchValue, 200),
        []
    )

    const debouncedSetSearchValueLong = useCallback(
        debounce(setExactCriterionSearchValue, 500),
        []
    )

    useEffect(() => {
        return () => {
            debouncedSetSearchValueShort.cancel()
            debouncedSetSearchValueLong.cancel()
        }
    }, [])

    useEffect(() => {
        if (searchValue.length < 4) {
            debouncedSetSearchValueShort.cancel()
            debouncedSetSearchValueLong(searchValue);
        } else {
            debouncedSetSearchValueLong.cancel()
            debouncedSetSearchValueShort(searchValue);
        }
    }, [searchValue])

    return <Box sx={centerSx}>
        <PneTextField
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('search')}
            sx={valueInputSx}
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

const valueInputSx: SxProps = {
    '& .MuiInputBase-root.MuiFilledInput-root': {
        height: '24px',
        borderRadius: '16px',
    },
    '& .MuiInputBase-input.MuiFilledInput-input': {
        py: '3px',
        fontSize: '13px',
        lineHeight: '18px',
    },
}
