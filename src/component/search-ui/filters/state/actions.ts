import {SearchUIFiltersActions, SearchUIFiltersState, SearchUIFiltersStore} from './type';
import {
    AbstractEntity,
    AbstractEntityAllableCollection,
    exhaustiveCheck,
    Status,
    ZustandStoreGet,
    ZustandStoreImmerSet
} from '../../../..';
import {
    CriterionTypeEnum,
    DateRangeSpec,
    ExactCriterionSearchLabelEnum,
    Grouping,
    GroupingDateType,
    GroupingType,
    LinkedEntityTypeEnum,
    MarkerStatusCriterion,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    SearchCriteria,
    SearchUITemplate,
    StatusCriterion,
    ThreeDCriterionEnum,
    UserDefinedCriterionEnum
} from '../types';
import {
    getSearchUIInitialGrouping,
    getSearchUIInitialProjectCurrency,
    getSearchUIInitialSearchCriteria,
    searchUIInitialAllableCollection,
    searchUIInitialDateFrom,
    searchUIInitialDateTo
} from './initial';
import {WritableDraft} from 'immer/src/internal';
// import {raiseUIError} from '../../../../../error';
import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek'
import isEqual from 'lodash/isEqual'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)

export const getSearchUIFiltersActions = (
    set: ZustandStoreImmerSet<SearchUIFiltersStore>,
    get: ZustandStoreGet<SearchUIFiltersStore>,
): SearchUIFiltersActions => ({
    setInitialState: (state: Partial<SearchUIFiltersState> & Pick<SearchUIFiltersState, 'defaults'>) => {
        set((draft) => {
            return {
                ...draft,
                ...state,
            }
        })
        checkIfFiltersChanged(set, get)
    },
    clearCriteria: () => {
        set((draft) => {
            return {
                ...draft,
                ...getSearchUIInitialSearchCriteria(draft.defaults),
                template: null,
                criteria: draft.predefinedCriteria,
            }
        })
        checkIfFiltersChanged(set, get)
    },
    clearCriterion: (criterionType: CriterionTypeEnum) => {
        set((draft) => {
            clearCriterionReducer(draft, criterionType)
            addInitialMultigetCriterionReducer(draft, criterionType)
        })
        checkIfFiltersChanged(set, get)
    },
    addCriterion: (criterionType: CriterionTypeEnum) => {
        set((draft) => {
            draft.criteria.push(criterionType)
            addInitialMultigetCriterionReducer(draft, criterionType)
        })
        get().setJustAddedCriterion(criterionType)
        checkIfFiltersChanged(set, get)
    },
    removeCriterion: (criterionType: CriterionTypeEnum) => {
        set((draft) => {
            clearCriterionReducer(draft, criterionType)
            const index = draft.criteria.findIndex(c => c === criterionType)
            draft.criteria.splice(index, 1)
        })
        checkIfFiltersChanged(set, get)
    },
    createTemplate: (templateName: string) => {
        const template = getTemplate(templateName, get())
        get().defaults.saveSearchTemplate({
            contextName: get().settingsContextName,
            template: template,
            templateName: templateName,
        })
            .then(() => {
                set((draft) => {
                    draft.templates.push(template)
                    draft.template = template
                })
            })
            // .catch(raiseUIError)
            .catch(console.error)
    },
    updateTemplate: (templateName: string) => {
        const template = getTemplate(templateName, get())
        get().defaults.saveSearchTemplate({
            contextName: get().settingsContextName,
            template: template,
            templateName: templateName,
        })
            .then(() => {
                set((draft) => {
                    const index = draft.templates.findIndex(t => t.name === templateName)
                    draft.templates[index].searchConditions = template.searchConditions
                    draft.template = template
                })
            })
            // .catch(raiseUIError)
            .catch(console.error)
    },
    removeTemplate: (template: SearchUITemplate) => {
        get().defaults.deleteSearchTemplate({
            contextName: get().settingsContextName,
            templateName: template.name,
        })
            .then(() => {
                set((draft) => {
                    const index = draft.templates.findIndex(t => t.name === template.name)
                    draft.templates.splice(index, 1)
                    if (draft.template?.name === template.name) {
                        Object.assign(draft, getSearchUIInitialSearchCriteria(draft.defaults))
                        draft.template = null
                        draft.criteria = draft.predefinedCriteria
                    }
                })
                checkIfFiltersChanged(set, get)
            })
            // .catch(raiseUIError)
            .catch(console.error)
    },
    setTemplate: (template: SearchUITemplate) => {
        const conditions = {...template.searchConditions}

        if (conditions.dateRangeSpec.dateRangeSpecType !== 'EXACTLY') {
            conditions.dateRangeSpec = calculateNonExactDates(
                conditions.dateRangeSpec
            )
        }

        set((draft) => {
            return {
                ...draft,
                template: template,
                ...conditions,
            }
        })
        checkIfFiltersChanged(set, get)
    },
    loadTemplates: () => {
        get().defaults.getSearchTemplates(get().settingsContextName)
            .then(templates => {
                set((draft) => {
                    draft.templates = templates
                })
            })
            // .catch(raiseUIError)
            .catch(console.error)
    },
    setJustAddedCriterion: (criterionType: CriterionTypeEnum | null) => {
        set((draft) => {
            draft.justAddedCriterion = criterionType
        })
    },
    setMultigetCriterion: (criterion: MultigetCriterion) => {
        set((draft) => {
            const index = draft.multigetCriteria.findIndex(c => c.entityType === criterion.entityType)
            draft.multigetCriteria[index] = criterion
        })
        checkIfFiltersChanged(set, get)
    },
    set3DCriterion: (threeD: ThreeDCriterionEnum) => {
        set((draft) => {
            draft.threeD = threeD
        })
        checkIfFiltersChanged(set, get)
    },
    setStatusCriterion: (status: StatusCriterion) => {
        set((draft) => {
            draft.status = status
        })
        checkIfFiltersChanged(set, get)
    },
    setExactCriterionSearchLabel: (searchLabel: ExactCriterionSearchLabelEnum) => {
        set((draft) => {
            draft.exactSearchLabel = searchLabel
        })
        checkIfFiltersChanged(set, get)
    },
    setExactCriterionSearchValue: (searchValue: string) => {
        set((draft) => {
            draft.exactSearchValue = searchValue
        })
        checkIfFiltersChanged(set, get)
    },
    setCurrenciesCriterion: (currencies: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.currencies = currencies
        })
        checkIfFiltersChanged(set, get)
    },
    setDateRangeCriterion: (dateRangeSpec: DateRangeSpec) => {
        let spec = dateRangeSpec

        if (dateRangeSpec.dateRangeSpecType !== 'EXACTLY') {
            spec = calculateNonExactDates(dateRangeSpec)
        }

        set((draft) => {
            draft.dateRangeSpec = spec
        })
        checkIfFiltersChanged(set, get)
    },
    setProjectCurrencyCriterionCurrency: (currency: AbstractEntity) => {
        set((draft) => {
            draft.projectCurrency.currency = currency
        })
        checkIfFiltersChanged(set, get)
    },
    setProjectCurrencyCriterionConvertFlag: (convertToUserCurrency: boolean) => {
        set((draft) => {
            draft.projectCurrency.convertToUserCurrency = convertToUserCurrency
        })
        checkIfFiltersChanged(set, get)
    },
    setCardTypesCriterion: (cardTypes: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.cardTypes = cardTypes
        })
        checkIfFiltersChanged(set, get)
    },
    setTransactionTypesCriterion: (transactionTypes: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.transactionTypes = transactionTypes
        })
        checkIfFiltersChanged(set, get)
    },
    setGroupingCriterionDateType: (dateType: GroupingDateType) => {
        set((draft) => {
            draft.grouping.dateType = dateType
        })
        checkIfFiltersChanged(set, get)
    },
    setGroupingCriterionGroups: (available: GroupingType[], selected: GroupingType[]) => {
        set((draft) => {
            draft.grouping.availableGroupingTypes = available
            draft.grouping.selectedGroupingTypes = selected
        })
        checkIfFiltersChanged(set, get)
    },
    setUserDefinedCriterion: (userDefined: UserDefinedCriterionEnum) => {
        set((draft) => {
            draft.userDefined = userDefined
        })
        checkIfFiltersChanged(set, get)
    },
    setRecurrenceTypesCriterion: (recurrenceTypes: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.recurrenceTypes = recurrenceTypes
        })
        checkIfFiltersChanged(set, get)
    },
    setRecurrenceStatusesCriterion: (recurrenceStatuses: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.recurrenceStatuses = recurrenceStatuses
        })
        checkIfFiltersChanged(set, get)
    },
    setMfoConfigurationTypesCriterion: (mfoConfigurationTypes: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.mfoConfigurationTypes = mfoConfigurationTypes
        })
        checkIfFiltersChanged(set, get)
    },
    setMarkerTypesCriterion: (markerTypes: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.markerTypes = markerTypes
        })
        checkIfFiltersChanged(set, get)
    },
    setMarkerStatusCriterion: (status: MarkerStatusCriterion) => {
        set((draft) => {
            draft.markerStatus = status
        })
        checkIfFiltersChanged(set, get)
    },
})

