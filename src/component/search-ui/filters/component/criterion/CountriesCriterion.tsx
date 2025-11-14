import React, {useContext, useEffect, useState} from 'react'
import {Country} from '../../../../..'
import {SearchUIDefaultsContext} from '../../../SearchUIProvider'
import {useSearchUIFiltersStore} from '../../state/store'
import SearchUICountriesSelect from '../select/SearchUICountriesSelect'

export const CountriesCriterion = () => {
    const [availableCountries, setAvailableCountries] = useState<Country[]>([])

    const countries = useSearchUIFiltersStore(s => s.countries)
    const setCountriesCriterion = useSearchUIFiltersStore(s => s.setCountriesCriterion)

    const {getCountries} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getCountries()
            .then(response => {
                setAvailableCountries(response)
            })
            .catch(console.error)
    }, [getCountries])

    return <SearchUICountriesSelect
        value={countries}
        options={availableCountries}
        onChange={setCountriesCriterion}
    />
}
