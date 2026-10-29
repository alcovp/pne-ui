import React, {useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
    CUSTOMER_LEVEL_DEPENDENCIES,
    CriterionTypeEnum,
    DateRangeSpecType,
    ExactCriterionSearchLabelEnum,
    SearchCriteria,
    SearchUICriterionAvailabilityRule,
    SearchUIConditionsInput,
    SearchUITemplate,
} from './types';
import SearchUITemplatesMenu from './component/template/SearchUITemplatesMenu';
import {useTranslation} from 'react-i18next';
import {
    useSearchUIFiltersStore,
    useSearchUIFiltersStoreContext,
} from './state/store';
import {Box, ButtonBase, SxProps, Tooltip} from '@mui/material';
import {alpha, type Theme} from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import isEqual from 'lodash/isEqual';
import SearchUIAddFilter from './component/select/SearchUIAddFilter';
import {CriterionContainer} from './CriterionContainer';
import {PneButton, SearchUIDefaults} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";
import {useSearchUIResetToDefaults} from './useSearchUIResetToDefaults';
import {isCriterionAvailable} from './criterionAvailability';
import type { SearchUIDateOnlyTimeZone } from './dateRangeTimeZone';
import {SearchUIFiltersStoreProvider} from './state/SearchUIFiltersStoreProvider';
import {
    getRetainedSearchUIState,
    isSearchUIRetentionSnapshotCompatible,
} from './state/retention';
import type {SearchUIRetentionSnapshot} from './state/type';
import {toSearchUIConditionsState} from './publicConditions';
import type {AbstractEntity} from '../../../common/paynet/type';
import {
    normalizeAllowedEntityNames,
    resolveAllowedEntityOptions,
} from './entityOptionRestriction';
import {
    discardLegacyLastSearchUITemplateName,
    forgetLastSearchUITemplateName,
    type LastSearchUITemplateName,
    readLastSearchUITemplateName,
    rememberLastSearchUITemplateName,
} from './templateStorage';
import {createAutoTestAttributes} from '../../AutoTestAttribute';
import {readSearchUIFiltersCollapsed, rememberSearchUIFiltersCollapsed} from './collapsedStorage';
import {SearchUIAutoTestScopeProvider} from './AutoTestScope';
import {
    assertValidMaxRangeSpanInDays,
    type SearchUIValidationResult,
} from './validation';
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_COLUMNS,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout';
import {SEARCH_UI_FILTERS_TOOLTIP_DELAY} from './styled';

const SEARCH_FILTERS_AUTOTEST_ID = 'search-filters';
const TOGGLE_FILTERS_AUTOTEST_ID = 'toggle-filters';
const FILTERS_COUNT_AUTOTEST_ID = 'filters-count';
const CLEAR_FILTERS_AUTOTEST_ID = 'clear-all';
const RUN_SEARCH_AUTOTEST_ID = 'run-search';

/** The fold transition of the criteria rows; the fallback timer runs a little longer. */
const COLLAPSE_DURATION_MS = 200

type Point = {left: number; top: number}

const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

/**
 * Slides an element from where it was to where the layout has just put it, over the fold duration
 * (the FLIP technique): the element starts translated back to its old place and the transition
 * carries it to the new one. The inline transition stays; the next slide resets it first.
 */
const slideFrom = (element: HTMLElement, from: Point) => {
    element.style.transition = 'none'
    element.style.transform = ''
    const to = element.getBoundingClientRect()
    const dx = from.left - to.left
    const dy = from.top - to.top
    if (to.width === 0 || (dx === 0 && dy === 0) || prefersReducedMotion()) {
        element.style.transition = ''
        return
    }
    element.style.transform = `translate(${dx}px, ${dy}px)`
    // The start position must be laid out before the transition begins.
    void element.offsetWidth
    element.style.transition = `transform ${COLLAPSE_DURATION_MS}ms ease`
    element.style.transform = ''
}

/**
 * Дополнительные настройки критерия диапазона дат.
 */
export type DateRangeCriterionConfig = {
    /**
     * Разрешает выбор времени вместе с датой.
     */
    enableTimeSelection?: boolean
    /**
     * Таймзона для выбора дат без времени в режиме EXACTLY.
     * По умолчанию сохраняется старое поведение с локальной таймзоной браузера.
     * Укажите Europe/Moscow для экранов, где date-only диапазон должен быть московскими бизнес-сутками.
     */
    dateOnlyTimeZone?: SearchUIDateOnlyTimeZone
    /**
     * Ограничивает список доступных вариантов выбора диапазона дат.
     */
    dateRangeSpecTypes?: ReadonlyArray<DateRangeSpecType>
    /**
     * Максимальная допустимая продолжительность диапазона в календарных сутках.
     * Граница включительная: диапазон ровно в указанное число суток допустим.
     */
    maxRangeSpanInDays?: number
}

