import React, {useContext, useEffect, useState} from 'react';
import {
    Box,
    Divider,
    FormControlLabel,
    IconButton,
    Link,
    SxProps,
    Tooltip,
    tooltipClasses,
    TooltipProps,
    Zoom
} from '@mui/material';
import {LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../filters/types';
import {styled} from '@mui/material/styles';
import {useTranslation} from 'react-i18next';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {AbstractEntity, PneButton, PneButtonGroup, PneCheckbox, PneTextField} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";
import {useMultigetSelectStore} from "./state/store";
// import {usePaynetTheme} from '../../../../theme/usePaynetTheme'; //TODO migration
// import {raiseUIError} from '../../../../error'; //TODO migration

type Props = {
    multigetCriterion: MultigetCriterion
    linkedMultigetCriteria: MultigetCriterion[]
    onSave: (criterion: MultigetCriterion) => void
    onCancel: () => void
}

export const MultigetSelect = (props: Props) => {
    const PAGE_SIZE = 10;
    const {
        multigetCriterion,
        linkedMultigetCriteria,
        onSave,
        onCancel,
    } = props;
    const {t} = useTranslation()
    // const theme = usePaynetTheme()
    // const [searchStrings, setSearchStrings] = useState<string[]>(multigetCriterion.searchString.split(','))
    // const [currentSearchString, setCurrentSearchString] = useState<string>('')
    const [startRow, setStartRow] = useState<number>(0);
    const [hasNext, setHasNext] = useState<boolean>(false);
    // const [entities, setEntities] = useState<AbstractEntity[]>([]);
    // const [selected, setSelected] = useState<AbstractEntity[]>(parseInitialSelectedEntities(multigetCriterion));
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
        availableItems,
        setAvailableItems,
        selectedItems,
        setSelectedItems,
    } = useMultigetSelectStore((store) => ({
        filterType: store.filterType,
        setFilterType: store.setFilterType,
        onlyEnabledStatus: store.onlyEnabledStatus,
        setOnlyEnabledStatus: store.setOnlyEnabledStatus,
        searchString: store.searchString,
        setSearchString: store.setSearchString,
        searchLabel: store.searchLabel,
        setSearchLabel: store.setSearchLabel,
        availableItems: store.availableItems,
        setAvailableItems: store.setAvailableItems,
        selectedItems: store.selectedItems,
        setSelectedItems: store.setSelectedItems,
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
            searchString: searchLabel ? (searchLabel + ':' + searchString) : searchString,
            status: onlyEnabledStatus ? 'E' : null,
            startRow: startRow,
            numRows: PAGE_SIZE,
            criteria: linkedMultigetCriteria,
        })
            .then(entities => {
                setAvailableItems(entities);
                setHasNext(entities.length > PAGE_SIZE);
            })
            // .catch(raiseUIError);
            .catch(console.error)
    }, [
        searchString,
        searchLabel,
        filterType,
        startRow,
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

    const onEntityClick = (entity: AbstractEntity) => {
        if (!selectedItems.some(e => +e.id === +entity.id)) {
            setSelectedItems([...selectedItems, entity])
        } else {
            setSelectedItems([...selectedItems.filter(e => +e.id !== +entity.id)])
        }
    }

    const onSelectedClick = (entity: AbstractEntity) => {
        setSelectedItems([...selectedItems.filter(e => +e.id !== +entity.id)])
    }

    const onSaveClick = () => {
        onSave(getCurrentMultigetCriterion());
    }

    const onCancelClick = () => {
        onCancel();
    }

    // const onSearchStringClick = (str: string) => {
    //     setSearchStrings([...searchStrings.filter(s => s !== str)]);
    // }

    const onExcludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.ALL)
    }

    const onIncludeClick = () => {
        setSelectedItems([])
        setFilterType(MultichoiceFilterTypeEnum.NONE)
    }

    const onPrevPageClick = () => {
        const prevPageStart = startRow - PAGE_SIZE;
        if (prevPageStart >= 0) {
            setStartRow(startRow - PAGE_SIZE);
        }
    }

    const onNextPageClick = () => {
        if (hasNext) {
            setStartRow(startRow + PAGE_SIZE);
        }
    }

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchString(event.target.value);
    }

    const handleSelectedChange = (
        mappedList: AbstractEntity[],
        unMappedList: AbstractEntity[]
    ) => {
        setSelectedItems(mappedList);
    }

    const shownSearchStrings = /*searchStrings.filter(s => s.length > 0)*/searchString

    const getLinkSx = (selected: boolean): SxProps => {
        return {
            padding: '5px',
            // ...(selected ? { //TODO migration
            //     backgroundColor: theme.skin.experimentalColor,
            //     color: theme.color.textContrast,
            //     textDecorationColor: theme.color.textContrast,
            // } : undefined)
        }
    }

    const allSelected = filterType === MultichoiceFilterTypeEnum.ALL
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
            <Divider/>
            <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <PneButtonGroup>
                    <PneButton
                        onClick={onIncludeClick}
                        color={'pneNeutral'}
                    >{'Include'}</PneButton>
                    <PneButton
                        onClick={onExcludeClick}
                        color={'pneNeutral'}
                    >{t('Exclude')}</PneButton>
                </PneButtonGroup>
                <FormControlLabel
                    label={'Only enabled status'}
                    control={<PneCheckbox
                        checked={onlyEnabledStatus}
                        onChange={e => setOnlyEnabledStatus(e.target.checked)}
                    />}
                />
            </Box>
            <Divider/>
            <Box sx={{display: 'flex', flexDirection: 'row',  columnGap: '16px'}}>
                <PneTextField
                    value={searchString}
                    onChange={onSearchChange}
                    label={'Search'}
                    fullWidth
                />
                <PneButtonGroup>
                    <PneButton
                        onClick={() => setSearchLabel('all')}
                        color={'pneNeutral'}
                    >{t('All')}</PneButton>
                    <PneButton
                        onClick={() => setSearchLabel('mid')}
                        color={'pneNeutral'}
                    >{'MID'}</PneButton>
                    <PneButton
                        onClick={() => setSearchLabel('description')}
                        color={'pneNeutral'}
                    >{'Description'}</PneButton>
                </PneButtonGroup>
            </Box>
            <Divider/>
            <Divider/>
        </Box>
        <Container>
            <Left>
                <LeftTop>
                    <Controls>
                        <Paging>
                            <Link
                                sx={getLinkSx(false)}
                                component={'button'}
                                onClick={onPrevPageClick}
                            >{'< prev'}</Link>
                            <PagingLabel>{`${startRow + 1} - ${startRow + PAGE_SIZE}`}</PagingLabel>
                            <Link
                                sx={getLinkSx(false)}
                                component={'button'}
                                onClick={onNextPageClick}
                            >{'next >'}</Link>
                        </Paging>
                    </Controls>
                    {statusMakesSense && <Controls>
                        <FormControlLabel
                            label={t('react.searchUI.onlyEnabledStatus')}
                            control={<PneCheckbox
                                checked={onlyEnabledStatus}
                                onChange={e => setOnlyEnabledStatus(e.target.checked)}
                            />}
                        />
                    </Controls>}
                </LeftTop>
                {availableItems.slice(0, PAGE_SIZE).map((entity, index) => {
                    const rowSelected = selectedItems.some(e => +e.id === +entity.id);
                    return <Row
                        selected={allSelected ? !rowSelected : rowSelected}
                        key={index}
                        onClick={() => onEntityClick(entity)}
                        title={entity.displayName}
                    >
                        {entity.displayName}
                    </Row>
                })}
            </Left>
            <Right>
                {selectedItems.map((entity, index) =>
                    <Row
                        selected={!allSelected}
                        key={index}
                        onClick={() => onSelectedClick(entity)}
                        title={entity.displayName}
                    >
                        {entity.displayName}
                    </Row>
                )}
            </Right>
        </Container>
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
            <HtmlTooltip
                placement={'right-end'}
                title={
                    <div dangerouslySetInnerHTML={{__html: t('react.searchUI.multigetTooltip')}}/>
                }
            >
                <IconButton color="primary" component="span">
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
    let selectedIds: string[];
    let selectedNames: string[];
    if (multigetCriterion.filterType === MultichoiceFilterTypeEnum.ALL) {
        selectedIds = multigetCriterion.deselectedItems.split(',');
        selectedNames = multigetCriterion.deselectedItemNames.split(',');
    } else {
        selectedIds = multigetCriterion.selectedItems.split(',');
        selectedNames = multigetCriterion.selectedItemNames.split(',');
    }
    const entities: AbstractEntity[] = [];

    for (let i = 0; i < selectedIds.length; i++) {
        if (selectedIds[i]) {
            entities.push({
                id: parseInt(selectedIds[i]),
                displayName: selectedNames[i]
            })
        }
    }
    return entities;
}

const Container = styled('div')`
    display: flex;
    flex-direction: row;
    margin-bottom: 16px;
    min-height: 300px;
    border-bottom: 1px solid #F1F5FA;
`

const Left = styled('div')`
    display: flex;
    flex-direction: column;
    width: calc(50% - 1px);
    border-right: 1px solid #F1F5FA;
`

const LeftTop = styled('div')`
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #F1F5FA;
`

const Controls = styled('div')`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 5px;
    padding-right: 16px;
`

const FlexRow = styled('div')`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
`

const Paging = styled('div')`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const PagingLabel = styled('span')`
`

const Right = styled('div')`
    display: flex;
    flex-direction: column;
    width: calc(50% - 0px);
`

const Row = styled('p')<{ selected?: boolean }>`
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    line-height: 20px;
    font-weight: ${p => p.selected ? 'bold' : 'normal'};
    color: #38434D;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    // TODO migration

    &:hover {
        background-color: ${p => '#F9F7F8'};
        color: ${p => '#151515'};
    }
`;
// background-color: ${p => p.theme.skin.menuItemHoverBackgroundColor};
// color: ${p => p.theme.skin.menuItemHoverTextColor};

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