const getInitialMultigetCriterion = (entityType: LinkedEntityTypeEnum): MultigetCriterion => ({
    entityType: entityType,
    filterType: MultichoiceFilterTypeEnum.NONE,
    searchString: '',
    selectedItems: '',
    selectedItemNames: '',
    deselectedItems: '',
    deselectedItemNames: '',
})

const addInitialMultigetCriterionReducer = (
    draft: WritableDraft<SearchUIFiltersStore>,
    criterionType: CriterionTypeEnum
): void => {
    switch (criterionType) {
        case CriterionTypeEnum.ENDPOINT:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.ENDPOINT))
            break
        case CriterionTypeEnum.PROJECT:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.PROJECT))
            break
        case CriterionTypeEnum.COMPANY:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.COMPANY))
            break
        case CriterionTypeEnum.GATE:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.GATE))
            break
        case CriterionTypeEnum.DEALER:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.DEALER))
            break
        case CriterionTypeEnum.MANAGER:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.MANAGER))
            break
        case CriterionTypeEnum.MERCHANT:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.MERCHANT))
            break
        case CriterionTypeEnum.PROCESSOR:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.PROCESSOR))
            break
        case CriterionTypeEnum.RESELLER:
            draft.multigetCriteria.push(getInitialMultigetCriterion(LinkedEntityTypeEnum.RESELLER))
            break
        case CriterionTypeEnum.CURRENCY:
        case CriterionTypeEnum.EXACT:
        case CriterionTypeEnum.STATUS:
        case CriterionTypeEnum.THREE_D:
        case CriterionTypeEnum.DATE_RANGE:
        case CriterionTypeEnum.PROJECT_CURRENCY:
        case CriterionTypeEnum.CARD_TYPES:
        case CriterionTypeEnum.TRANSACTION_TYPES:
        case CriterionTypeEnum.GROUPING:
        case CriterionTypeEnum.USER_DEFINED:
        case CriterionTypeEnum.RECURRENCE_TYPE:
        case CriterionTypeEnum.RECURRENCE_STATUS:
        case CriterionTypeEnum.MFO_CONFIGURATION_TYPE:
        case CriterionTypeEnum.MARKER_TYPE:
        case CriterionTypeEnum.MARKER_STATUS:
            // not multiget, so do nothing
            break
        default:
            exhaustiveCheck(criterionType)
    }
}

