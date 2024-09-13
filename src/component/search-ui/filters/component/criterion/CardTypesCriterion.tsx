import React, {useContext, useEffect, useState} from 'react';
import SearchUIAbstractEntitySelect from '../select/SearchUIAbstractEntitySelect';
import {useSearchUIStore} from '../../state/store';
import {AbstractEntity} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

export const CardTypesCriterion = () => {
    const [availableCardTypes, setAvailableCardTypes] = useState<AbstractEntity[]>([])
    const {
        cardTypes,
        setCardTypesCriterion,
    } = useSearchUIStore((store) => ({
        cardTypes: store.cardTypes,
        setCardTypesCriterion: store.setCardTypesCriterion,
    }))
    const {getCardTypes} = useContext(SearchUIDefaultsContext)

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