/**
 * Дополнительные настройки критерия типов транзакций.
 */
export type TransactionTypesCriterionConfig = {
    /**
     * Ограничивает общий справочник точным списком системных имён из поля displayName.
     */
    allowedNames: ReadonlyArray<string>
}

/**
 * Общая конфигурация компонента {@link SearchUIFilters}.
 */
export type SearchUIFiltersConfig = {
    /**
     * Группы критериев, которые не могут быть активны одновременно.
     */
    conflictingCriteriaGroups?: CriterionTypeEnum[][]
    /**
     * Правила доступности критериев, зависящие от текущего состояния фильтров.
     * Недоступный критерий удаляется из активных критериев и не отображается в списке добавления.
     * Если недоступный критерий снова становится доступным и входит в predefinedCriteria, он возвращается автоматически.
     */
    criterionAvailabilityRules?: SearchUICriterionAvailabilityRule[]
    /**
     * Список предустановленных критериев, которые пользователь может удалить.
     */
    removablePredefinedCriteria?: CriterionTypeEnum[]
    /**
     * Прячет выпадающий список шаблонов фильтров.
     */
    hideTemplatesSelect?: boolean
    /**
     * Прячет кнопку сворачивания/разворачивания панели фильтров.
     */
    hideShowFiltersButton?: boolean
    /**
     * Прячет кнопку Refresh автоматического режима, например на страницах отчётов, где ей нечего обновлять.
     * Кнопку Search ручного режима (`manualSearch`) флаг не прячет: без неё фильтры не применить.
     */
    hideRefreshButton?: boolean
    /**
     * Дополнительные настройки поведения фильтра по диапазону дат.
     */
    dateRange?: DateRangeCriterionConfig
    /**
     * Дополнительные настройки поведения фильтра типов транзакций.
     */
    transactionTypes?: TransactionTypesCriterionConfig
    /**
     * Включает ручной режим поиска: при изменении фильтров запрос не отправляется автоматически.
     * Кнопка в строке действий панели остается видимой всегда: в ручном режиме это «Search»,
     * в автоматическом — «Refresh».
     */
    manualSearch?: boolean
}

/**
 * Свойства компонента {@link SearchUIFilters}.
 */
export type SearchUIFiltersProps = {
    /**
     * Stable non-secret Selenium scope for this filters root and its portals.
     * Defaults to settingsContextName; set it explicitly when multiple instances may render together.
     */
    autoTestId?: string
    /**
     * Имя контекста настроек, используемое для хранения пользовательских предпочтений.
     */
    settingsContextName: string
    /**
     * Полный набор критериев, доступных в фильтре.
     */
    possibleCriteria: CriterionTypeEnum[]
    /**
     * Criteria temporarily unavailable in the current consumer mode. Active
     * values remain stored but their controls are disabled and callers of
     * SearchUI receive neutral request values until the criteria are enabled.
     */
    disabledCriteria?: readonly CriterionTypeEnum[]
    /**
     * Критерии, которые активируются автоматически.
     */
    predefinedCriteria?: CriterionTypeEnum[]
    /**
     * Доступные значения точного поиска.
     */
    exactSearchLabels?: ExactCriterionSearchLabelEnum[]
    /**
     * Первоначальное состояние фильтров (кроме перечня критериев).
     */
    initialSearchConditions?: Partial<Omit<SearchUIConditionsInput, 'criteria'>>
    /**
     * Внешнее состояние фильтра, синхронизируемое со стором.
     */
    searchConditions?: Partial<SearchUIConditionsInput>
    /**
     * Колбэк, вызываемый при изменении условий поиска.
     */
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
    /**
     * Колбэк состояния валидации. Позволяет синхронно блокировать внешние действия,
     * например кнопку генерации отчёта.
     */
    onValidationChange?: (validationResult: SearchUIValidationResult) => void
    /**
     * Флаг активной загрузки данных таблицы. Используется для защиты кнопки поиска от повторных нажатий.
     */
    searchLoading?: boolean
    /**
     * Конфигурация поведения фильтра.
     */
    config?: SearchUIFiltersConfig
}

/**
 * Панель фильтров поискового интерфейса с поддержкой шаблонов и динамических критериев.
 * @param props Свойства компонента.
 */
export const SearchUIFilters = (props: SearchUIFiltersProps) => {
    return <SearchUIFiltersStoreProvider
        key={props.settingsContextName}
        settingsContextName={props.settingsContextName}
    >
        <SearchUIFiltersContent {...props}/>
    </SearchUIFiltersStoreProvider>
}

