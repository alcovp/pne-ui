import React, {useEffect, useMemo, useState} from 'react'
import {DATE_RANGE_SPEC_TYPES, DateRangeSpecType} from '../../types'
import {Box, Chip, SxProps} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {useSearchUIFiltersStore} from '../../state/store'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {selectUnderChipSx} from './style'
import {PneSelect} from '../../../../..'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'

const CRITERION_RANGE_SPEC_AUTOTEST_ID = 'criterion-range-spec'
const CRITERION_RANGE_SPEC_OPTIONS_AUTOTEST_ID = 'criterion-range-spec-options'
const CRITERION_RANGE_SPEC_OPTION_AUTOTEST_ID = 'criterion-range-spec-option'

const SearchUIDateRangeSpecTypeSelect = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.DateRangeSpecType'})
    const autoTestOwner = useSearchUIAutoTestScope()

    const dateRangeSpec = useSearchUIFiltersStore(s => s.dateRangeSpec)
    const setDateRangeCriterion = useSearchUIFiltersStore(s => s.setDateRangeCriterion)
    const dateRangeSpecTypes = useSearchUIFiltersStore(s => s.config?.dateRange?.dateRangeSpecTypes)

    const [open, setOpen] = useState(false)
    const rangeSpecAriaLabel = t('react.searchUI.dateRange.specType', {
        defaultValue: 'Date range type',
    })

    const availableSpecTypes = useMemo(() => {
        return dateRangeSpecTypes?.length ? dateRangeSpecTypes : DATE_RANGE_SPEC_TYPES
    }, [dateRangeSpecTypes])

    useEffect(() => {
        if (!availableSpecTypes.length) {
            return
        }

        if (!availableSpecTypes.includes(dateRangeSpec.dateRangeSpecType)) {
            setDateRangeCriterion({
                ...dateRangeSpec,
                dateRangeSpecType: availableSpecTypes[0],
            })
        }
    }, [availableSpecTypes, dateRangeSpec, setDateRangeCriterion])

    const withInputNear = dateRangeSpec.dateRangeSpecType === 'EXACTLY'
        || dateRangeSpec.dateRangeSpecType === 'DAYS_BEFORE'
        || dateRangeSpec.dateRangeSpecType === 'HOURS_BEFORE'

    const selectSx: SxProps = {
        flexShrink: 0,
        width: withInputNear ? '50%' : '100%',
        [`& fieldset`]: {
            borderRadius: '0',
            borderColor: 'transparent !important',
            borderRightColor: withInputNear ? '#F1F5FA !important' : 'transparent !important',
        },
        ...selectUnderChipSx,
    }

    const handleSetDateRangeSpecType = (dateRangeSpecType: DateRangeSpecType) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateRangeSpecType: dateRangeSpecType,
        })
    }

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={optionRenderer(dateRangeSpec.dateRangeSpecType)}
            size={'small'}
            aria-hidden={true}
            tabIndex={-1}
            sx={{pointerEvents: 'none'}}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectSx}
            getOptionLabel={optionRenderer}
            value={dateRangeSpec.dateRangeSpecType}
            onChange={handleSetDateRangeSpecType}
            options={availableSpecTypes}
            getOptionProps={option => createAutoTestAttributes(
                CRITERION_RANGE_SPEC_OPTION_AUTOTEST_ID,
                option,
            )}
            MenuProps={{
                slotProps: {
                    list: createSearchUIOwnedAutoTestAttributes(
                        CRITERION_RANGE_SPEC_OPTIONS_AUTOTEST_ID,
                        autoTestOwner,
                    ),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(
                    CRITERION_RANGE_SPEC_AUTOTEST_ID,
                    dateRangeSpec.dateRangeSpecType,
                ),
                'aria-label': rangeSpecAriaLabel,
            }}
        />
    </Box>
}

export default SearchUIDateRangeSpecTypeSelect
