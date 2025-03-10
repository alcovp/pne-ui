import React, {HTMLAttributes, useEffect, useState} from 'react';
import {DragDropContext, Draggable, DraggableProvided, Droppable, DropResult} from '@hello-pangea/dnd';
import {Box, IconButton, InputAdornment, Stack} from '@mui/material';
import {Virtuoso} from 'react-virtuoso';
import {TFunction, useTranslation} from 'react-i18next';

import {AddedListWrapper, ColumnWrapper, Container, HeaderColumn, HeaderColumnWrapper,} from './styled';
import ItemEntitySelector from './ItemEntitySelector';
import {
    AbstractEntity,
    assertObject,
    Country,
    exhaustiveCheck,
    IMappedAbstractEntity,
    isAbstractEntity,
    isMappedAbstractEntity,
    isObject
} from '../../common';
import PneTextField from '../PneTextField';
import PneButton from '../PneButton';
import {ClearIcon} from '@mui/x-date-pickers-pro'

//TODO must be removed
export type ProcessorPaymentApparatus = {
    id: number
    name: string
    mapped: boolean
}

//TODO must be removed
export const isProcessorPaymentApparatus = (value: unknown): value is ProcessorPaymentApparatus => {
    if (!isObject(value)) {
        return false;
    }

    return 'id' in value && typeof value.id === 'number' &&
        'name' in value && typeof value.name === 'string'
}

export interface IAbstractEntityOptions<T> {
    reset?: boolean
    list: T[]
    selected: T[]
    height?: string
    disableMoving?: 'ADDED' | 'AVAILABLE' | undefined
    optionRenderer?: TFunction
    textRepresentation?: 'ID' | 'NAME' | undefined
    textRepresentationValue?: string
    onChange: (mappedList: T[], unMappedList: T[]) => void
    actionBlock?: React.ReactNode
}

export type AbstractEntitySelectorProp =
    string
    | IMappedAbstractEntity
    | AbstractEntity
    | Country
    | ProcessorPaymentApparatus

export interface IMappedUnmappedList<T extends AbstractEntitySelectorProp> {
    mapped: T[]
    unmapped: T[]
}

const getListEntity = <T extends AbstractEntitySelectorProp>(item: T, index: number): AbstractEntity => {
    if (typeof item === 'string') {
        return {
            id: index,
            displayName: item
        };
    }

    assertObject(item)
    if (isMappedAbstractEntity(item) || isProcessorPaymentApparatus(item)) {
        return {
            displayName: item.name,
            ...item
        };
    } else if (isAbstractEntity(item)) {
        return item;
    }

    exhaustiveCheck(item)

    throw new TypeError('Incompatible types of option:\n'
        + JSON.stringify(item, null, 4)
    )
}

const checkInitialType = (item: AbstractEntitySelectorProp): string | undefined => {
    if (typeof item === 'string') {
        return 'string'
    } else if (isMappedAbstractEntity(item) || isProcessorPaymentApparatus(item)) {
        return 'mappedEntity'
    } else if (isAbstractEntity(item)) {
        return 'abstractEntity'
    }
    return undefined
}