export const SearchUIFiltersContent = (props: SearchUIFiltersProps) => {
    // Keep runtime validation at the public render boundary even when asynchronous
    // bootstrap work delays mounting the initialized filters subtree.
    toSearchUIConditionsState(props.initialSearchConditions, 'initialSearchConditions', false)
    toSearchUIConditionsState(props.searchConditions, 'searchConditions', true)
    assertValidMaxRangeSpanInDays(props.config?.dateRange?.maxRangeSpanInDays)

    const transactionTypesConfig = props.config?.transactionTypes
    if (transactionTypesConfig === undefined) {
        return <SearchUIFiltersBootstrap {...props}/>
    }

    const normalizedAllowedNames = normalizeAllowedEntityNames(
        transactionTypesConfig.allowedNames,
    ) ?? []

    return <RestrictedTransactionTypesSearchUIFiltersContent
        key={JSON.stringify(normalizedAllowedNames)}
        {...props}
        allowedNames={normalizedAllowedNames}
    />
}

type RestrictedTransactionTypesSearchUIFiltersContentProps = SearchUIFiltersProps & {
    allowedNames: string[]
}

type RestrictedTransactionTypesLoadState =
    | {status: 'loading'}
    | {status: 'ready', options: AbstractEntity[]}
    | {status: 'error', error: Error}

const RestrictedTransactionTypesSearchUIFiltersContent = (
    props: RestrictedTransactionTypesSearchUIFiltersContentProps,
) => {
    const {allowedNames, ...filtersProps} = props
    const {getTransactionTypes} = useContext(SearchUIDefaultsContext)
    const loadPromiseRef = useRef<Promise<AbstractEntity[]> | null>(null)
    const [loadState, setLoadState] = useState<RestrictedTransactionTypesLoadState>({status: 'loading'})

    useEffect(() => {
        let active = true

        loadPromiseRef.current ??= getTransactionTypes()
            .then(options => resolveAllowedEntityOptions(
                options,
                allowedNames,
                'SearchUIFiltersConfig.transactionTypes.allowedNames',
            ))

        loadPromiseRef.current
            .then(options => {
                if (active) {
                    setLoadState({status: 'ready', options})
                }
            })
            .catch(error => {
                if (active) {
                    setLoadState({
                        status: 'error',
                        error: error instanceof Error ? error : new Error(String(error)),
                    })
                }
            })

        return () => {
            active = false
        }
    }, [allowedNames, getTransactionTypes])

    if (loadState.status === 'error') {
        throw loadState.error
    }

    if (loadState.status === 'loading') {
        return null
    }

    return <SearchUIFiltersBootstrap
        {...filtersProps}
        allowedTransactionTypes={loadState.options}
    />
}

type SearchUIFiltersBootstrapProps = SearchUIFiltersProps & {
    allowedTransactionTypes?: AbstractEntity[]
}

type SearchUIFiltersBootstrapResult = {
    retainedSnapshot?: SearchUIRetentionSnapshot
    templates?: SearchUITemplate[]
    initialTemplate?: SearchUITemplate
    loadTemplatesInBackground: boolean
    /** The user folded this panel last time, per the host store. */
    collapsed?: boolean
}

/**
 * Joins the host's answer about the fold to the bootstrap: a synchronous answer keeps a
 * synchronous bootstrap synchronous, a promise makes the first render wait for it, so the
 * panel never opens expanded and folds a moment later.
 */
const withCollapsed = (
    work: SearchUIFiltersBootstrapWork,
    collapsed: boolean | Promise<boolean>,
): SearchUIFiltersBootstrapWork => {
    if (!(collapsed instanceof Promise)) {
        return work.status === 'ready'
            ? {status: 'ready', result: {...work.result, collapsed}}
            : {status: 'pending', promise: work.promise.then(result => ({...result, collapsed}))}
    }
    const resultPromise = work.status === 'ready' ? Promise.resolve(work.result) : work.promise
    return {
        status: 'pending',
        promise: Promise.all([resultPromise, collapsed]).then(([result, folded]) => ({...result, collapsed: folded})),
    }
}

type SearchUIFiltersBootstrapWork =
    | {status: 'ready', result: SearchUIFiltersBootstrapResult}
    | {status: 'pending', promise: Promise<SearchUIFiltersBootstrapResult>}

