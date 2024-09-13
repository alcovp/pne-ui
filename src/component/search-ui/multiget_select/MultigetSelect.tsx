import React, {useContext, useEffect, useState} from 'react';
import {
    Box,
    Chip,
    FormControlLabel,
    IconButton,
    Link,
    SxProps,
    Tooltip,
    tooltipClasses,
    TooltipProps,
    Zoom
} from '@mui/material';
import {MultigetCriterion, LinkedEntityTypeEnum, MultichoiceFilterTypeEnum} from '../filters/types';
import {styled} from '@mui/material/styles';
import {useTranslation} from 'react-i18next';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {AbstractEntity, PneButton, PneCheckbox, PneTextField, Status} from '../../..';
import {SearchUIDefaultsContext} from "../SearchUIProvider";
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
    const [filterType, setFilterType] = useState<MultichoiceFilterTypeEnum>(multigetCriterion.filterType)
    const [searchStrings, setSearchStrings] = useState<string[]>(multigetCriterion.searchString.split(','))
    const [currentSearchString, setCurrentSearchString] = useState<string>('')
    const [startRow, setStartRow] = useState<number>(0);
    const [hasNext, setHasNext] = useState<boolean>(false);
    const [entities, setEntities] = useState<AbstractEntity[]>([]);
    const [selected, setSelected] = useState<AbstractEntity[]>(parseInitialSelectedEntities(multigetCriterion));
    const [status, setStatus] = useState<Status | null>(null)
    const {getMatchLinkedItems} = useContext(SearchUIDefaultsContext)

    useEffect(() => {
        getMatchLinkedItems({
            type: multigetCriterion.entityType,
            searchString: currentSearchString,
            status: status,
            startRow: startRow,
            numRows: PAGE_SIZE,
            criteria: linkedMultigetCriteria,
        })
            .then(entities => {
                setEntities(entities);
                setHasNext(entities.length > PAGE_SIZE);
            })
            // .catch(raiseUIError);
            .catch(console.error)
    }, [
        currentSearchString,
        filterType,
        startRow,
        status,
    ]);

    const getSelectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return [];
        } else {
            return selected;
        }
    }

    const getDeselectedItemsByFilterType = (): AbstractEntity[] => {
        if (filterType === MultichoiceFilterTypeEnum.ALL) {
            return selected;
        } else {
            return [];
        }
    }

    const getCurrentMultigetCriterion = (): MultigetCriterion => {
        return {
            entityType: multigetCriterion.entityType,
            filterType: filterType,
            searchString: searchStrings.join(','),
            selectedItems: getSelectedItemsByFilterType().map(e => e.id).join(','),
            selectedItemNames: getSelectedItemsByFilterType().map(e => e.displayName).join(','),
            deselectedItems: getDeselectedItemsByFilterType().map(e => e.id).join(','),
            deselectedItemNames: getDeselectedItemsByFilterType().map(e => e.displayName).join(','),
        }
    }

    const onEntityClick = (entity: AbstractEntity) => {
        if (!selected.some(e => +e.id === +entity.id)) {
            setSelected([...selected, entity]);
        } else {
            setSelected([...selected.filter(e => +e.id !== +entity.id)]);
        }
    }

    const onSelectedClick = (entity: AbstractEntity) => {
        setSelected([...selected.filter(e => +e.id !== +entity.id)]);
    }

    const onSaveClick = () => {
        onSave(getCurrentMultigetCriterion());
    }

    const onCancelClick = () => {
        onCancel();
    }

    const onSearchStringClick = (str: string) => {
        setSearchStrings([...searchStrings.filter(s => s !== str)]);
    }

    const onAllClick = () => {
        setSelected([]);
        setFilterType(MultichoiceFilterTypeEnum.ALL);
    }

    const onNoneClick = () => {
        setSelected([]);
        setFilterType(MultichoiceFilterTypeEnum.NONE);
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
        setCurrentSearchString(event.target.value);
    }

    const shownSearchStrings = searchStrings.filter(s => s.length > 0);

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
        <Container>
            <Left>
                <LeftTop>
                    <PneTextField
                        value={currentSearchString}
                        onChange={onSearchChange}
                        label={'Search'}
                        sx={{marginRight: '16px'}}
                    />
                    {filterType === MultichoiceFilterTypeEnum.SEARCH ? <FlexRow>
                        {shownSearchStrings.map((str, index) =>
                            <Chip
                                key={index}
                                onClick={() => onSearchStringClick(str)}
                                color="primary"
                                label={str}
                                variant={'outlined'}
                                sx={{
                                    height: '20px',
                                    mt: '5px',
                                    '&:hover': {
                                        textDecoration: 'line-through'
                                    }
                                }}
                            />
                        )}
                    </FlexRow> : null}
                    <Controls>
                        <FlexRow>
                            <Link
                                sx={getLinkSx(filterType === MultichoiceFilterTypeEnum.ALL)}
                                component={'button'}
                                onClick={onAllClick}
                            >All</Link>
                            <Link
                                sx={getLinkSx(filterType === MultichoiceFilterTypeEnum.NONE)}
                                component={'button'}
                                onClick={onNoneClick}
                            >None</Link>
                        </FlexRow>
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
                                checked={status === 'E'}
                                onChange={e => setStatus(e.target.checked ? 'E' : null)}
                            />}
                        />
                    </Controls>}
                </LeftTop>
                {entities.slice(0, PAGE_SIZE).map((entity, index) => {
                    const rowSelected = selected.some(e => +e.id === +entity.id);
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
                {selected.map((entity, index) =>
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
