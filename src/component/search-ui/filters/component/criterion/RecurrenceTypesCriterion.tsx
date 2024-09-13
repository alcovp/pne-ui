import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../..';

export const RecurrenceTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])
    const {
        options,
        setCriterion,
    } = useSearchUIStore((store) => ({
        options: store.recurrenceTypes,
        setCriterion: store.setRecurrenceTypesCriterion,
    }))
    const {getRecurringPaymentTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getRecurringPaymentTypes()
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
