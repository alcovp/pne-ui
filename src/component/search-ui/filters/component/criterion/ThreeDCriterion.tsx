import React from 'react';
import {ThreeDCriterionEnum} from '../../types';
import {useSearchUIFiltersStore} from '../../state/store';
import {useTranslation} from 'react-i18next';
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect';

const THREE_D_CRITERION_VALUES = [
    ThreeDCriterionEnum.ANY,
    ThreeDCriterionEnum.NO,
    ThreeDCriterionEnum.YES,
] as const

export const ThreeDCriterion = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.ThreeDCriterionEnum'})

    const threeD = useSearchUIFiltersStore(s => s.threeD)
    const set3DCriterion = useSearchUIFiltersStore(s => s.set3DCriterion)

    return <SearchUIEnumChipSelect
        value={threeD}
        options={THREE_D_CRITERION_VALUES}
        onChange={set3DCriterion}
        getOptionLabel={optionRenderer}
        ariaLabel={t('react.CriterionTypeEnum.THREE_D')}
    />
}
