import React, {useContext, useEffect, useState} from 'react';
import {SearchUIFiltersHeaderRight} from './styled';
import {CriterionTypeEnum, ExactCriterionSearchLabelEnum, SearchCriteria, SearchUIConditions} from './types';
import SearchUITemplatesMenu from './component/template/SearchUITemplatesMenu';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from './state/store';
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
    hideShowFiltersButton?: boolean
}

type Props = {
    settingsContextName: string
    possibleCriteria: CriterionTypeEnum[]
    predefinedCriteria?: CriterionTypeEnum[]
    exactSearchLabels?: ExactCriterionSearchLabelEnum[]
    initialSearchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
    searchConditions?: Partial<Omit<SearchUIConditions, 'criteria'>>
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
        searchConditions,
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

    const setInitialState = useSearchUIFiltersStore(s => s.setInitialState)
    const loadTemplates = useSearchUIFiltersStore(s => s.loadTemplates)
    const criteria = useSearchUIFiltersStore(s => s.criteria)
    const clearCriteria = useSearchUIFiltersStore(s => s.clearCriteria)
    const addCriterion = useSearchUIFiltersStore(s => s.addCriterion)
    const conflictingCriteriaGroups = useSearchUIFiltersStore(s => s.config?.conflictingCriteriaGroups)
    const hideTemplatesSelect = useSearchUIFiltersStore(s => s.config?.hideTemplatesSelect)
    const hideShowFiltersButton = useSearchUIFiltersStore(s => s.config?.hideShowFiltersButton)
    const exactSearchLabel = useSearchUIFiltersStore(s => s.exactSearchLabel)
    const updateConditions = useSearchUIFiltersStore(s => s.updateConditions)

    const [showFilters, setShowFilters] = useState(true)

    useEffect(() => {
        setInitialState({
            defaults: defaults,
            settingsContextName: settingsContextName,
            possibleCriteria: adjustedPossibleCriteria,
            predefinedCriteria: predefinedCriteria,
            exactSearchLabels: exactSearchLabels,
            exactSearchLabel: exactSearchLabel || exactSearchLabels[0],
            criteria: predefinedCriteria,
            config: config,
            onFiltersUpdate: onFiltersUpdate,
            ...initialSearchConditions
        })
    }, [])

    useEffect(() => {
        loadTemplates()
    }, [])

    useEffect(() => {
        if (searchConditions) {
            updateConditions(searchConditions)
        }
    }, [searchConditions])

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
            {hideShowFiltersButton ? null : <IconButton
                onClick={() => setShowFilters(prev => !prev)}
                size={'small'}
                color={'primary'}
            >
                <ExpandMore
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

    return (criteria || []).filter(c => visibilityFlags[c] !== false)
}
