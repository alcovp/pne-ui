import React from 'react';
import {STATUS_CRITERION_VALUES} from '../../types';
import {useSearchUIFiltersStore} from '../../state/store';
import {useTranslation} from 'react-i18next';
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect';

export const StatusCriterion = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.StatusCriterionEnum'})

    const status = useSearchUIFiltersStore(s => s.status)
    const setStatusCriterion = useSearchUIFiltersStore(s => s.setStatusCriterion)

    return <SearchUIEnumChipSelect
        value={status}
        options={STATUS_CRITERION_VALUES}
        onChange={setStatusCriterion}
        getOptionLabel={optionRenderer}
        ariaLabel={t('react.CriterionTypeEnum.STATUS')}
    />
}
