import cloneDeep from 'lodash/cloneDeep'
import type {
    SearchUIFiltersState,
    SearchUIRetentionSnapshot,
} from './type'

const MAX_RETAINED_SEARCH_UI_STATES = 100

const retainedStates = new Map<string, SearchUIRetentionSnapshot>()
const activeInstances = new Map<string, Set<symbol>>()
const warnedDuplicateKeys = new Set<string>()

export const getRetainedSearchUIState = (
    settingsContextName: string,
    instanceId?: symbol,
): SearchUIRetentionSnapshot | undefined => {
    const instances = activeInstances.get(settingsContextName)
    if (instances && (instances.size !== 1 || !instanceId || !instances.has(instanceId))) {
        return undefined
    }

    const snapshot = retainedStates.get(settingsContextName)
    if (!snapshot) {
        return undefined
    }

    retainedStates.delete(settingsContextName)
    retainedStates.set(settingsContextName, snapshot)
    return cloneDeep(snapshot)
}

export const retainSearchUIState = (
    settingsContextName: string,
    state: SearchUIFiltersState,
): void => {
    if (!state.initialized || !canRetainSearchUIState(settingsContextName)) {
        return
    }

    retainedStates.delete(settingsContextName)
    retainedStates.set(settingsContextName, createSearchUIRetentionSnapshot(state))

    while (retainedStates.size > MAX_RETAINED_SEARCH_UI_STATES) {
        const oldestKey = retainedStates.keys().next().value
        if (oldestKey === undefined) {
            break
        }
        retainedStates.delete(oldestKey)
    }
}

export const registerSearchUIInstance = (settingsContextName: string, instanceId: symbol): (() => void) => {
    const instances = activeInstances.get(settingsContextName) ?? new Set<symbol>()
    instances.add(instanceId)
    activeInstances.set(settingsContextName, instances)

    if (
        process.env.NODE_ENV !== 'production'
        && instances.size > 1
        && !warnedDuplicateKeys.has(settingsContextName)
    ) {
        warnedDuplicateKeys.add(settingsContextName)
        console.warn(
            `[pne-ui] Multiple SearchUI instances use settingsContextName "${settingsContextName}". ` +
            'Their live stores remain isolated, but automatic state retention is paused until only one remains.',
        )
    }

    return () => {
        const currentInstances = activeInstances.get(settingsContextName)
        currentInstances?.delete(instanceId)

        if (!currentInstances?.size) {
            activeInstances.delete(settingsContextName)
            warnedDuplicateKeys.delete(settingsContextName)
        }
    }
}

export const resetSearchUIRetentionForTests = (): void => {
    retainedStates.clear()
    activeInstances.clear()
    warnedDuplicateKeys.clear()
}

const canRetainSearchUIState = (settingsContextName: string): boolean => {
    return (activeInstances.get(settingsContextName)?.size ?? 0) <= 1
}

const createSearchUIRetentionSnapshot = (state: SearchUIFiltersState): SearchUIRetentionSnapshot => cloneDeep({
    searchConditions: {
        criteria: state.criteria,
        multigetCriteria: state.multigetCriteria,
        exactSearchLabel: state.exactSearchLabel,
        exactSearchValue: state.exactSearchValue,
        ordersSearchLabel: state.ordersSearchLabel,
        ordersSearchValue: state.ordersSearchValue,
        customerLevel: state.customerLevel,
        status: state.status,
        currencies: state.currencies,
        countries: state.countries,
        threeD: state.threeD,
        orderDateType: state.orderDateType,
        dateRangeSpec: state.dateRangeSpec,
        projectCurrency: state.projectCurrency,
        cardTypes: state.cardTypes,
        transactionTypes: state.transactionTypes,
        transactionStatuses: state.transactionStatuses,
        transactionSessionStatusGroup: state.transactionSessionStatusGroup,
        transactionSessionStatuses: state.transactionSessionStatuses,
        grouping: state.grouping,
        recurrenceTypes: state.recurrenceTypes,
        recurrenceStatuses: state.recurrenceStatuses,
        mfoConfigurationTypes: state.mfoConfigurationTypes,
        markerTypes: state.markerTypes,
        markerStatus: state.markerStatus,
        processorLogEntryType: state.processorLogEntryType,
        errorCode: state.errorCode,
    },
    appliedSearchCriteria: state.appliedSearchCriteria,
    activeTemplateName: state.activeTemplateName,
    hasUnappliedFilters: state.hasUnappliedFilters,
    possibleCriteria: state.possibleCriteria,
    predefinedCriteria: state.predefinedCriteria,
    exactSearchLabels: state.exactSearchLabels,
    manualSearch: !!state.config?.manualSearch,
})
