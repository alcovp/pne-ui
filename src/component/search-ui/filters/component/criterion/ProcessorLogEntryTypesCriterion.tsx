import React, { useContext, useEffect, useState } from 'react'
import SearchUIExactSearchLabelSelect from '../select/SearchUIExactSearchLabelSelect'
import { useTranslation } from 'react-i18next'
import { useSearchUIFiltersStore } from '../../state/store'
import { AbstractEntity } from '../../../../../common'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import SearchUIProcessorLogEntryTypeSelect from '../select/SearchUIProcessorLogEntryTypeSelect'

export const ProcessorLogEntryTypesCriterion = () => {
    const [availableOptions, setAvailableOptions] = useState<AbstractEntity[]>([])

    const processorLogEntryType = useSearchUIFiltersStore(s => s.processorLogEntryType)
    const setProcessorLogEntryType = useSearchUIFiltersStore(s => s.setProcessorLogEntryType)

    const {getProcessorLogEntryTypes} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getProcessorLogEntryTypes()
            .then(response => {
                setAvailableOptions(response)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    return <SearchUIProcessorLogEntryTypeSelect
        value={processorLogEntryType}
        options={availableOptions}
        onChange={setProcessorLogEntryType}
    />
}

