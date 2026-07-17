import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchUIFiltersStore } from '../../state/store'
import { AbstractEntity } from '../../../../../common'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import SearchUIProcessorLogEntryTypeSelect from '../select/SearchUIProcessorLogEntryTypeSelect'

const CRITERION_PROCESSOR_LOG_ENTRY_TYPE_AUTOTEST_ID = 'criterion-processor-log-entry-type'
const CRITERION_PROCESSOR_LOG_ENTRY_TYPE_OPTIONS_AUTOTEST_ID = 'criterion-processor-log-entry-type-options'
const CRITERION_PROCESSOR_LOG_ENTRY_TYPE_OPTION_AUTOTEST_ID = 'criterion-processor-log-entry-type-option'

export const ProcessorLogEntryTypesCriterion = () => {
    const {t} = useTranslation()
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const processorLogEntryType = useSearchUIFiltersStore(s => s.processorLogEntryType)
    const setProcessorLogEntryType = useSearchUIFiltersStore(s => s.setProcessorLogEntryType)

    const {getProcessorLogEntryTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getProcessorLogEntryTypes()
            .then(response => {
                setAvailableOptions(response)
            })
            .catch(console.error)
    }, [])

    return <SearchUIProcessorLogEntryTypeSelect
        value={processorLogEntryType}
        options={availableOptions}
        onChange={setProcessorLogEntryType}
        ariaLabel={t('react.CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE', {
            defaultValue: 'Processor log entry type',
        })}
        autoTest={{
            controlId: CRITERION_PROCESSOR_LOG_ENTRY_TYPE_AUTOTEST_ID,
            optionsId: CRITERION_PROCESSOR_LOG_ENTRY_TYPE_OPTIONS_AUTOTEST_ID,
            optionId: CRITERION_PROCESSOR_LOG_ENTRY_TYPE_OPTION_AUTOTEST_ID,
        }}
    />
}
