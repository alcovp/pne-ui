import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {AbstractEntity} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

export const MfoConfigurationTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])
    const {
        options,
        setCriterion,
    } = useSearchUIFiltersStore((store) => ({
        options: store.mfoConfigurationTypes,
        setCriterion: store.setMfoConfigurationTypesCriterion,
    }))
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
