import React, {useContext, useEffect, useRef, useState} from 'react';
import {
    SearchUIFiltersHeaderActions,
    SearchUIFiltersHeaderLeft,
    SearchUIFiltersHeaderMainRow,
    SearchUIFiltersHeaderRight,
    SearchUIFiltersHeaderSearch,
} from './styled';
import {
    CUSTOMER_LEVEL_DEPENDENCIES,
    CriterionTypeEnum,
    DateRangeSpecType,
    ExactCriterionSearchLabelEnum,
    SearchCriteria,
    SearchUICriterionAvailabilityRule,
    SearchUIConditions,
} from './types';
import SearchUITemplatesMenu from './component/template/SearchUITemplatesMenu';
import {useTranslation} from 'react-i18next';
import {
    useSearchUIFiltersStore,
    useSearchUIFiltersStoreApi,
    useSearchUIFiltersStoreContext,
} from './state/store';
import {Box, Chip, IconButton, SxProps} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import isEqual from 'lodash/isEqual';
import SearchUIAddFilter from './component/select/SearchUIAddFilter';
import {CriterionContainer} from './CriterionContainer';
import {overlayActions, PneButton, SearchUIDefaults} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";
import {createClearCriteriaUndoSnapshot} from './state/undo';
import {isCriterionAvailable} from './criterionAvailability';
import type { SearchUIDateOnlyTimeZone } from './dateRangeTimeZone';
import {SearchUIFiltersStoreProvider} from './state/SearchUIFiltersStoreProvider';
import {getRetainedSearchUIState} from './state/retention';

type PendingClearCriteriaUndo = {
    snackbarId: string
    timeoutId: ReturnType<typeof setTimeout> | null
    baseline: ReturnType<typeof createClearCriteriaUndoSnapshot>
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
     * Дополнительные настройки поведения фильтра по диапазону дат.
     */
    dateRange?: DateRangeCriterionConfig
    /**
     * Включает ручной режим поиска: при изменении фильтров запрос не отправляется автоматически.
     * Кнопка в шапке панели остается видимой всегда: в ручном режиме это «Search», в автоматическом — «Refresh».
     */
    manualSearch?: boolean
}

/**
 * Свойства компонента {@link SearchUIFilters}.
 */
