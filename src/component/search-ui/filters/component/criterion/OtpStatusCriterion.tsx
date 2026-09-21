import React from 'react';
import {OTP_STATUS_CRITERION_VALUES} from '../../types';
import {useSearchUIFiltersStore} from '../../state/store';
import {useTranslation} from 'react-i18next';
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect';

export const OtpStatusCriterion = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.OtpStatusCriterionEnum'})

    const otpStatus = useSearchUIFiltersStore(s => s.otpStatus)
    const setOtpStatusCriterion = useSearchUIFiltersStore(s => s.setOtpStatusCriterion)

    return <SearchUIEnumChipSelect
        value={otpStatus}
        options={OTP_STATUS_CRITERION_VALUES}
        onChange={setOtpStatusCriterion}
        getOptionLabel={optionRenderer}
        ariaLabel={t('react.CriterionTypeEnum.OTP_STATUS')}
    />
}
