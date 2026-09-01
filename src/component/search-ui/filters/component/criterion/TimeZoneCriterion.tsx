import React from 'react'
import {useTranslation} from 'react-i18next'
import {TIME_ZONE_OFFSET_HOURS, TimeZoneOffsetHours} from '../../types'
import {useSearchUIFiltersStore} from '../../state/store'
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect'

const DEFAULT_OPTION = '__DEFAULT__'
const TIME_ZONE_OPTIONS = [
    DEFAULT_OPTION,
    ...TIME_ZONE_OFFSET_HOURS.map(String),
] as const

export const TimeZoneCriterion = () => {
    const {t} = useTranslation()

    const timeZoneOffsetHours = useSearchUIFiltersStore(state => state.timeZoneOffsetHours)
    const setTimeZoneCriterion = useSearchUIFiltersStore(state => state.setTimeZoneCriterion)
    const selectedOption = timeZoneOffsetHours === null
        ? DEFAULT_OPTION
        : String(timeZoneOffsetHours)

    return <SearchUIEnumChipSelect
        mode={'select'}
        value={selectedOption}
        options={TIME_ZONE_OPTIONS}
        onChange={value => setTimeZoneCriterion(
            value === DEFAULT_OPTION ? null : Number(value) as TimeZoneOffsetHours,
        )}
        getOptionLabel={value => value === DEFAULT_OPTION
            ? t('react.searchUI.default', {defaultValue: 'Default'})
            : formatTimeZoneOffset(Number(value) as TimeZoneOffsetHours)}
        ariaLabel={t('react.CriterionTypeEnum.TIME_ZONE')}
    />
}

const formatTimeZoneOffset = (offsetHours: TimeZoneOffsetHours): string => {
    if (offsetHours === 0) {
        return 'GMT'
    }

    return `GMT ${offsetHours > 0 ? '+' : ''}${offsetHours}`
}
