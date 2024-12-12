import React, {useContext, useEffect} from 'react';
import {
    Box,
    Divider,
    FormControlLabel,
    IconButton,
    SxProps,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    tooltipClasses,
    TooltipProps,
    Zoom
} from '@mui/material';
import {LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../filters/types';
import {styled} from '@mui/material/styles';
import {useTranslation} from 'react-i18next';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {AbstractEntity, PneButton, PneCheckbox, PneTextField} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";
import {useMultigetSelectStore} from "./state/store";
import {MultigetSearchLabel} from './state/type';
import {MultigetSelectTable} from "./MultigetSelectTable";
// import {usePaynetTheme} from '../../../../theme/usePaynetTheme'; //TODO migration
// import {raiseUIError} from '../../../../error'; //TODO migration

type Props = {
    multigetCriterion: MultigetCriterion
    linkedMultigetCriteria: MultigetCriterion[]
    onSave: (criterion: MultigetCriterion) => void
    onCancel: () => void
}

export const MULTIGET_PAGE_SIZE = 10

export const MultigetSelect = (props: Props) => {
    const {
        multigetCriterion,
        linkedMultigetCriteria,
        onSave,
        onCancel,
    } = props
    const {t} = useTranslation()
    // const theme = usePaynetTheme()
    const {getMatchLinkedItems} = useContext(SearchUIDefaultsContext)

    const {
        filterType,
        setFilterType,
        onlyEnabledStatus,
        setOnlyEnabledStatus,
        searchString,
        setSearchString,
        searchLabel,
        setSearchLabel,
        setAvailableItems,
        selectedItems,
        setSelectedItems,
        currentPage,
        setHasNextPage,
    } = useMultigetSelectStore((store) => ({
        filterType: store.filterType,
        setFilterType: store.setFilterType,
        onlyEnabledStatus: store.onlyEnabledStatus,
        setOnlyEnabledStatus: store.setOnlyEnabledStatus,
        searchString: store.searchString,
        setSearchString: store.setSearchString,
        searchLabel: store.searchLabel,
        setSearchLabel: store.setSearchLabel,
        setAvailableItems: store.setAvailableItems,
        selectedItems: store.selectedItems,
        setSelectedItems: store.setSelectedItems,
        currentPage: store.currentPage,
        setHasNextPage: store.setHasNextPage,
    }))

    useEffect(() => {
        setFilterType(multigetCriterion.filterType)
    }, [multigetCriterion.filterType])

    useEffect(() => {
        setSelectedItems(parseInitialSelectedEntities(multigetCriterion))
    }, [
        multigetCriterion.filterType,
        multigetCriterion.deselectedItems,
        multigetCriterion.deselectedItemNames,
    ])

    useEffect(() => {
        getMatchLinkedItems({
            type: multigetCriterion.entityType,
            searchString: searchLabel !== 'all' ? (searchLabel + ':' + searchString) : searchString,
            status: onlyEnabledStatus ? 'E' : null,
            startRow: (currentPage - 1) * MULTIGET_PAGE_SIZE,
            numRows: MULTIGET_PAGE_SIZE,
            criteria: linkedMultigetCriteria,
        })
            .then(entities => {
                setAvailableItems(entities)
                setHasNextPage(entities.length > MULTIGET_PAGE_SIZE)
            })
            // .catch(raiseUIError);
            .catch(console.error)
    }, [
        searchString,
        searchLabel,
        filterType,
        currentPage,
        onlyEnabledStatus,
    ]);

    const getSelectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return [];
        } else {
            return selectedItems;
        }
    }

    const getDeselectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return selectedItems;
        } else {
            return [];
        }
    }

    const getCurrentMultigetCriterion = (): MultigetCriterion => {
        return {
            entityType: multigetCriterion.entityType,
            filterType: filterType,
            searchString: /*searchStrings.join(',')*/ searchString,
            selectedItems: getSelectedItemsByFilterType().map(e => e.id).join(','),
            selectedItemNames: getSelectedItemsByFilterType().map(e => e.displayName).join(','),
            deselectedItems: getDeselectedItemsByFilterType().map(e => e.id).join(','),
            deselectedItemNames: getDeselectedItemsByFilterType().map(e => e.displayName).join(','),
        }
    }

    const onSaveClick = () => {
        onSave(getCurrentMultigetCriterion());
    }

    const onCancelClick = () => {
        onCancel();
    }

    const onExcludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.ALL)
    }

    const onIncludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.NONE)
    }

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchString(event.target.value);
    }

    const showGateSearchLabels = multigetCriterion.entityType === LinkedEntityTypeEnum.GATE
    const statusMakesSense = [
        LinkedEntityTypeEnum.PROCESSOR,
        LinkedEntityTypeEnum.GATE,
        LinkedEntityTypeEnum.PROJECT,
        LinkedEntityTypeEnum.ENDPOINT,
        LinkedEntityTypeEnum.MERCHANT,
        LinkedEntityTypeEnum.RESELLER,
        LinkedEntityTypeEnum.COMPANY,
    ].some(type => type === multigetCriterion.entityType)

    return <>
        <Box sx={{display: 'flex', flexDirection: 'column', rowGap: '16px'}}>
            <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <ToggleButtonGroup
                    value={filterType}
                    exclusive
                    onChange={(e, value: MultichoiceFilterTypeEnum) => {
                        if (value === 'NONE') {
                            onIncludeClick()
                        } else {
                            onExcludeClick()
                        }
                    }}
                    size="small"
                >
                    <ToggleButton value={'NONE'} sx={toggleSx}>{t('react.searchUI.include')}</ToggleButton>
                    <ToggleButton value={'ALL'} sx={toggleSx}>{t('react.searchUI.exclude')}</ToggleButton>
                </ToggleButtonGroup>
                {statusMakesSense ? <FormControlLabel
                    label={t('react.searchUI.onlyEnabledStatus')}
                    control={<PneCheckbox
                        checked={onlyEnabledStatus}
                        onChange={e => setOnlyEnabledStatus(e.target.checked)}
                    />}
                /> : null}
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', flexDirection: 'row', columnGap: '16px'}}>
                <PneTextField
                    value={searchString}
                    onChange={onSearchChange}
                    label={'Search'}
                    fullWidth
                />
                {showGateSearchLabels ? <ToggleButtonGroup
                    value={searchLabel}
                    exclusive
                    onChange={(e, value: MultigetSearchLabel) => {
                        setSearchLabel(value)
                    }}
                    size="small"
                >
                    <ToggleButton value={'all'} sx={toggleSx}>{t('react.searchUI.all')}</ToggleButton>
                    <ToggleButton value={'mid'} sx={toggleSx}>{t('MID')}</ToggleButton>
                    <ToggleButton value={'description'} sx={toggleSx}>{t('react.searchUI.description')}</ToggleButton>
                </ToggleButtonGroup> : null}
            </Box>
            <Divider/>
            <MultigetSelectTable/>
            <Divider/>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', mt: '15px'}}>
            <HtmlTooltip
                placement={'right-end'}
                title={
                    <div dangerouslySetInnerHTML={{__html: t('react.searchUI.multigetTooltip')}}/>
                }
            >
                <IconButton color="default" component="span">
                    <InfoOutlinedIcon/>
                </IconButton>
            </HtmlTooltip>
            <Box sx={{display: 'flex', gap: '20px'}}>
                <PneButton color={'pneNeutral'} onClick={onCancelClick}>{t('cancel')}</PneButton>
                <PneButton color={'pnePrimary'} onClick={onSaveClick}>{t('save')}</PneButton>
            </Box>
        </Box>
    </>
}