const SearchUIFiltersBootstrap = (props: SearchUIFiltersBootstrapProps) => {
    const {
        settingsContextName,
        possibleCriteria = [],
        predefinedCriteria = [],
        exactSearchLabels = [],
        searchConditions,
        config,
        allowedTransactionTypes,
    } = props
    const defaults = useContext(SearchUIDefaultsContext)
    const {instanceId} = useSearchUIFiltersStoreContext()
    const bootstrapWorkRef = useRef<SearchUIFiltersBootstrapWork | null>(null)
    const [bootstrapResult, setBootstrapResult] = useState<SearchUIFiltersBootstrapResult | null>(null)

    useEffect(() => {
        let active = true

        bootstrapWorkRef.current ??= withCollapsed((() => {
            const hasExternalSearchConditions = searchConditions !== undefined
                && Object.keys(searchConditions).length > 0
            const adjustedPossibleCriteria = filterAvailableCriteria(defaults, [
                ...new Set([
                    ...possibleCriteria,
                    ...predefinedCriteria,
                ]),
            ])
            const retainedSnapshot = hasExternalSearchConditions
                ? undefined
                : getRetainedSearchUIState(settingsContextName, instanceId)
            const retainedSnapshotCompatible = retainedSnapshot !== undefined
                && isSearchUIRetentionSnapshotCompatible(retainedSnapshot, {
                    possibleCriteria: adjustedPossibleCriteria,
                    predefinedCriteria,
                    exactSearchLabels,
                    config,
                    prefetchedData: allowedTransactionTypes === undefined
                        ? {}
                        : {allowedTransactionTypes},
                })

            if (hasExternalSearchConditions || retainedSnapshotCompatible) {
                return {
                    status: 'ready' as const,
                    result: {
                        retainedSnapshot,
                        loadTemplatesInBackground: true,
                    },
                }
            }

            const lastTemplate = readLastSearchUITemplateName(defaults, settingsContextName)
            if (!(lastTemplate instanceof Promise) && lastTemplate.name === null) {
                return {
                    status: 'ready' as const,
                    result: {
                        retainedSnapshot,
                        loadTemplatesInBackground: true,
                    },
                }
            }

            const loadInitialTemplate = (
                {name: lastTemplateName, legacy}: LastSearchUITemplateName,
            ): Promise<SearchUIFiltersBootstrapResult> => {
                if (lastTemplateName === null) {
                    return Promise.resolve({
                        retainedSnapshot,
                        loadTemplatesInBackground: true,
                    })
                }

                return defaults.getSearchTemplates(settingsContextName)
                    .then(templates => {
                        const initialTemplate = templates.find(template => template.name === lastTemplateName)

                        if (initialTemplate === undefined) {
                            if (legacy) {
                                discardLegacyLastSearchUITemplateName(settingsContextName)
                            } else {
                                void forgetLastSearchUITemplateName(defaults, settingsContextName)
                            }
                        } else if (legacy) {
                            // The browser-kept name proved valid: it moves to the host store.
                            void rememberLastSearchUITemplateName(defaults, settingsContextName, initialTemplate.name)
                        }

                        return {
                            retainedSnapshot,
                            templates,
                            initialTemplate,
                            loadTemplatesInBackground: false,
                        }
                    })
            }

            return {
                status: 'pending' as const,
                promise: Promise.resolve(lastTemplate)
                    .then(loadInitialTemplate)
                    .catch(error => {
                        console.error(error)
                        return {
                            retainedSnapshot,
                            templates: [],
                            loadTemplatesInBackground: false,
                        }
                    }),
            }
        })(), config?.hideShowFiltersButton ? false : readSearchUIFiltersCollapsed(defaults, settingsContextName))

        const bootstrapWork = bootstrapWorkRef.current
        if (bootstrapWork.status === 'pending') {
            bootstrapWork.promise.then(result => {
                if (active) {
                    setBootstrapResult(result)
                }
            })
        } else {
            setBootstrapResult(bootstrapWork.result)
        }

        return () => {
            active = false
        }
        // The keyed store provider remounts this subtree when the search context changes.
        // The promise ref deliberately survives the StrictMode effect replay.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (bootstrapResult === null) {
        return null
    }

    return <InitializedSearchUIFiltersContent
        {...props}
        {...bootstrapResult}
    />
}

type InitializedSearchUIFiltersContentProps = SearchUIFiltersProps & {
    allowedTransactionTypes?: AbstractEntity[]
    retainedSnapshot?: SearchUIRetentionSnapshot
    templates?: SearchUITemplate[]
    initialTemplate?: SearchUITemplate
    loadTemplatesInBackground: boolean
    collapsed?: boolean
}

/**
 * `mounting`: the rows are in the DOM at zero height; `opening`: the height grows; `open`: at
 * rest, the panel no longer clips; `closing`: the height shrinks; `closed`: the rows are gone.
 */
type CollapsiblePhase = 'closed' | 'mounting' | 'opening' | 'open' | 'closing'

/**
 * The criteria rows fold with a height transition on the panel. They stay mounted while the
 * panel closes and leave the DOM once it is shut, as they did before the animation; on opening
 * they mount at zero height, that height is laid out, and the next frame lets it grow. Without a
 * transition end (reduced motion, jsdom) a timer finishes the phase.
 */
const useCollapsibleRows = (shown: boolean, panelRef: React.RefObject<HTMLDivElement | null>) => {
    const [phase, setPhase] = useState<CollapsiblePhase>(shown ? 'open' : 'closed')

    // Before the paint, so the zero-height rows never show at full height for a frame.
    useLayoutEffect(() => {
        setPhase(current => {
            if (shown) {
                return current === 'open' || current === 'opening' ? current : 'mounting'
            }
            return current === 'closed' ? current : 'closing'
        })
    }, [shown])

    useEffect(() => {
        if (phase === 'mounting') {
            const frame = requestAnimationFrame(() => {
                // The zero-height state must be laid out before the growth, or nothing animates.
                void panelRef.current?.offsetHeight
                setPhase(current => current === 'mounting' ? 'opening' : current)
            })
            return () => cancelAnimationFrame(frame)
        }
        if (phase === 'opening' || phase === 'closing') {
            const timer = setTimeout(
                () => setPhase(current => current === phase ? (phase === 'opening' ? 'open' : 'closed') : current),
                COLLAPSE_DURATION_MS + 50,
            )
            return () => clearTimeout(timer)
        }
        return undefined
    }, [phase, panelRef])

    const onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') {
            return
        }
        setPhase(current => {
            if (current === 'opening') return 'open'
            if (current === 'closing') return 'closed'
            return current
        })
    }

    return {phase, onTransitionEnd}
}

