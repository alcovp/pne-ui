import React, {useContext, useEffect, useState} from 'react';
import {Box, Chip} from '@mui/material';
import {ExpandMore} from '@mui/icons-material';
import {useSearchUIFiltersStore} from "../../../state/store";
import {selectUnderChipSx} from '../../select/style';
import PneSelect from '../../../../../dropdown/PneSelect';
import {SearchUIDefaultsContext} from "../../../../SearchUIProvider";
import {Country} from '../../../../../../common';

export const OrdersSearchCountrySelect = () => {

    const {
        ordersSearchValue,
        setOrderSearchCriterionValue,
    } = useSearchUIFiltersStore((store) => ({
        ordersSearchValue: store.ordersSearchValue,
        setOrderSearchCriterionValue: store.setOrderSearchCriterionValue,
    }))

    const [availableCountries, setAvailableCountries] = useState<Country[]>([])
    const [country, setCountry] = useState<Country>()

    const {getCountries} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getCountries()
            .then(response => {
                setAvailableCountries(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    const [open, setOpen] = useState(false)

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMore/>}
            label={country ? country.displayName : ''}
            size={'small'}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectUnderChipSx}
            value={country}
            onChange={(value) => {
                setCountry(value as Country)
                if (value) {
                    setOrderSearchCriterionValue((value as Country).id + '')
                }
            }}
            options={availableCountries}
        />
    </Box>
}