import React, {createContext} from 'react';
import {AbstractEntity, AutoCompleteChoiceWithStatus, Status} from '../..';
import {CriterionTypeEnum, LinkedEntityTypeEnum, MultigetCriterion, SearchUITemplate} from "./filters/types";

type GetMatchLinkedItemsRequest = {
    type: LinkedEntityTypeEnum
    searchString: string
    startRow: number
    numRows: number
    status: Status | null
    criteria: MultigetCriterion[]
}

type AbstractSearchUIRequest = {
    contextName: string
    templateName: string
}

type SaveSearchUITemplateRequest = AbstractSearchUIRequest & {
    template: SearchUITemplate
}

type GetProjectCurrenciesRequest = {
    searchConditions: CriterionTypeEnum[]
    multigetCriteria: MultigetCriterion[]
}

export type SearchUIDefaults = {
    getDefaultCurrency: () => AbstractEntity

    getMatchLinkedItems: (request: GetMatchLinkedItemsRequest) => Promise<AbstractEntity[]>
    getSearchTemplates: (contextName: string) => Promise<SearchUITemplate[]>
    saveSearchTemplate: (request: SaveSearchUITemplateRequest) => Promise<void>
    deleteSearchTemplate: (request: AbstractSearchUIRequest) => Promise<void>
    searchTemplateExists: (request: AbstractSearchUIRequest) => Promise<boolean>
    getProjectAvailableCurrencies: (request: GetProjectCurrenciesRequest) => Promise<AutoCompleteChoiceWithStatus[]>
    getCardTypes: () => Promise<AbstractEntity[]>
    getCurrencies: () => Promise<AbstractEntity[]>
    getMFOTypes: () => Promise<AbstractEntity[]>
    getTransactionTypes: () => Promise<AbstractEntity[]>
    getTransactionMarkerTypes: () => Promise<AbstractEntity[]>
    getRecurringPaymentTypes: () => Promise<AbstractEntity[]>
    getRecurringPaymentStatuses: () => Promise<AbstractEntity[]>

    showProcessorsCriterion: () => boolean
    showGatesCriterion: () => boolean
    showProjectsCriterion: () => boolean
    showEndpointsCriterion: () => boolean
    showMerchantsCriterion: () => boolean
    showManagersCriterion: () => boolean
    showResellersCriterion: () => boolean
    // showSuperiorsCriterion: () => boolean
    showDealersCriterion: () => boolean
    showCompaniesCriterion: () => boolean
    showProjectCurrencyCriterion: () => boolean,
    // showFormPaymentTemplatesCriterion: () => boolean,
    // showFormFinishTemplatesCriterion: () => boolean,
    // showFormWaitTemplatesCriterion: () => boolean,
    // showFormPayment3dsTemplatesCriterion: () => boolean,

    showProjectCodeGrouping: () => boolean
    showManagerGrouping: () => boolean
    /**
     * gate related are: GATE, PROCESSOR, MID
     */
    showGateRelatedGroupings: () => boolean
    showCounterpartyGrouping: () => boolean
}

type Props = {
    defaults: Partial<SearchUIDefaults>
    children: React.ReactNode
}

const NOT_CONFIGURED_ERROR = 'Search UI default setting is not configured. Use SearchUIProvider and useContext(SearchUIDefaultsContext)'
const NOT_CONFIGURED_CALLBACK = () => {
    throw new Error(NOT_CONFIGURED_ERROR)
}

export const initialSearchUIDefaults: SearchUIDefaults = {
    getDefaultCurrency: () => ({id: 1, displayName: '123'}),

    getMatchLinkedItems: () => Promise.resolve([]),
    getSearchTemplates: () => Promise.resolve([]),
    saveSearchTemplate: () => Promise.resolve(undefined),
    deleteSearchTemplate: () => Promise.resolve(undefined),
    searchTemplateExists: () => Promise.resolve(false),
    getProjectAvailableCurrencies: () => Promise.resolve([]),
    getCardTypes: () => Promise.resolve([]),
    getCurrencies: () => Promise.resolve([]),
    getMFOTypes: () => Promise.resolve([]),
    getTransactionTypes: () => Promise.resolve([]),
    getTransactionMarkerTypes: () => Promise.resolve([]),
    getRecurringPaymentTypes: () => Promise.resolve([]),
    getRecurringPaymentStatuses: () => Promise.resolve([]),

    showProcessorsCriterion: () => true,
    showGatesCriterion: () => true,
    showProjectsCriterion: () => true,
    showEndpointsCriterion: () => true,
    showMerchantsCriterion: () => true,
    showManagersCriterion: () => true,
    showResellersCriterion: () => true,
    // showSuperiorsCriterion: () => true,
    showDealersCriterion: () => true,
    showCompaniesCriterion: () => true,
    showProjectCurrencyCriterion: () => true,
    // showFormPaymentTemplatesCriterion: () => true,
    // showFormFinishTemplatesCriterion: () => true,
    // showFormWaitTemplatesCriterion: () => true,
    // showFormPayment3dsTemplatesCriterion: () => true,

    showProjectCodeGrouping: () => true,
    showManagerGrouping: () => true,
    showGateRelatedGroupings: () => true,
    showCounterpartyGrouping: () => true,
}

export const SearchUIDefaultsContext = createContext<SearchUIDefaults>(initialSearchUIDefaults)

export const SearchUIProvider = (props: Props) => {
    const {
        defaults,
        children,
    } = props

    return <SearchUIDefaultsContext.Provider
        value={{
            ...initialSearchUIDefaults,
            ...defaults,
        }}
    >
        {children}
    </SearchUIDefaultsContext.Provider>
}