export const AbstractEntitySelector = <T extends AbstractEntitySelectorProp>(props: React.PropsWithChildren<IAbstractEntityOptions<T>>) => {
    const {
        reset,
        list,
        selected,
        height,
        optionRenderer,
        disableMoving,
        textRepresentation,
        textRepresentationValue = '',
        onChange,
        actionBlock,
    } = props;

    const {t} = useTranslation();

    const [searchValue, setSearchValue] = useState('');
    const [availableList, setAvailableList] = useState<AbstractEntity[]>([]);
    const [addedList, setAddedList] = useState<AbstractEntity[]>([]);
    const [textValue, setTextValue] = useState(textRepresentationValue);
    const [initialType, setInitialType] = useState<string | undefined>(undefined);

    useEffect(() => {
        let availArray: AbstractEntity[] = [];
        const selectedArray: AbstractEntity[] = selected.map((item, index) => {
            return getListEntity(item, list.length + index + 1);
        });
        const type = list.length > 0 ? checkInitialType(list[0]) : checkInitialType(selected[0]);
        setInitialType(type);
        if (list.length > 0) {
            if (type === 'string') {
                const uniqArray = list.filter(item => selected.indexOf(item) == -1)
                availArray = uniqArray.map((item, index) => getListEntity(item, index + 1))
            } else {
                availArray = list.map((item, index) => getListEntity(item, index + 1))
            }
        }
        setAvailableList(availArray);

        setAddedList(selectedArray);
        if (textRepresentation) {
            const array = selectedArray.map(item => {
                return textRepresentation === 'ID' ? item.id : item.displayName;
            }).toString();
            setTextValue(array);
        }
    }, [reset]);

    const onListChange = (item: AbstractEntity, type: 'ADD' | 'AVAILABLE') => {
        let tempAddedList: AbstractEntity[];
        switch (type) {
            case 'ADD':
                tempAddedList = addedList.filter(i => i.id !== item.id);
                setAvailableList(prevState => {
                    return [...prevState, item]
                });
                setAddedList(prevState => {
                    return prevState.filter(i => i.id !== item.id)
                });
                if (textRepresentation) {
                    const tempArray = tempAddedList.map(item => {
                        if (textRepresentation === 'ID') {
                            return item.id;
                        } else {
                            return item.displayName;
                        }
                    });
                    setTextValue(tempArray.toString());
                }
                break;
            case 'AVAILABLE':
                tempAddedList = [...addedList, item]
                setAvailableList(prevState => {
                    return prevState.filter(i => i.id !== item.id)
                });
                setAddedList(prevState => {
                    return [...prevState, item]
                });
                if (textRepresentation) {
                    const tempArray = tempAddedList.map(item => {
                        if (textRepresentation === 'ID') {
                            return item.id
                        } else {
                            return item.displayName
                        }
                    })
                    setTextValue(tempArray.toString());
                }
                break
            default:
                throw new Error('Cannot be')
        }
    }


    const onDragEnd = (result: DropResult) => {
        const {destination, source} = result;

        if (!destination) {
            return;
        }

        if (destination.index === source.index && destination.droppableId === source.droppableId) {
            return;
        }

        if (destination.droppableId === source.droppableId) {
            let tempAdded: AbstractEntity[] = []
            switch (destination.droppableId) {
                case 'availableList':
                    setAvailableList((prev) => {
                        const temp = [...prev];
                        const [removed] = temp.splice(source.index, 1);
                        temp.splice(destination.index, 0, removed);
                        return temp;
                    });
                    break;
                case 'addedList':
                    setAddedList((prev) => {
                        const temp = [...prev];
                        const [removed] = temp.splice(source.index, 1);
                        temp.splice(destination.index, 0, removed);
                        tempAdded = temp;
                        return temp;
                    });
                    if (textRepresentation) {
                        const tempArray = tempAdded.map(item => {
                            if (textRepresentation === 'ID') {
                                return item.id;
                            } else {
                                return item.displayName;
                            }
                        });
                        setTextValue(tempArray.toString());
                    }
                    break;
                default:
                    return;
            }
        }
        if (destination.droppableId !== result.source.droppableId) {
            if (destination.droppableId === 'availableList') {
                const sourceList = [...addedList];
                const destList = [...availableList];
                const [removed] = sourceList.splice(result.source.index, 1);
                destList.splice(destination.index, 0, removed);
                setAvailableList(destList);
                setAddedList(sourceList);
                if (textRepresentation) {
                    const tempArray = sourceList.map(item => {
                        if (textRepresentation === 'ID') {
                            return item.id;
                        } else {
                            return item.displayName;
                        }
                    });
                    setTextValue(tempArray.toString());
                }
            } else {
                const sourceList = [...availableList];
                const destList = [...addedList];
                const [removed] = sourceList.splice(result.source.index, 1);
                destList.splice(destination.index, 0, removed);
                setAvailableList(sourceList);
                setAddedList(destList);
                if (textRepresentation) {
                    const tempArray = destList.map(item => {
                        if (textRepresentation === 'ID') {
                            return item.id;
                        } else {
                            return item.displayName;
                        }
                    });
                    setTextValue(tempArray.toString());
                }
            }
        }
        onChangeParentDate();
    };

    const handleSelectAll = (type: 'AVAILABLE' | 'ADDED') => {
        if (type === 'AVAILABLE') {
            setAddedList(prevState => {
                return [...prevState, ...availableList];
            });
            if (textRepresentation) {
                const array = [...addedList, ...availableList].map(item => {
                    return textRepresentation === 'ID' ? item.id : item.displayName;
                }).toString();
                setTextValue(array);
            }
            setAvailableList([]);
        } else {
            setAvailableList(prevState => {
                return [...prevState, ...addedList];
            });
            if (textRepresentation) {
                setTextValue('');
            }
            setAddedList([]);
        }
    };

    const handleChangeTextareaValue = (value: string) => {
        if (textRepresentation === 'ID') {
            const regex = /[\d+,*]$/;
            if (value !== '' && !regex.test(value)) {
                return;
            }
        }

        setTextValue(value);
        const dictionary = [...addedList, ...availableList];

        if (value !== '') {
            if (textRepresentation === 'ID') {
                const tempArray = value.split(',');

                const newAddedList = dictionary.filter(addedItem => {
                    return tempArray.includes(String(addedItem.id))
                });

                const newAvailableList = dictionary.filter(addedItem => {
                    return !tempArray.includes(String(addedItem.id))
                });

                setAddedList(newAddedList);
                setAvailableList(newAvailableList);
            } else {
                const tempArray = value.split(',');

                const newAddedList = dictionary.filter(addedItem => {
                    return tempArray.includes(String(addedItem.displayName))
                });

                const newAvailableList = dictionary.filter(addedItem => {
                    return !tempArray.includes(String(addedItem.displayName))
                });

                setAddedList(newAddedList);
                setAvailableList(newAvailableList);
            }
        } else {
            setAvailableList(dictionary);
            setAddedList([]);
        }
    };
    const renderOption = (option: string) => {
        return optionRenderer ? optionRenderer(option) : option
    };

    const onChangeParentDate = () => {
        let mapped: T[] = [];
        let unmapped: T[] = [];
        if (initialType !== undefined) {
            switch (initialType) {
                case 'string':
                    mapped = addedList.map(item => item.displayName) as T[];
                    unmapped = availableList.map(item => item.displayName) as T[];
                    break;
                case 'mappedEntity':
                    mapped = addedList.map(item => ({
                        ...item,
                        name: item.displayName
                    })) as IMappedAbstractEntity[] as T[];
                    unmapped = availableList.map(item => ({
                        ...item,
                        name: item.displayName
                    })) as IMappedAbstractEntity[] as T[];
                    break;
                case 'abstractEntity':
                    mapped = addedList as T[];
                    unmapped = availableList as T[];
                    break;
                default:
                    throw new Error('please check the types of lists');
            }
        }
        onChange(mapped, unmapped);
    };

    useEffect(() => {
        if (initialType) {
            onChangeParentDate();
        }
    }, [addedList, availableList]);

    const HeightPreservingItem: React.FunctionComponent<HTMLAttributes<HTMLDivElement>> = ({children, ...props}) => {
        return (
            <div {...props} style={{minHeight: '32px'}}>
                {children}
            </div>
        );
    };

    return (
        <>
            <Box sx={{marginBottom: '20px'}}>
                <PneTextField
                    variant={'outlined'}
                    sx={{width: '100%'}}
                    onChange={(e) => {
                        setSearchValue(e.target.value)
                    }}
                    value={searchValue}
                    label={t('search')}
                    InputProps={{
                        endAdornment: searchValue && (
                            <InputAdornment position="end">
                                <IconButton onClick={e => setSearchValue('')} edge="end">
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <DragDropContext onDragEnd={onDragEnd}>
                <Container height={height}>
                    <ColumnWrapper>
                        <AddedListWrapper>
                            <HeaderColumnWrapper>
                                <HeaderColumn>
                                    {t('abstractSelector.available')}
                                </HeaderColumn>
                                {disableMoving !== 'AVAILABLE' && (
                                    <PneButton
                                        variant='text'
                                        onClick={() => {
                                            handleSelectAll('AVAILABLE')
                                        }}
                                        sx={{marginLeft: 'auto'}}
                                    >
                                        {t('abstractSelector.select.all')}
                                    </PneButton>
                                )}
                            </HeaderColumnWrapper>
                            <Droppable
                                droppableId={'availableList'}
                                mode="virtual"
                                renderClone={(provided, _snapshot, rubric) => {
                                    return (
                                        <ItemEntitySelector
                                            handleClick={() => {
                                                if (disableMoving !== 'AVAILABLE') {
                                                    onListChange(availableList[rubric.source.index], 'AVAILABLE');
                                                }
                                            }}
                                            provided={provided}
                                            item={availableList[rubric.source.index]}
                                            name={renderOption(availableList[rubric.source.index].displayName)}
                                        />
                                    )
                                }}
                            >
                                {(provided) => (
                                    <Virtuoso
                                        components={{
                                            Item: HeightPreservingItem,
                                        }}
                                        scrollerRef={(value) => provided.innerRef(value as HTMLElement)}
                                        data={availableList.filter(item => renderOption(item.displayName).toLowerCase().includes(searchValue.toLowerCase()))}
                                        itemContent={(index, item) => {
                                            return (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id.toString()}
                                                    index={index}
                                                    isDragDisabled={disableMoving === 'AVAILABLE'}
                                                >
                                                    {(provided) => (
                                                        <ItemEntitySelector
                                                            handleClick={() => {
                                                                if (disableMoving !== 'AVAILABLE') {
                                                                    onListChange(item, 'AVAILABLE');
                                                                }
                                                            }}
                                                            provided={provided}
                                                            item={item}
                                                            name={renderOption(item.displayName)}
                                                        />
                                                    )}
                                                </Draggable>
                                            )
                                        }}
                                    >
                                        {provided.placeholder}
                                    </Virtuoso>
                                )}
                            </Droppable>
                        </AddedListWrapper>
                    </ColumnWrapper>
                    <ColumnWrapper>
                        <AddedListWrapper>
                            <HeaderColumnWrapper>
                                <HeaderColumn>
                                    {t('abstractSelector.added')}
                                </HeaderColumn>
                                {disableMoving !== 'ADDED' && (
                                    <PneButton
                                        variant='text'
                                        onClick={() => {
                                            handleSelectAll('ADDED')
                                        }}
                                        sx={{marginLeft: 'auto'}}
                                    >
                                        {t('abstractSelector.select.all')}
                                    </PneButton>
                                )}
                            </HeaderColumnWrapper>
                            <Droppable
                                droppableId={'addedList'}
                                mode="virtual"
                                renderClone={(provided, _snapshot, rubric) => {
                                    return (
                                        <ItemEntitySelector
                                            handleClick={() => {
                                                if (disableMoving !== 'ADDED') {
                                                    onListChange(addedList[rubric.source.index], 'ADD');
                                                }
                                            }}
                                            provided={provided}
                                            item={addedList[rubric.source.index]}
                                            name={renderOption(addedList[rubric.source.index].displayName)}
                                        />
                                    )
                                }}
                            >
                                {(provided) => (
                                    <Virtuoso
                                        components={{
                                            Item: HeightPreservingItem,
                                        }}
                                        scrollerRef={(value) => provided.innerRef(value as HTMLElement)}
                                        data={addedList}
                                        itemContent={(index, item) => {
                                            return (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id.toString()}
                                                    index={index}
                                                    isDragDisabled={disableMoving === 'ADDED'}
                                                >
                                                    {(provided: DraggableProvided) => (
                                                        <ItemEntitySelector
                                                            handleClick={() => {
                                                                if (disableMoving !== 'ADDED') {
                                                                    onListChange(item, 'ADD');
                                                                }
                                                            }}
                                                            provided={provided}
                                                            item={item}
                                                            name={renderOption(item.displayName)}
                                                        />
                                                    )}
                                                </Draggable>
                                            )
                                        }}
                                    >
                                        {provided.placeholder}
                                    </Virtuoso>
                                )}
                            </Droppable>
                        </AddedListWrapper>
                    </ColumnWrapper>
                </Container>
            </DragDropContext>
            {textRepresentation && (
                <Stack
                    sx={{marginTop: '38px'}}
                >
                    <PneTextField
                        value={textValue}
                        onChange={(event) => {
                            handleChangeTextareaValue(event.target.value)
                        }}
                        multiline
                        fullWidth
                        sx={{mt: '16px'}}
                        minRows={3}
                    />
                </Stack>
            )}
            {actionBlock ? actionBlock : null}
        </>
    );
};
