import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {AbstractEntity} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

export const MfoConfigurationTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const options = useSearchUIFiltersStore(s => s.mfoConfigurationTypes)
    const setCriterion = useSearchUIFiltersStore(s => s.setMfoConfigurationTypesCriterion)

    const {getMFOTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getMFOTypes()
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