const parseInitialSelectedEntities = (multigetCriterion: MultigetCriterion): AbstractEntity[] => {
    let selectedIds: string[]
    let selectedNames: string[]
    if (multigetCriterion.filterType === MultichoiceFilterTypeEnum.ALL) {
        selectedIds = multigetCriterion.deselectedItems.split(',')
        selectedNames = multigetCriterion.deselectedItemNames.split(',')
    } else {
        selectedIds = multigetCriterion.selectedItems.split(',')
        selectedNames = multigetCriterion.selectedItemNames.split(',')
    }
    const entities: AbstractEntity[] = []

    for (let i = 0; i < selectedIds.length; i++) {
        if (selectedIds[i]) {
            entities.push({
                id: parseInt(selectedIds[i]),
                displayName: selectedNames[i]
            })
        }
    }
    return entities
}

const toggleSx: SxProps = {textTransform: 'none'}

const HtmlTooltip = styled(({className, children, ...props}: TooltipProps) => (
    <Tooltip
        arrow
        TransitionComponent={Zoom}
        classes={{popper: className}}
        {...props}
    >{children}</Tooltip>
))(({theme}) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        color: '#fff',
        maxWidth: 600,
    },
    ['& h1, h2']: {
        color: '#fff',
        margin: 0,
    },
    ['& li']: {
        listStyle: 'inside',
    },
}));