const InitializedSearchUIFiltersContent = (props: InitializedSearchUIFiltersContentProps) => {
    const {t} = useTranslation();
    const {
        autoTestId = props.settingsContextName,
        settingsContextName,
        possibleCriteria = [],
        predefinedCriteria = [],
        disabledCriteria = [],
        exactSearchLabels = [],
        initialSearchConditions,
        searchConditions,
        config,
        onFiltersUpdate,
        onValidationChange,
        searchLoading = false,
        allowedTransactionTypes,
        retainedSnapshot,
        templates,
        initialTemplate,
        loadTemplatesInBackground,
        collapsed = false,
    } = props

    const defaults = useContext(SearchUIDefaultsContext)
    const hasExternalSearchConditions = searchConditions !== undefined
        && Object.keys(searchConditions).length > 0
    const initialSearchConditionsState = useMemo(() => toSearchUIConditionsState(
        initialSearchConditions,
        'initialSearchConditions',
        false,
    ), [initialSearchConditions])
    const searchConditionsState = useMemo(() => toSearchUIConditionsState(
        searchConditions,
        'searchConditions',
        true,
    ), [searchConditions])

    const adjustedPossibleCriteria = filterAvailableCriteria(defaults, [
        ...new Set([
            ...possibleCriteria,
            ...predefinedCriteria
        ])
    ])
    const disabledCriteriaSet = useMemo(() => new Set(disabledCriteria), [disabledCriteria])

    const setInitialState = useSearchUIFiltersStore(s => s.setInitialState)
    const setDefaults = useSearchUIFiltersStore(s => s.setDefaults)
    const loadTemplates = useSearchUIFiltersStore(s => s.loadTemplates)
    const criteria = useSearchUIFiltersStore(s => s.criteria)
    const addCriterion = useSearchUIFiltersStore(s => s.addCriterion)
    const conflictingCriteriaGroups = useSearchUIFiltersStore(s => s.config?.conflictingCriteriaGroups)
    const hideTemplatesSelect = useSearchUIFiltersStore(s => s.config?.hideTemplatesSelect)
    const hideShowFiltersButton = useSearchUIFiltersStore(s => s.config?.hideShowFiltersButton)
    const hideRefreshButton = useSearchUIFiltersStore(s => s.config?.hideRefreshButton)
    const manualSearch = useSearchUIFiltersStore(s => s.config?.manualSearch)
    const triggerSearch = useSearchUIFiltersStore(s => s.triggerSearch)
    const updateConditions = useSearchUIFiltersStore(s => s.updateConditions)
    const filtersState = useSearchUIFiltersStore(s => s)
    const validationResult = useSearchUIFiltersStore(s => s.validationResult)

    const [showFilters, setShowFilters] = useState(!collapsed)
    const actionsRef = useRef<HTMLDivElement>(null)
    const actionsSlideFromRef = useRef<Point | null>(null)

    // Where the actions stand before a change that moves them: a fold, an unfold or the first
    // criterion. The slide starts there once the layout has settled. On phones the actions box
    // dissolves into the row (display: contents) and has no place of its own: no slide.
    const captureActionsPosition = () => {
        const element = actionsRef.current
        const rect = element?.getBoundingClientRect()
        actionsSlideFromRef.current = rect && rect.width > 0 ? {left: rect.left, top: rect.top} : null
    }
    const panelRef = useRef<HTMLDivElement | null>(null)
    const {phase, onTransitionEnd} = useCollapsibleRows(showFilters, panelRef)
    const filtersPanelId = useId()
    const initializedRef = useRef(false)
    const synchronizedExternalConditionsRef = useRef(searchConditionsState)
    // The Default item says where the filters went, Clear all what it did; only one of them shows.
    const resetToDefaults = useSearchUIResetToDefaults({
        message: hideTemplatesSelect
            ? t('react.searchUI.clearAll.cleared', {defaultValue: 'All filters cleared'})
            : t('react.searchUI.default.restored', {defaultValue: 'Default filters restored'}),
    })

    useEffect(() => {
        if (initializedRef.current) {
            return
        }
        initializedRef.current = true

        setInitialState({
            defaults: defaults,
            settingsContextName: settingsContextName,
            possibleCriteria: adjustedPossibleCriteria,
            predefinedCriteria: predefinedCriteria,
            exactSearchLabels: exactSearchLabels,
            exactSearchLabel: exactSearchLabels[0],
            criteria: predefinedCriteria,
            config: config,
            onFiltersUpdate: onFiltersUpdate,
            onValidationChange: onValidationChange ?? (() => undefined),
            skipLastTemplateAutoApply: true,
            ...(allowedTransactionTypes === undefined ? {} : {
                prefetchedData: {
                    allowedTransactionTypes,
                },
            }),
            ...initialSearchConditionsState,
        }, hasExternalSearchConditions ? undefined : retainedSnapshot, {
            normalizeInitialDateRange:
                initialSearchConditionsState?.dateRangeSpec !== undefined
                || searchConditionsState?.dateRangeSpec !== undefined,
            templates,
            initialTemplate: hasExternalSearchConditions ? undefined : initialTemplate,
            initialConditions: hasExternalSearchConditions ? searchConditionsState : undefined,
        })
        if (loadTemplatesInBackground) {
            loadTemplates({autoApplyLastTemplate: false})
        }
        // The keyed store provider remounts this subtree when the search context changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        // The provider value may change after mount, e.g. when the host learns that the
        // server can persist the template order; equal members leave the store untouched.
        if (initializedRef.current) {
            setDefaults(defaults)
        }
    }, [defaults, setDefaults])

    useEffect(() => {
        if (isEqual(synchronizedExternalConditionsRef.current, searchConditionsState)) {
            return
        }
        synchronizedExternalConditionsRef.current = searchConditionsState

        if (hasExternalSearchConditions && searchConditionsState) {
            updateConditions(searchConditionsState, {
                forceSearch: true,
                resetTemplate: true,
            })
        }
    }, [hasExternalSearchConditions, searchConditionsState, updateConditions])

    const someCriteriaAdded = criteria.length > 0
    const showFiltersCountChip = someCriteriaAdded && !showFilters
    const removablePredefinedCriteria = config?.removablePredefinedCriteria ?? []
    const nonRemovablePredefinedCriteria = predefinedCriteria.filter(
        criterion => !removablePredefinedCriteria.includes(criterion),
    )
    const nothingToClear = criteria.every(criterion => nonRemovablePredefinedCriteria.includes(criterion))
    const criteriaOptions = adjustedPossibleCriteria
        .filter(criterion => !criteria.includes(criterion))
        .filter(criterion => !disabledCriteriaSet.has(criterion))
        .filter(possibleC => {
            const criteriaToAdd = possibleC === CriterionTypeEnum.CUSTOMER_LEVEL
                ? [possibleC, ...CUSTOMER_LEVEL_DEPENDENCIES]
                : [possibleC]

            return criteriaToAdd.every(candidate => {
                if (!isCriterionAvailable(candidate, filtersState, config)) {
                    return false
                }

                if (criteria.includes(candidate)) {
                    return true
                }

                return !conflictingCriteriaGroups?.some(group => (
                    group.includes(candidate)
                    && group.some(conflictingCriterion => criteria.includes(conflictingCriterion))
                ))
            })
        })
    const allCriteriaAdded = criteriaOptions.length === 0
    const showTemplatesMenu = !hideTemplatesSelect
    // The templates menu resets to the defaults with its Default item; Clear all stays only where
    // the menu is hidden.
    const showClearAllButton = !showTemplatesMenu && !nothingToClear
    const showAddFilterButton = !allCriteriaAdded
    const filtersLabel = t('react.searchUI.filters')
    // The chevron keeps its name and reports the state through aria-expanded; the tooltip tells a
    // pointer user what the click will do.
    const toggleHint = showFilters
        ? t('react.searchUI.filters.hide', {defaultValue: 'Hide filters'})
        : t('react.searchUI.filters.show', {defaultValue: 'Show filters'})
    // The fold is remembered by the host per user and context; expanding through Add filter counts too.
    const setFiltersShown = (shown: boolean) => {
        if (shown === showFilters) {
            return
        }
        captureActionsPosition()
        setShowFilters(shown)
        void rememberSearchUIFiltersCollapsed(defaults, settingsContextName, !shown)
    }

    // Nothing to fold without criteria: the chevron waits for the first one, which Add filter unfolds.
    // One pill holds the chevron and, while folded, the number of criteria: one target, easy to hit.
    const toggleButton = hideShowFiltersButton || !someCriteriaAdded ? null : <Tooltip
        disableInteractive
        enterDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        enterNextDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        title={toggleHint}
    >
        <ButtonBase
            {...createAutoTestAttributes(TOGGLE_FILTERS_AUTOTEST_ID)}
            onClick={() => setFiltersShown(!showFilters)}
            // The hover tint and the focus ring do the feedback; a round ripple sits badly in a pill.
            disableRipple
            aria-label={filtersLabel}
            aria-controls={filtersPanelId}
            aria-expanded={showFilters}
            sx={toggleSx}
        >
            <ExpandMoreIcon
                fontSize={'small'}
                sx={{transform: showFilters ? 'rotate(180deg)' : 'rotate(-90deg)'}}
            />
            {showFiltersCountChip ? <Box
                {...createAutoTestAttributes(FILTERS_COUNT_AUTOTEST_ID)}
                component={'span'}
                sx={filtersCountSx}
            >
                {criteria.length}
            </Box> : null}
        </ButtonBase>
    </Tooltip>
    const clearAllButton = showClearAllButton ? <PneButton
        {...createAutoTestAttributes(CLEAR_FILTERS_AUTOTEST_ID)}
        onClick={resetToDefaults}
        pneStyle='neutral'
        size={'small'}
        sx={nowrapButtonSx}
    >
        {t('clear.all')}
    </PneButton> : null
    const templatesMenu = showTemplatesMenu ? <SearchUITemplatesMenu onResetToDefaults={resetToDefaults}/> : null
    const addFilterButton = showAddFilterButton ? <SearchUIAddFilter
        options={criteriaOptions}
        onChange={criterion => {
            captureActionsPosition()
            setFiltersShown(true)
            addCriterion(criterion)
        }}
    /> : null
    const searchButton = manualSearch || !hideRefreshButton ? <PneButton
        {...createAutoTestAttributes(RUN_SEARCH_AUTOTEST_ID)}
        onClick={triggerSearch}
        pneStyle='contained'
        size={'small'}
        disabled={searchLoading || !validationResult.isValid}
        sx={searchButtonSx}
    >
        {manualSearch
            ? t('react.searchUI.search')
            : t('react.searchUI.refresh', {defaultValue: 'Refresh'})}
    </PneButton> : null
    const rowsMounted = phase !== 'closed'
    const criteriaRows = rowsMounted ? criteria.map((criterion) =>
        <CriterionContainer
            disabled={disabledCriteriaSet.has(criterion)}
            key={criterion}
            type={criterion}
        />
    ) : null

    // No title bar: the criteria rows and the actions row share one grid, so the actions line up
    // with the values column. The collapsible panel passes the columns through, and the actions
    // row stays outside it, so the chevron survives the collapse.
    const hasActions = Boolean(
        toggleButton || clearAllButton || templatesMenu || addFilterButton || searchButton,
    )
    // Folded, or without criteria, there is no values column to line up with: the chevron, the
    // count and the actions follow each other instead of leaving the empty name and icon columns
    // between them. The switch happens as the fold starts and as the rows mount for the unfold, so
    // the actions slide while the rows fold or unfold.
    const actionsInColumns = showFilters && rowsMounted && criteria.length > 0

    // The slide starts once the layout has settled: for an unfold that is when the rows are mounted
    // and the name column has its width back.
    useLayoutEffect(() => {
        const from = actionsSlideFromRef.current
        if (!from) {
            return
        }
        if (showFilters && criteria.length > 0 && !rowsMounted) {
            return
        }
        actionsSlideFromRef.current = null
        const element = actionsRef.current
        if (element) {
            slideFrom(element, from)
        }
    })

    return <SearchUIAutoTestScopeProvider scope={autoTestId}>
        <Box
            {...createAutoTestAttributes(SEARCH_FILTERS_AUTOTEST_ID, autoTestId)}
            role={'region'}
            aria-label={filtersLabel}
            sx={rootSx}
        >
            <Box
                id={filtersPanelId}
                ref={panelRef}
                hidden={!rowsMounted}
                onTransitionEnd={onTransitionEnd}
                sx={getPanelSx(phase)}
            >
                <Box sx={panelInnerSx}>
                    {criteriaRows}
                </Box>
            </Box>
            {hasActions ? <Box sx={actionsInColumns ? actionsRowSx : compactActionsRowSx}>
                <Box sx={actionsLeadSx}>
                    {toggleButton}
                </Box>
                <Box ref={actionsRef} sx={actionsSx}>
                    {clearAllButton}
                    {templatesMenu}
                    {addFilterButton}
                    {searchButton}
                </Box>
            </Box> : null}
        </Box>
    </SearchUIAutoTestScopeProvider>
}

