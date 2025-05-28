import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from "../../../../../common";

export const MarkerTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const options = useSearchUIFiltersStore(s => s.markerTypes)
    const setCriterion = useSearchUIFiltersStore(s => s.setMarkerTypesCriterion)

    const {getTransactionMarkerTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getTransactionMarkerTypes()
            .then(response => {
                setAvailableOptions(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    return <SearchUIAbstractEntitySelect
        value={options}
        options={availableOptions}
        onChange={setCriterion}
    />
}
