import React, {useContext, useEffect, useState} from 'react';
import {Box, Chip} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../../state/store";
import {selectUnderChipSx} from '../../select/style';
import PneSelect from '../../../../../dropdown/PneSelect';
import {SearchUIDefaultsContext} from "../../../../SearchUIProvider";
import {Country} from '../../../../../../common';
import {useTranslation} from "react-i18next";
import {createAutoTestAttributes} from '../../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../../AutoTestScope';

const CRITERION_INPUT_AUTOTEST_ID = 'criterion-input'
const CRITERION_INPUT_OPTIONS_AUTOTEST_ID = 'criterion-input-options'
const CRITERION_INPUT_OPTION_AUTOTEST_ID = 'criterion-input-option'

export const OrdersSearchCountrySelect = () => {
    const {t} = useTranslation()

    const setOrderSearchCriterionValue = useSearchUIFiltersStore(s => s.setOrderSearchCriterionValue)
    const ordersSearchValue = useSearchUIFiltersStore(s => s.ordersSearchValue)

    const [availableCountries, setAvailableCountries] = useState<Country[]>([])
    const [loading, setLoading] = useState(true)

    const {getCountries} = useContext(SearchUIDefaultsContext)
    const autoTestOwner = useSearchUIAutoTestScope()

    useEffect(() => {
        let active = true

        setLoading(true)
        getCountries()
            .then(response => {
                if (active) {
                    setAvailableCountries(response)
                    setLoading(false)
                }
            })
            .catch(error => {
                if (active) {
                    setAvailableCountries([])
                    setLoading(false)
                    console.error(error)
                }
            })

        return () => {
            active = false
        }
    }, [getCountries])

    const [open, setOpen] = useState(false)
    const selectedCountry = availableCountries.find(country => (
        String(country.id) === ordersSearchValue
    ))
    const disabled = loading || availableCountries.length === 0
    const inputAriaLabel = t('react.searchUI.ordersSearch.value', {defaultValue: 'Order search value'})

    useEffect(() => {
        if (disabled) setOpen(false)
    }, [disabled])

    const openSelect = () => {
        if (!disabled) setOpen(true)
    }

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={openSelect}
            deleteIcon={<ExpandMoreIcon/>}
            label={selectedCountry?.displayName ?? t('react.searchUI.countrySelectPlaceholder')}
            size={'small'}
            aria-hidden={true}
            tabIndex={-1}
            sx={{pointerEvents: 'none'}}
        />
        <PneSelect
            disabled={disabled}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={openSelect}
            sx={selectUnderChipSx}
            value={(selectedCountry?.id ?? '') as unknown as Country}
            onChange={(value) => {
                setOrderSearchCriterionValue(String((value as Country).id))
            }}
            options={availableCountries}
            getOptionProps={option => createAutoTestAttributes(
                CRITERION_INPUT_OPTION_AUTOTEST_ID,
                option.value,
            )}
            MenuProps={{
                slotProps: {
                    list: createSearchUIOwnedAutoTestAttributes(
                        CRITERION_INPUT_OPTIONS_AUTOTEST_ID,
                        autoTestOwner,
                    ),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(CRITERION_INPUT_AUTOTEST_ID, selectedCountry?.id),
                'aria-label': inputAriaLabel,
                'aria-busy': loading,
            }}
        />
    </Box>
}
