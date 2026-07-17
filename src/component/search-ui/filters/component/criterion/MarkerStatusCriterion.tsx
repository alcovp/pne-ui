import React from 'react';
import {MARKER_STATUS_CRITERION_VALUES} from '../../types';
import {useSearchUIFiltersStore} from '../../state/store';
import {useTranslation} from 'react-i18next';
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect';

export const MarkerStatusCriterion = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.MarkerStatusCriterionEnum'})

    const status = useSearchUIFiltersStore(s => s.markerStatus)
    const setStatusCriterion = useSearchUIFiltersStore(s => s.setMarkerStatusCriterion)

    return <SearchUIEnumChipSelect
        value={status}
        options={MARKER_STATUS_CRITERION_VALUES}
        onChange={setStatusCriterion}
        getOptionLabel={optionRenderer}
        ariaLabel={t('react.CriterionTypeEnum.MARKER_STATUS')}
    />
}