const clearCriterionReducer = (
    draft: WritableDraft<SearchUIFiltersStore>,
    criterionType: CriterionTypeEnum,
): void => {
    let index = -1
    switch (criterionType) {
        case CriterionTypeEnum.STATUS:
            draft.status = getSearchUIInitialSearchCriteria(draft.defaults).status
            break
        case CriterionTypeEnum.THREE_D:
            draft.threeD = getSearchUIInitialSearchCriteria(draft.defaults).threeD
            break
        case CriterionTypeEnum.USER_DEFINED:
            draft.userDefined = getSearchUIInitialSearchCriteria(draft.defaults).userDefined
            break
        case CriterionTypeEnum.EXACT:
            draft.exactSearchLabel = getSearchUIInitialSearchCriteria(draft.defaults).exactSearchLabel
            draft.exactSearchValue = getSearchUIInitialSearchCriteria(draft.defaults).exactSearchValue
            break
        case CriterionTypeEnum.CURRENCY:
            draft.currencies = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.DATE_RANGE:
            draft.dateRangeSpec = getSearchUIInitialSearchCriteria(draft.defaults).dateRangeSpec
            break
        case CriterionTypeEnum.PROJECT:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.PROJECT)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.ENDPOINT:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.ENDPOINT)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.GATE:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.GATE)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.PROCESSOR:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.PROCESSOR)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.COMPANY:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.COMPANY)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.MANAGER:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.MANAGER)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.MERCHANT:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.MERCHANT)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.RESELLER:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.RESELLER)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.DEALER:
            index = draft.multigetCriteria.findIndex(c => c.entityType === LinkedEntityTypeEnum.DEALER)
            draft.multigetCriteria.splice(index, 1)
            break
        case CriterionTypeEnum.PROJECT_CURRENCY:
            draft.projectCurrency = getSearchUIInitialProjectCurrency(draft.defaults)
            break
        case CriterionTypeEnum.CARD_TYPES:
            draft.cardTypes = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.TRANSACTION_TYPES:
            draft.transactionTypes = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.GROUPING:
            draft.grouping = getSearchUIInitialGrouping(draft.defaults)
            break
        case CriterionTypeEnum.RECURRENCE_TYPE:
            draft.recurrenceTypes = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.RECURRENCE_STATUS:
            draft.recurrenceStatuses = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.MFO_CONFIGURATION_TYPE:
            draft.mfoConfigurationTypes = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.MARKER_TYPE:
            draft.markerTypes = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.MARKER_STATUS:
            draft.markerStatus = getSearchUIInitialSearchCriteria(draft.defaults).markerStatus
            break
        default:
            exhaustiveCheck(criterionType)
            throw new Error('Unknown criterion type: ' + criterionType);
    }
}