type Props = {
    /**
     * Имя контекста настроек, используемое для хранения пользовательских предпочтений.
     */
    settingsContextName: string
    /**
     * Полный набор критериев, доступных в фильтре.
     */
    possibleCriteria: CriterionTypeEnum[]
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
    initialSearchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
    /**
     * Внешнее состояние фильтра, синхронизируемое со стором.
     */
    searchConditions?: Partial<SearchUIConditions>
    /**
     * Колбэк, вызываемый при изменении условий поиска.
     */
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
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
export const SearchUIFilters = (props: Props) => {
    return <SearchUIFiltersStoreProvider
        key={props.settingsContextName}
        settingsContextName={props.settingsContextName}
    >
        <SearchUIFiltersContent {...props}/>
    </SearchUIFiltersStoreProvider>
}

export const SearchUIFiltersContent = (props: Props) => {
    const {t} = useTranslation();
    const {
        settingsContextName,
        possibleCriteria = [],
        predefinedCriteria = [],
        exactSearchLabels = [],
        initialSearchConditions,
        searchConditions,
        config,
        onFiltersUpdate,
        searchLoading = false,
    } = props

    const defaults = useContext(SearchUIDefaultsContext)
    const filtersStore = useSearchUIFiltersStoreApi()
    const {instanceId} = useSearchUIFiltersStoreContext()
    const hasExternalSearchConditions = searchConditions !== undefined
        && Object.keys(searchConditions).length > 0

    const adjustedPossibleCriteria = filterAvailableCriteria(defaults, [
        ...new Set([
            ...possibleCriteria,
            ...predefinedCriteria
        ])
    ])

    const setInitialState = useSearchUIFiltersStore(s => s.setInitialState)
    const loadTemplates = useSearchUIFiltersStore(s => s.loadTemplates)
    const criteria = useSearchUIFiltersStore(s => s.criteria)
    const clearCriteria = useSearchUIFiltersStore(s => s.clearCriteria)
    const restoreClearCriteriaSnapshot = useSearchUIFiltersStore(s => s.restoreClearCriteriaSnapshot)
    const addCriterion = useSearchUIFiltersStore(s => s.addCriterion)
    const conflictingCriteriaGroups = useSearchUIFiltersStore(s => s.config?.conflictingCriteriaGroups)
    const hideTemplatesSelect = useSearchUIFiltersStore(s => s.config?.hideTemplatesSelect)
    const hideShowFiltersButton = useSearchUIFiltersStore(s => s.config?.hideShowFiltersButton)
    const manualSearch = useSearchUIFiltersStore(s => s.config?.manualSearch)
    const triggerSearch = useSearchUIFiltersStore(s => s.triggerSearch)
    const updateConditions = useSearchUIFiltersStore(s => s.updateConditions)
    const filtersState = useSearchUIFiltersStore(s => s)

    const [showFilters, setShowFilters] = useState(true)
    const initializedRef = useRef(false)
    const pendingClearCriteriaUndoRef = useRef<PendingClearCriteriaUndo | null>(null)

    const clearPendingClearCriteriaUndo = (dismissSnackbar = true) => {
        const pending = pendingClearCriteriaUndoRef.current
        if (!pending) return

        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId)
        }

        if (dismissSnackbar) {
            overlayActions.removeSnackbar(pending.snackbarId)
        }

        pendingClearCriteriaUndoRef.current = null
    }

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
            skipLastTemplateAutoApply: hasExternalSearchConditions,
            ...initialSearchConditions
        }, getRetainedSearchUIState(settingsContextName, instanceId))
        loadTemplates()
        // The keyed store provider remounts this subtree when the search context changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (hasExternalSearchConditions) {
            updateConditions(searchConditions, {
                forceSearch: true,
                resetTemplate: true,
            })
        }
    }, [hasExternalSearchConditions, searchConditions, updateConditions])

    useEffect(() => {
        const unsubscribe = filtersStore.subscribe(state => {
            const pending = pendingClearCriteriaUndoRef.current
            if (!pending) return

            const currentSnapshot = createClearCriteriaUndoSnapshot(state)
            if (isEqual(currentSnapshot, pending.baseline)) {
                return
            }

            clearPendingClearCriteriaUndo()
        })

        return () => {
            clearPendingClearCriteriaUndo()
            unsubscribe()
        }
    }, [filtersStore])

    const someCriteriaAdded = criteria.length > 0
    const showFiltersCountChip = someCriteriaAdded && !showFilters
    const removablePredefinedCriteria = config?.removablePredefinedCriteria ?? []
    const nonRemovablePredefinedCriteria = predefinedCriteria.filter(
        criterion => !removablePredefinedCriteria.includes(criterion),
    )
    const nothingToClear = criteria.every(criterion => nonRemovablePredefinedCriteria.includes(criterion))
    const criteriaOptions = adjustedPossibleCriteria
        .filter(criterion => !criteria.includes(criterion))
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
    const showClearAllButton = !nothingToClear
    const showTemplatesMenu = !hideTemplatesSelect
    const showAddFilterButton = !allCriteriaAdded
    const showMainActionsRow = showClearAllButton || showTemplatesMenu || showAddFilterButton
    const handleClearCriteria = () => {
        const snapshotBeforeClear = createClearCriteriaUndoSnapshot(filtersStore.getState())

        clearPendingClearCriteriaUndo()
        clearCriteria()

        const baseline = createClearCriteriaUndoSnapshot(filtersStore.getState())
        const autoHideMs = 5000
        const snackbarId = overlayActions.showUndoSnackbar({
            message: t('react.searchUI.clearAll.cleared', {defaultValue: 'All filters cleared'}),
            undoLabel: t('react.searchUI.undo', {defaultValue: 'Undo'}),
            autoHideMs,
            onUndo: () => {
                clearPendingClearCriteriaUndo(false)
                restoreClearCriteriaSnapshot(snapshotBeforeClear)
            },
        })

        pendingClearCriteriaUndoRef.current = {
            snackbarId,
            baseline,
            timeoutId: setTimeout(() => {
                clearPendingClearCriteriaUndo(false)
            }, autoHideMs),
        }
    }

    return <Box sx={{px: '16px'}}>
        <Box sx={headerSx}>
            <Box sx={headerPrimaryRowSx}>
                {hideShowFiltersButton ? null : <IconButton
                    onClick={() => setShowFilters(prev => !prev)}
                    size={'small'}
                    color={'primary'}
                >
                    <ExpandMoreIcon
                        fontSize={'small'}
                        sx={{transform: showFilters ? 'rotate(180deg)' : 'rotate(-90deg)'}}
                    />
                </IconButton>}
                <Box sx={titleSx} component={'span'}>{t('react.searchUI.filters')}</Box>
                {showFiltersCountChip ? <Chip
                    size={'small'}
                    color={'primary'}
                    variant={'outlined'}
                    label={criteria.length}
                    sx={nowrapChipSx}
                /> : null}
            </Box>
            <SearchUIFiltersHeaderActions>
                {showMainActionsRow ? <SearchUIFiltersHeaderMainRow>
                    <SearchUIFiltersHeaderLeft>
                        {showClearAllButton ? <PneButton
                            onClick={handleClearCriteria}
                            color={'pneNeutral'}
                            size={'small'}
                            sx={nowrapButtonSx}
                        >
                            {t('clear.all')}
                        </PneButton> : null}
                    </SearchUIFiltersHeaderLeft>
                    <SearchUIFiltersHeaderRight>
                        {showTemplatesMenu ? <SearchUITemplatesMenu/> : null}
                        {showAddFilterButton ? <SearchUIAddFilter
                            options={criteriaOptions}
                            onChange={criterion => {
                                setShowFilters(true)
                                addCriterion(criterion)
                            }}
                        /> : null}
                    </SearchUIFiltersHeaderRight>
                </SearchUIFiltersHeaderMainRow> : null}
                <SearchUIFiltersHeaderSearch>
                    <PneButton
                        onClick={triggerSearch}
                        color={'primary'}
                        size={'small'}
                        variant={'contained'}
                        disabled={searchLoading}
                        sx={nowrapButtonSx}
                    >
                        {manualSearch
                            ? t('react.searchUI.search')
                            : t('react.searchUI.refresh', {defaultValue: 'Refresh'})}
                    </PneButton>
                </SearchUIFiltersHeaderSearch>
            </SearchUIFiltersHeaderActions>
        </Box>
        {showFilters ? <Box>
            {criteria.map((criterion) =>
                <CriterionContainer
                    key={criterion}
                    type={criterion}
                />
            )}
        </Box> : null}
    </Box>
}

const titleSx: SxProps = {
    display: 'flex',
    lineHeight: '32px',
    fontSize: '20px',
    fontWeight: '700',
    color: '#323745', //TODO theme это должно приходить из темы
}

const headerSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    width: '100%',
    py: '15px',
    '@media (max-width: 599px)': {
        flexDirection: 'column',
        alignItems: 'flex-start',
        rowGap: '8px',
    },
}

const headerPrimaryRowSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    flexWrap: 'nowrap',
    width: 'auto',
    '@media (max-width: 599px)': {
        width: '100%',
    },
}

const nowrapButtonSx: SxProps = {
    whiteSpace: 'nowrap',
}

const nowrapChipSx: SxProps = {
    whiteSpace: 'nowrap',
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
