import React, {use, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../../common/paynet/type';

export const CurrenciesCriterion = () => {
    const [availableCurrencies, setAvailableCurrencies] = useState<AbstractEntity[]>([])

    const currencies = useSearchUIFiltersStore(s => s.currencies)
    const setCurrenciesCriterion = useSearchUIFiltersStore(s => s.setCurrenciesCriterion)

    const {getCurrencies} = use(SearchUIDefaultsContext)

    useEffect(() => {
        getCurrencies()
            .then(response => {
                setAvailableCurrencies(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    return <SearchUIAbstractEntitySelect
        value={currencies}
        options={availableCurrencies}
        onChange={setCurrenciesCriterion}
    />
}
