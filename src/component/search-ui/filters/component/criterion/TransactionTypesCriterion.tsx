import React, {use, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../../common/paynet/type';

export const TransactionTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const options = useSearchUIFiltersStore(s => s.transactionTypes)
    const setCriterion = useSearchUIFiltersStore(s => s.setTransactionTypesCriterion)
    const allowedTransactionTypes = useSearchUIFiltersStore(
        s => s.prefetchedData.allowedTransactionTypes,
    )

    const {getTransactionTypes} = use(SearchUIDefaultsContext)

    useEffect(() => {
        if (allowedTransactionTypes !== undefined) {
            // eslint-disable-next-line @eslint-react/set-state-in-effect -- the options the host gave are taken as they are
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
