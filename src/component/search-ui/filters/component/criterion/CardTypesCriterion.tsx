import React, {use, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {AbstractEntity} from '../../../../../common/paynet/type';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

export const CardTypesCriterion = () => {
    const [availableCardTypes, setAvailableCardTypes] = useState<AbstractEntity[]>([])

    const cardTypes = useSearchUIFiltersStore(s => s.cardTypes)
    const setCardTypesCriterion = useSearchUIFiltersStore(s => s.setCardTypesCriterion)

    const {getCardTypes} = use(SearchUIDefaultsContext)

    useEffect(() => {
        getCardTypes()
            .then(response => {
                setAvailableCardTypes(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    return <SearchUIAbstractEntitySelect
        value={cardTypes}
        options={availableCardTypes}
        onChange={setCardTypesCriterion}
    />
}
