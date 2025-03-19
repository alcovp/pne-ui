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
    MultigetCriterion, OrderSearchLabel,
    SearchCriteria,
    SearchUITemplate,
    StatusCriterion,
    ThreeDCriterionEnum,
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

const LAST_TEMPLATE_NAME = 'last_template_name'

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
        localStorage.removeItem(LAST_TEMPLATE_NAME + get().settingsContextName)

        set((draft) => {
            return {
                ...draft,
                ...getSearchUIInitialSearchCriteria(draft.defaults),
                exactSearchLabel: draft.exactSearchLabels[0],
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
                localStorage.setItem(LAST_TEMPLATE_NAME + get().settingsContextName, template.name)

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
                const lastTemplateName = localStorage.getItem(LAST_TEMPLATE_NAME + get().settingsContextName)
                if (lastTemplateName && lastTemplateName === template.name) {
                    localStorage.removeItem(LAST_TEMPLATE_NAME + get().settingsContextName)
                }

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

        localStorage.setItem(LAST_TEMPLATE_NAME + get().settingsContextName, template.name)

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

                const lastTemplateName = localStorage.getItem(LAST_TEMPLATE_NAME + get().settingsContextName)
                const lastTemplate = templates.find(t => t.name === lastTemplateName)
                if (lastTemplate) {
                    get().setTemplate(lastTemplate)
                }
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
    setOrderSearchCriterionLabel: searchLabel => {
        const oldLabel = get().ordersSearchLabel
        set((draft) => {
            draft.ordersSearchLabel = searchLabel
        })

        // если выбран новый по типу search label, то сбрасываем значение
        if (OrdersSearchLabelsConfig[oldLabel].type !== OrdersSearchLabelsConfig[searchLabel].type) {
            set((draft) => {
                draft.ordersSearchValue = ''
            })
        }
        checkIfFiltersChanged(set, get)
    },
    setOrderSearchCriterionValue: searchValue => {
        set((draft) => {
            draft.ordersSearchValue = searchValue
        })
        checkIfFiltersChanged(set, get)
    },
    setCurrenciesCriterion: (currencies: AbstractEntityAllableCollection) => {
        set((draft) => {
            draft.currencies = currencies
        })
        checkIfFiltersChanged(set, get)
    },
    setDateRangeCriterionOrderDateType: orderDateType => {
        set((draft) => {
            draft.orderDateType = orderDateType
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
        case CriterionTypeEnum.ORDERS_SEARCH:
        case CriterionTypeEnum.STATUS:
        case CriterionTypeEnum.THREE_D:
        case CriterionTypeEnum.DATE_RANGE:
        case CriterionTypeEnum.DATE_RANGE_ORDERS:
        case CriterionTypeEnum.PROJECT_CURRENCY:
        case CriterionTypeEnum.CARD_TYPES:
        case CriterionTypeEnum.TRANSACTION_TYPES:
        case CriterionTypeEnum.GROUPING:
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
        case CriterionTypeEnum.EXACT:
            draft.exactSearchLabel = draft.exactSearchLabels[0]
            draft.exactSearchValue = getSearchUIInitialSearchCriteria(draft.defaults).exactSearchValue
            break
        case CriterionTypeEnum.ORDERS_SEARCH:
            draft.ordersSearchLabel = 'merchant_invoice_id'
            draft.ordersSearchValue = ''
            break
        case CriterionTypeEnum.CURRENCY:
            draft.currencies = searchUIInitialAllableCollection
            break
        case CriterionTypeEnum.DATE_RANGE_ORDERS:
            draft.orderDateType = 'SESSION_STATUS_CHANGED'
            draft.dateRangeSpec = getSearchUIInitialSearchCriteria(draft.defaults).dateRangeSpec
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

    if (!allable.entities) {
        console.warn('This is weird that allable.entities is undefined')
        return []
    }

    return allable.entities.map(c => c.id);
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
        ordersSearchLabel: state.ordersSearchLabel,
        ordersSearchValue: state.ordersSearchValue,
        status: extractStatus(state.status),
        threeD: extract3D(state.threeD),
        currencies: extractEntitiesIds(state.currencies),
        dateFrom: extractDateFrom(state.dateRangeSpec),
        dateTo: extractDateTo(state.dateRangeSpec),
        orderDateType: state.orderDateType,
        cardTypes: extractEntitiesIds(state.cardTypes),
        transactionTypes: extractEntitiesIds(state.transactionTypes),
        projectCurrencyId: state.projectCurrency.currency.id,
        projectCurrencyConvert: state.projectCurrency.convertToUserCurrency,
        groupTypes: extractGroupTypes(state.grouping),
        multigetCriteria: state.multigetCriteria,
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
        ordersSearchLabel: store.ordersSearchLabel,
        ordersSearchValue: store.ordersSearchValue,
        status: store.status,
        currencies: store.currencies,
        threeD: store.threeD,
        orderDateType: store.orderDateType,
        dateRangeSpec: store.dateRangeSpec,
        projectCurrency: store.projectCurrency,
        cardTypes: store.cardTypes,
        transactionTypes: store.transactionTypes,
        grouping: store.grouping,
        recurrenceTypes: store.recurrenceTypes,
        recurrenceStatuses: store.recurrenceStatuses,
        mfoConfigurationTypes: store.mfoConfigurationTypes,
        markerTypes: store.markerTypes,
        markerStatus: store.markerStatus,
    }
})

const calculateNonExactDates = (dateRangeSpec: DateRangeSpec): DateRangeSpec => {
    const nowLocal = dayjs()
    const nowServer = dayjs().utc().tz('Europe/Moscow')

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
            from = nowLocal.startOf('day')
            to = nowLocal.startOf('day').add(1, 'day')
            break
        case 'YESTERDAY':
            from = nowLocal.startOf('day').subtract(1, 'd')
            to = nowLocal.startOf('day')
            break
        case 'THIS_WEEK':
            from = nowLocal.startOf('isoWeek')
            to = nowLocal.endOf('isoWeek').add(1, 'day').startOf('day')
            break
        case 'LAST_WEEK':
            from = nowLocal.startOf('isoWeek').subtract(1, 'week')
            to = nowLocal.endOf('isoWeek').subtract(1, 'week').add(1, 'day').startOf('day')
            break
        case 'THIS_MONTH':
            from = nowLocal.startOf('month')
            to = nowLocal.endOf('month').add(1, 'day').startOf('day')
            break
        case 'LAST_MONTH':
            from = nowLocal.startOf('month').subtract(1, 'month')
            to = nowLocal.subtract(1, 'month').endOf('month').add(1, 'day').startOf('day')
            break
        case 'DAYS_BEFORE':
            if (dateRangeSpec.beforeCount === null) {
                throw new Error('Don\'t do like this')
            }
            from = nowLocal.startOf('day').subtract(dateRangeSpec.beforeCount, 'd')
            to = nowLocal.startOf('day').add(1, 'day')
            break
        case 'HOURS_BEFORE':
            if (dateRangeSpec.beforeCount === null) {
                throw new Error('Don\'t do like this')
            }
            to = nowServer
            from = nowServer.subtract(dateRangeSpec.beforeCount, 'hour')
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

type OrderSearchInputType = {
    type: 'string' | 'integer' | 'amount' | 'ip' | 'country' | 'card6and4'
    maxLength: number
}

export const OrdersSearchLabelsConfig: Readonly<Record<OrderSearchLabel, OrderSearchInputType>> = {
    'merchant_invoice_id': {type: 'string', maxLength: 128},
    'order_id': {type: 'integer', maxLength: 10},
    'processor_order_id': {type: 'string', maxLength: 128},
    'purpose': {type: 'string', maxLength: 128},
    'transaction_amount': {type: 'amount', maxLength: 128},
    'session_token': {type: 'string', maxLength: 36},
    'customer_phone': {type: 'string', maxLength: 128},
    'customer_email': {type: 'string', maxLength: 128},
    'customer_ip': {type: 'ip', maxLength: 128},
    'customer_ip_country': {type: 'country', maxLength: 128},
    'customer_billing_country': {type: 'country', maxLength: 128},
    'customer_dna_id': {type: 'integer', maxLength: 10},
    'customer_id': {type: 'integer', maxLength: 10},
    'batch_id': {type: 'integer', maxLength: 10},
    'source_bank_name': {type: 'string', maxLength: 128},
    'source_country': {type: 'country', maxLength: 128},
    'source_from_order_id': {type: 'integer', maxLength: 10},
    'source_bin': {type: 'integer', maxLength: 6},
    'source_bin_range_from_order_id': {type: 'integer', maxLength: 10},
    'source_last4': {type: 'string', maxLength: 4},
    'source_bin_last4': {type: 'card6and4', maxLength: 128},
    'source_auth_code': {type: 'string', maxLength: 10},
    'source_arn': {type: 'string', maxLength: 64},
    'source_rrn': {type: 'string', maxLength: 20},
    'source_card_holder': {type: 'string', maxLength: 128},
    'source_card_ref_id': {type: 'integer', maxLength: 10},
    'dest_bank_name': {type: 'string', maxLength: 128},
    'dest_country': {type: 'country', maxLength: 128},
    'dest_from_order_id': {type: 'integer', maxLength: 10},
    'dest_bin': {type: 'integer', maxLength: 6},
    'dest_bin_range_from_order_id': {type: 'integer', maxLength: 10},
    'dest_last4': {type: 'string', maxLength: 4},
    'dest_bin_last': {type: 'card6and4', maxLength: 128},
    'dest_auth_code': {type: 'string', maxLength: 10},
    'dest_arn': {type: 'string', maxLength: 64},
    'dest_rrn': {type: 'string', maxLength: 20},
    'dest_card_ref_id': {type: 'integer', maxLength: 10},
    'account_number': {type: 'string', maxLength: 64},
    'routing_number': {type: 'string', maxLength: 16},
    'reader_key_serial_number': {type: 'string', maxLength: 16},
    'reader_device_serial_number': {type: 'string', maxLength: 16},
    'device_serial_number': {type: 'string', maxLength: 64},
    'phone_serial_number': {type: 'string', maxLength: 128},
    'phone_imei': {type: 'string', maxLength: 128},
    'reader_id': {type: 'string', maxLength: 128},
    'registration_info_id': {type: 'string', maxLength: 128},
    'inn': {type: 'string', maxLength: 128},
    'mtcn': {type: 'string', maxLength: 128},
    'rebill': {type: 'string', maxLength: 128},
    'swift_number': {type: 'string', maxLength: 128},
    'webmoney_account': {type: 'string', maxLength: 128},
    'yamoney_account': {type: 'string', maxLength: 128},
    'wire_account': {type: 'string', maxLength: 128},
    'card_number_hash_hash': {type: 'integer', maxLength: 10},
}