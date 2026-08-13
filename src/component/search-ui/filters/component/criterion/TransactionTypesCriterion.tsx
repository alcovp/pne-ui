import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../..';

export const TransactionTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const options = useSearchUIFiltersStore(s => s.transactionTypes)
    const setCriterion = useSearchUIFiltersStore(s => s.setTransactionTypesCriterion)
    const allowedTransactionTypes = useSearchUIFiltersStore(
        s => s.prefetchedData.allowedTransactionTypes,
    )

    const {getTransactionTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        if (allowedTransactionTypes !== undefined) {
            setAvailableOptions(allowedTransactionTypes)
            return
        }

        getTransactionTypes()
            .then(response => {
                setAvailableOptions(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [allowedTransactionTypes, getTransactionTypes])

    return <SearchUIAbstractEntitySelect
        value={options}
        options={availableOptions}
        onChange={setCriterion}
    />
}
