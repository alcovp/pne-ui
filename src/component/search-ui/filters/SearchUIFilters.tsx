import React, {useContext, useEffect, useState} from 'react';
import {SearchUIFiltersHeaderRight} from './styled';
import {CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions} from './types';
import SearchUITemplatesMenu from './component/template/SearchUITemplatesMenu';
import {useTranslation} from 'react-i18next';
import {useSearchUIStore} from './state/store';
import {Box, Chip, IconButton, SxProps} from '@mui/material';
import {ExpandMore} from '@mui/icons-material';
import SearchUIAddFilter from './component/select/SearchUIAddFilter';
import {CriterionContainer} from './CriterionContainer';
import {PneButton, SearchUIDefaults} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";

export type SearchUIFiltersConfig = {
    conflictingCriteriaGroups?: CriterionTypeEnum[][]
    removablePredefinedCriteria?: CriterionTypeEnum[]
    hideTemplatesSelect?: boolean
}

type Props = {
    settingsContextName: string
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria?: CriterionTypeEnum[]
    exactSearchLabels?: ExactCriterionSearchLabelEnum[]
    initialSearchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
    onFiltersUpdate: (searchCriteria: SearchCriteria) => void
    config?: SearchUIFiltersConfig
}

export const SearchUIFilters = (props: Props) => {
    const {t} = useTranslation();
    const {
        settingsContextName,
        possibleCriteria = [],
        predefinedCriteria = [],
        exactSearchLabels = [],
        initialSearchConditions,
        config,
        onFiltersUpdate,
    } = props

    const defaults = useContext(SearchUIDefaultsContext)

    const adjustedPossibleCriteria = filterAvailableCriteria(defaults, [
        ...new Set([
            ...possibleCriteria,
            ...predefinedCriteria
        ])
    ])

    const {
        setInitialState,
        loadTemplates,
        criteria,
        clearCriteria,
        addCriterion,
        conflictingCriteriaGroups,
        hideTemplatesSelect,
    } = useSearchUIStore((store) => ({
        setInitialState: store.setInitialState,
        loadTemplates: store.loadTemplates,
        criteria: store.criteria,
        clearCriteria: store.clearCriteria,
        addCriterion: store.addCriterion,
        conflictingCriteriaGroups: store.config?.conflictingCriteriaGroups,
        hideTemplatesSelect: store.config?.hideTemplatesSelect,
    }))

    const [showFilters, setShowFilters] = useState(true)

    useEffect(() => {
        setInitialState({
            defaults: defaults,
            settingsContextName: settingsContextName,
            possibleCriteria: adjustedPossibleCriteria,
            predefinedCriteria: predefinedCriteria,
            exactSearchLabels: exactSearchLabels,
            criteria: predefinedCriteria,
            config: config,
            onFiltersUpdate: onFiltersUpdate,
            ...initialSearchConditions
        })
    }, [
        initialSearchConditions?.exactSearchLabel,
        initialSearchConditions?.exactSearchValue,
        initialSearchConditions?.status,
        initialSearchConditions?.threeD,
        initialSearchConditions?.currencies,
        initialSearchConditions?.dateRangeSpec,
        initialSearchConditions?.cardTypes,
        initialSearchConditions?.transactionTypes,
        initialSearchConditions?.projectCurrency,
        initialSearchConditions?.grouping,
        initialSearchConditions?.multigetCriteria?.length,
    ])

    useEffect(() => {
        loadTemplates()
    }, [])

    const someCriteriaAdded = criteria.length > 0
    const showFiltersCountChip = someCriteriaAdded && !showFilters
    const nothingToClear = criteria.every(criterion => predefinedCriteria.includes(criterion))
    const criteriaOptions = adjustedPossibleCriteria
        .filter(criterion => !criteria.includes(criterion))
        .filter(possibleC => {
            let show = true
            conflictingCriteriaGroups?.forEach(group => {
                if (group.includes(possibleC) && group.some(conflictingC => criteria.includes(conflictingC))) {
                    show = false
                }
            })
            return show
        })
    const allCriteriaAdded = criteriaOptions.length === 0

    return <Box sx={{px: '16px'}}>
        <Box sx={headerSx}>
            <IconButton
                onClick={() => setShowFilters(prev => !prev)}
                size={'small'}
                color={'pneTransparent'}
            >
                <ExpandMore
                    fontSize={'small'}
                    sx={{transform: showFilters ? 'rotate(180deg)' : 'rotate(-90deg)'}}
                />
            </IconButton>
            <Box sx={titleSx} component={'span'}>{t('react.searchUI.filters')}</Box>
            {showFiltersCountChip ? <Chip
                size={'small'}
                color={'primary'}
                variant={'outlined'}
                label={criteria.length}
            /> : null}
            <SearchUIFiltersHeaderRight>
                {hideTemplatesSelect ? null : <SearchUITemplatesMenu/>}
                {allCriteriaAdded ? null : <SearchUIAddFilter
                    options={criteriaOptions}
                    onChange={criterion => {
                        setShowFilters(true)
                        addCriterion(criterion)
                    }}
                />}
                {nothingToClear ? null : <PneButton onClick={clearCriteria} color={'pneNeutral'} size={'small'}>
                    {t('clear.all')}
                </PneButton>}
            </SearchUIFiltersHeaderRight>
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
}

const filterAvailableCriteria = (
    defaults: SearchUIDefaults,
    criteria: CriterionTypeEnum[] | undefined
): CriterionTypeEnum[] => {
    let filteredCriteria: CriterionTypeEnum[] = [...criteria || []]
    if (!defaults.showProjectCurrencyCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.PROJECT_CURRENCY)
    }
    if (!defaults.showProcessorsCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.PROCESSOR)
    }
    if (!defaults.showGatesCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.GATE)
    }
    if (!defaults.showProjectsCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.PROJECT)
    }
    if (!defaults.showEndpointsCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.ENDPOINT)
    }
    if (!defaults.showMerchantsCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.MERCHANT)
    }
    if (!defaults.showManagersCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.MANAGER)
    }
    if (!defaults.showResellersCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.RESELLER)
    }
    // if (!defaults.showSuperiorsCriterion()) {
    //     filteredCriteria = filteredCriteria
    //         .filter(c => c !== CriterionTypeEnum.SUPE)
    // }
    if (!defaults.showDealersCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.DEALER)
    }
    if (!defaults.showCompaniesCriterion()) {
        filteredCriteria = filteredCriteria
            .filter(c => c !== CriterionTypeEnum.COMPANY)
    }
    // if (!defaults.showFormPaymentTemplatesCriterion()) {
    //     filteredCriteria = filteredCriteria
    //         .filter(c => c !== CriterionTypeEnum.)
    // }
    // if (!defaults.showFormFinishTemplatesCriterion()) {
    //     filteredCriteria = filteredCriteria
    //         .filter(c => c !== CriterionTypeEnum.)
    // }
    // if (!defaults.showFormWaitTemplatesCriterion()) {
    //     filteredCriteria = filteredCriteria
    //         .filter(c => c !== CriterionTypeEnum.)
    // }
    // if (!defaults.showFormPayment3dsTemplatesCriterion()) {
    //     filteredCriteria = filteredCriteria
    //         .filter(c => c !== CriterionTypeEnum.)
    // }

    return filteredCriteria
}
