import React from 'react'
import {useTranslation} from 'react-i18next'
import {CSV_CHARSETS, CsvCharset} from '../../types'
import {useSearchUIFiltersStore} from '../../state/store'
import {SearchUIEnumChipSelect} from '../select/SearchUIEnumChipSelect'

const DEFAULT_OPTION = '__DEFAULT__'
const CSV_CHARSET_OPTIONS = [DEFAULT_OPTION, ...CSV_CHARSETS] as const

export const CsvCharsetCriterion = () => {
    const {t} = useTranslation()

    const csvCharset = useSearchUIFiltersStore(state => state.csvCharset)
    const setCsvCharsetCriterion = useSearchUIFiltersStore(state => state.setCsvCharsetCriterion)
    const selectedOption = csvCharset ?? DEFAULT_OPTION

    return <SearchUIEnumChipSelect
        mode={'select'}
        value={selectedOption}
        options={CSV_CHARSET_OPTIONS}
        onChange={value => setCsvCharsetCriterion(
            value === DEFAULT_OPTION ? null : value as CsvCharset,
        )}
        getOptionLabel={value => value === DEFAULT_OPTION
            ? t('react.searchUI.default', {defaultValue: 'Default'})
            : value}
        ariaLabel={t('react.CriterionTypeEnum.CSV_CHARSET')}
    />
}