const extractStatus = (status: StatusCriterion): Status | null => {
    if (status === 'ENABLED') {
        return 'E';
    }
    if (status === 'DISABLED') {
        return 'D';
    }
    return null;
}

const extractMarkerStatus = (status: MarkerStatusCriterion): MarkerStatusCriterion | null => {
    if (status === 'any') {
        return null
    }
    return status
}

const extract3D = (threeD: ThreeDCriterionEnum): boolean | null => {
    if (threeD === ThreeDCriterionEnum.YES) {
        return true;
    }
    if (threeD === ThreeDCriterionEnum.NO) {
        return false;
    }
    return null;
}

const extractExactSearchLabel = (label: ExactCriterionSearchLabelEnum | undefined): string | null => {
    if (label === ExactCriterionSearchLabelEnum.ALL || label === undefined) {
        return null
    }
    return label
}

const extractEntitiesIds = (allable: AbstractEntityAllableCollection): number[] => {
    if (allable.all) {
        return []
    }

    if (!allable.list) {
        console.warn('This is weird that allable.list is undefined')
        return []
    }

    return allable.list.map(c => c.id);
}

const extractGroupTypes = (grouping: Grouping): GroupingType[] => {
    const groups = [...grouping.selectedGroupingTypes]

    const dateGroupIndex = groups.indexOf('DATE')
    if (~dateGroupIndex) {
        groups[dateGroupIndex] = grouping.dateType
    }

    return groups
}

const extractDateFrom = (dateRangeSpec: DateRangeSpec): Date | null => {
    if (dateRangeSpec.dateRangeSpecType === 'DATE_INDEPENDENT') {
        return dayjs().year(2000).toDate()
    } else {
        return dateRangeSpec.dateFrom
    }
}

const extractDateTo = (dateRangeSpec: DateRangeSpec): Date | null => {
    if (dateRangeSpec.dateRangeSpecType === 'DATE_INDEPENDENT') {
        return dayjs().year(2999).toDate()
    } else if (dateRangeSpec.dateRangeSpecType === 'EXACTLY') {
        return dayjs(dateRangeSpec.dateTo)
            .startOf('day')
            .add(1, 'd')
            .toDate()
    } else {
        return dateRangeSpec.dateTo
    }
}

const checkIfFiltersChanged = (
    set: ZustandStoreImmerSet<SearchUIFiltersStore>,
    get: ZustandStoreGet<SearchUIFiltersStore>,
) => {
    const currentSearchCriteria = extractSearchCriteriaFromState(get())

    if (!isEqual(get().prevSearchCriteria, currentSearchCriteria)) {
        get().onFiltersUpdate(currentSearchCriteria)
        set((draft) => {
            draft.prevSearchCriteria = currentSearchCriteria
        })
    }
} 

