import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {AbstractEntity} from '../../../../..';

export const TransactionStatusesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([]);

    const options = useSearchUIFiltersStore(s => s.transactionStatuses);
    const setCriterion = useSearchUIFiltersStore(s => s.setTransactionStatusesCriterion);

    const {getTransactionStatuses} = useContext(SearchUIDefaultsContext);

    useEffect(() => {
        getTransactionStatuses()
            .then(response => {
                setAvailableOptions(response);
            })
            // .catch(raiseUIError)
            .catch(console.error);
    }, []);

    return <SearchUIAbstractEntitySelect
        value={options}
        options={availableOptions}
        onChange={setCriterion}
    />;
};

export default TransactionStatusesCriterion;
