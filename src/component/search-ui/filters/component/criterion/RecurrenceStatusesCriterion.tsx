import React, {use, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../../common/paynet/type';

export const RecurrenceStatusesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const options = useSearchUIFiltersStore(s => s.recurrenceStatuses)
    const setCriterion = useSearchUIFiltersStore(s => s.setRecurrenceStatusesCriterion)

    const {getRecurringPaymentStatuses} = use(SearchUIDefaultsContext)

    useEffect(() => {
        getRecurringPaymentStatuses()
            .then(response => {
                setAvailableOptions(response)
            })
            .catch(console.error)
    }, [])

    return <SearchUIAbstractEntitySelect
        value={options}
        options={availableOptions}
        onChange={setCriterion}
    />
}