const extractSearchCriteriaFromState = (state: SearchUIFiltersState): SearchCriteria => {
    return {
        initialized: true,
        exactSearchLabel: extractExactSearchLabel(state.exactSearchLabel),
        exactSearchValue: state.exactSearchValue,
        status: extractStatus(state.status),
        threeD: extract3D(state.threeD),
        currencies: extractEntitiesIds(state.currencies),
        dateFrom: extractDateFrom(state.dateRangeSpec),
        dateTo: extractDateTo(state.dateRangeSpec),
        cardTypes: extractEntitiesIds(state.cardTypes),
        transactionTypes: extractEntitiesIds(state.transactionTypes),
        projectCurrencyId: state.projectCurrency.currency.id,
        projectCurrencyConvert: state.projectCurrency.convertToUserCurrency,
        groupTypes: extractGroupTypes(state.grouping),
        multigetCriteria: state.multigetCriteria,
        userDefined: state.userDefined,
        recurrenceTypes: extractEntitiesIds(state.recurrenceTypes),
        recurrenceStatuses: extractEntitiesIds(state.recurrenceStatuses),
        mfoConfigurationTypes: extractEntitiesIds(state.mfoConfigurationTypes),
        markerTypes: extractEntitiesIds(state.markerTypes),
        markerStatus: extractMarkerStatus(state.markerStatus),
    }
}

const getTemplate = (templateName: string, store: SearchUIFiltersStore): SearchUITemplate => ({
    name: templateName,
    searchConditions: {
        criteria: store.criteria,
        multigetCriteria: store.multigetCriteria,
        exactSearchLabel: store.exactSearchLabel,
        exactSearchValue: store.exactSearchValue,
        status: store.status,
        currencies: store.currencies,
        threeD: store.threeD,
        dateRangeSpec: store.dateRangeSpec,
        projectCurrency: store.projectCurrency,
        cardTypes: store.cardTypes,
        transactionTypes: store.transactionTypes,
        grouping: store.grouping,
        userDefined: store.userDefined,
        recurrenceTypes: store.recurrenceTypes,
        recurrenceStatuses: store.recurrenceStatuses,
        mfoConfigurationTypes: store.mfoConfigurationTypes,
        markerTypes: store.markerTypes,
        markerStatus: store.markerStatus,
    }
})

const calculateNonExactDates = (dateRangeSpec: DateRangeSpec): DateRangeSpec => {
    const now = dayjs()
    let from: Dayjs = dateRangeSpec.dateFrom ? dayjs(dateRangeSpec.dateFrom)
        : dayjs(searchUIInitialDateFrom)
    let to: Dayjs = dateRangeSpec.dateTo ? dayjs(dateRangeSpec.dateTo)
        : dayjs(searchUIInitialDateTo)

    // endOf мы тут используем только при работе с месяцами или неделями. в случае дня, бд не различает начало и конец
    // поэтом указываем начало следующего дня
    switch (dateRangeSpec.dateRangeSpecType) {
        case 'EXACTLY':
            throw new Error('Don\'t do like this')
        case 'DATE_INDEPENDENT':
            break
        case 'TODAY':
            from = now.startOf('day')
            to = now.startOf('day').add(1, 'day')
            break
        case 'YESTERDAY':
            from = now.startOf('day').subtract(1, 'd')
            to = now.startOf('day')
            break
        case 'THIS_WEEK':
            from = now.startOf('isoWeek')
            to = now.endOf('isoWeek').add(1, 'day')
            break
        case 'LAST_WEEK':
            from = now.startOf('isoWeek').subtract(1, 'week')
            to = now.endOf('isoWeek').subtract(1, 'week').add(1, 'day')
            break
        case 'THIS_MONTH':
            from = now.startOf('month')
            to = now.endOf('month').add(1, 'day')
            break
        case 'LAST_MONTH':
            from = now.startOf('month').subtract(1, 'month')
            to = now.subtract(1, 'month').endOf('month').add(1, 'day')
            break
        case 'DAYS_BEFORE':
            if (dateRangeSpec.beforeCount === null) {
                throw new Error('Don\'t do like this')
            }
            from = now.startOf('day').subtract(dateRangeSpec.beforeCount, 'd')
            to = now.startOf('day').add(1, 'day')
            break
        case 'HOURS_BEFORE':
            if (dateRangeSpec.beforeCount === null) {
                throw new Error('Don\'t do like this')
            }
            to = now
            from = now.subtract(dateRangeSpec.beforeCount, 'hour')
            break
        default:
            exhaustiveCheck(dateRangeSpec.dateRangeSpecType)
    }

    return {
        dateRangeSpecType: dateRangeSpec.dateRangeSpecType,
        dateFrom: from.tz('Europe/Moscow', true).toDate(),
        dateTo: to.tz('Europe/Moscow', true).toDate(),
        beforeCount: dateRangeSpec.beforeCount
    }
}