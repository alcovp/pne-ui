import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../..';

export const RecurrenceStatusesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])
    const {
        options,
        setCriterion,
    } = useSearchUIFiltersStore((store) => ({
        options: store.recurrenceStatuses,
        setCriterion: store.setRecurrenceStatusesCriterion,
    }))
    const {getRecurringPaymentStatuses} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getRecurringPaymentStatuses()
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
