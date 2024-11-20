import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../..';

export const TransactionTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])
    const {
        options,
        setCriterion,
    } = useSearchUIFiltersStore((store) => ({
        options: store.transactionTypes,
        setCriterion: store.setTransactionTypesCriterion,
    }))
    const {getTransactionTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getTransactionTypes()
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
