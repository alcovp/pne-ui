import React, {createContext} from 'react';
import {
    AbstractEntity,
    AutoCompleteChoice,
    AutoCompleteChoiceWithStatus,
    Country,
    Status,
    TransactionSessionGroup,
} from '../..'
import {CriterionTypeEnum, LinkedEntityTypeEnum, MultigetCriterion, SearchUITemplate, TransactionSessionStatuses} from "./filters/types";

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

/**
 * Набор функций и флагов, который описывает среду выполнения SearchUI.
 * Конкретное приложение обязано переопределить нужные обработчики,
 * чтобы выдавать списки сущностей, значения по умолчанию и скрывать/показывать
 * элементы интерфейса.
 *
 * @remarks
 * SearchUI считывает эти значения из {@link SearchUIDefaultsContext}. Все методы
 * имеют заглушки в {@link initialSearchUIDefaults}, но в рабочем коде следует
 * передавать реализацию через {@link SearchUIProvider}, иначе поисковой интерфейс
 * не получит данные и не сможет отобразить нужные фильтры.
 *
 * @example
 * ```tsx
 * <SearchUIProvider
 *   defaults={{
 *     getCountries: fetchCountries,
 *     showProjectsCriterion: () => true,
 *   }}
 * >
 *   <SearchUI {...props} />
 * </SearchUIProvider>
 * ```
 *
 * @see src/stories/SearchUI.stories.tsx
 */
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
    getCountries: () => Promise<Country[]>
    getMFOTypes: () => Promise<AbstractEntity[]>
    getTransactionTypes: () => Promise<AbstractEntity[]>
    getTransactionStatuses: () => Promise<AbstractEntity[]>
    getTransactionSessionStatuses: () => Promise<Map<TransactionSessionGroup, string[]>>,
    getTransactionMarkerTypes: () => Promise<AbstractEntity[]>
    getRecurringPaymentTypes: () => Promise<AbstractEntity[]>
    getRecurringPaymentStatuses: () => Promise<AbstractEntity[]>
    getProcessorLogEntryTypes: () => Promise<AbstractEntity[]>
    searchErrorCodes: (request: { searchString?: string }) => Promise<AutoCompleteChoice[]>

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
    getCountries: () => Promise.resolve([]),
    getMFOTypes: () => Promise.resolve([]),
    getTransactionTypes: () => Promise.resolve([]),
    getTransactionStatuses: () => Promise.resolve([]),
    getTransactionSessionStatuses: () => Promise.resolve(new Map()),
    getTransactionMarkerTypes: () => Promise.resolve([]),
    getRecurringPaymentTypes: () => Promise.resolve([]),
    getRecurringPaymentStatuses: () => Promise.resolve([]),
    getProcessorLogEntryTypes: () => Promise.resolve([]),
    searchErrorCodes: () => Promise.resolve([]),

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

/**
 * React-контекст, предоставляющий SearchUIDefaults вглубь дерева.
 * Используйте `useContext(SearchUIDefaultsContext)`, чтобы получить доступ
 * к настройкам внутри кастомных фильтров.
 */
export const SearchUIDefaultsContext = createContext<SearchUIDefaults>(initialSearchUIDefaults)

/**
 * Провайдер, который объединяет {@link initialSearchUIDefaults} с пользовательскими
 * значениями и делает их доступными всему UI поиска.
 *
 * Разместите компонент вокруг областей, где монтируется `SearchUI` (см. пример в
 * `src/stories/SearchUI.stories.tsx`). Так вы определяете, какие источники данных,
 * шаблоны и флаги видимости должен использовать конкретный экран.
 *
 * @param props.defaults Частичный объект SearchUIDefaults. Укажите только то, что
 *                       нужно переопределить, остальные значения будут взяты
 *                       из {@link initialSearchUIDefaults}.
 * @param props.children Дерево компонентов, которые должны читать контекст.
 */
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