const nowrapButtonSx: SxProps = {
    whiteSpace: 'nowrap',
}

// The fold toggle: a 28px pill with the chevron and, folded, the count; the hit area reaches
// 40px tall and 4px past the pill on each side.
const toggleSx: SxProps<Theme> = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '4px',
    height: '28px',
    minWidth: '28px',
    px: '6px',
    borderRadius: '4px',
    color: 'primary.main',
    '&:hover': {
        backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
    },
    '&.Mui-focusVisible': {
        outline: theme => `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '1px',
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-6px',
        right: '-4px',
        bottom: '-6px',
        left: '-4px',
    },
}

const filtersCountSx: SxProps = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minWidth: '20px',
    height: '20px',
    px: '5px',
    borderRadius: '10px',
    border: '1px solid currentColor',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: 1,
}

// On phones the main button takes the rest of its line, alone or after the others.
const searchButtonSx: SxProps = {
    whiteSpace: 'nowrap',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        flexGrow: 1,
    },
}

const rootSx: SxProps = {
    px: '16px',
    display: 'grid',
    gridTemplateColumns: SEARCH_UI_FILTERS_COLUMNS,
    columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    alignItems: 'center',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
}

// The panel is a row of the root grid that passes the columns through and folds by animating its
// single row track between 0fr and 1fr; the inner box may shrink to nothing, so the fold clips.
// Only at rest and open does the panel stop clipping, for the focus rings at its edges.
const getPanelSx = (phase: CollapsiblePhase): SxProps<Theme> => ({
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: phase === 'opening' || phase === 'open' ? '1fr' : '0fr',
    overflow: phase === 'open' ? 'visible' : 'hidden',
    transition: `grid-template-rows ${COLLAPSE_DURATION_MS}ms ease`,
    '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
    },
    '&[hidden]': {
        display: 'none',
    },
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
})

const panelInnerSx: SxProps = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    minHeight: 0,
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
    },
}

// Phones: one flow from the chevron to the last action, wrapped as the width allows; the lead and
// actions boxes dissolve into it.
const phoneActionsRowSx = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
}

const actionsRowSx: SxProps = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    py: '6px',
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
        columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: phoneActionsRowSx,
}

// Collapsed rows, or none at all: the actions go right after the chevron and the count.
const compactActionsRowSx: SxProps = {
    gridColumn: '1 / -1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '16px',
    rowGap: '8px',
    py: '6px',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: phoneActionsRowSx,
}

const actionsLeadSx: SxProps = {
    gridColumn: 1,
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        display: 'contents',
    },
}

const actionsSx: SxProps = {
    gridColumn: 3,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        display: 'contents',
    },
}



/**
 * Фильтрует список критериев в соответствии с доступностью, предоставленной настройками по умолчанию.
 * @param defaults Значения по умолчанию из {@link SearchUIDefaultsContext}.
 * @param criteria Критерии, которые требуется проверить.
 * @returns Подмножество критериев, доступных пользователю.
 */
export const filterAvailableCriteria = (
    defaults: SearchUIDefaults,
    criteria: CriterionTypeEnum[] | undefined
): CriterionTypeEnum[] => {
    const visibilityFlags: Partial<Record<CriterionTypeEnum, boolean>> = {
        [CriterionTypeEnum.PROJECT_CURRENCY]: defaults.showProjectCurrencyCriterion(),
        [CriterionTypeEnum.PROCESSOR]: defaults.showProcessorsCriterion(),
        [CriterionTypeEnum.GATE]: defaults.showGatesCriterion(),
        [CriterionTypeEnum.PROJECT]: defaults.showProjectsCriterion(),
        [CriterionTypeEnum.ENDPOINT]: defaults.showEndpointsCriterion(),
        [CriterionTypeEnum.MERCHANT]: defaults.showMerchantsCriterion(),
        [CriterionTypeEnum.MANAGER]: defaults.showManagersCriterion(),
        [CriterionTypeEnum.RESELLER]: defaults.showResellersCriterion(),
        [CriterionTypeEnum.DEALER]: defaults.showDealersCriterion(),
        [CriterionTypeEnum.COMPANY]: defaults.showCompaniesCriterion(),
        // [CriterionTypeEnum.SUPE]: defaults.showSuperiorsCriterion(),
        // [CriterionTypeEnum.X]: defaults.showFormPaymentTemplatesCriterion(),
        // [CriterionTypeEnum.X]: defaults.showFormFinishTemplatesCriterion(),
        // [CriterionTypeEnum.X]: defaults.showFormWaitTemplatesCriterion(),
        // [CriterionTypeEnum.X]: defaults.showFormPayment3dsTemplatesCriterion(),
    }

    const visibleCriteria = (criteria || []).filter(c => visibilityFlags[c] !== false)
    const customerLevelDependenciesAvailable = visibleCriteria.includes(CriterionTypeEnum.MERCHANT)
        && visibleCriteria.includes(CriterionTypeEnum.CURRENCY)

    return visibleCriteria.filter(criterion => (
        criterion !== CriterionTypeEnum.CUSTOMER_LEVEL || customerLevelDependenciesAvailable
    ))
}
