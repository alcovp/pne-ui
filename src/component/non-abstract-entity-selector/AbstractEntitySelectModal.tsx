import React, {useState} from 'react';
import {TFunction, useTranslation} from 'react-i18next';
import {Stack} from '@mui/material';
import {
    AbstractEntitySelector,
    AbstractEntitySelectorProp,
    IAbstractEntityOptions,
    IMappedUnmappedList
} from './AbstractEntitySelector';
import PneButton from '../PneButton';
import PneModal from "../PneModal";

interface IProps<T extends AbstractEntitySelectorProp> {
    open: boolean;
    onClose: () => void;
    mappedList: T[];
    unMappedList: T[];
    handleSave: (list: IMappedUnmappedList<T>) => void;
    title: string;
    subTitle?: string;
    loading?: boolean;
    disableMoving?: 'ADDED' | 'AVAILABLE' | undefined;
    optionRenderer?: TFunction;
    textRepresentation?: 'ID' | 'NAME' | undefined;
    textRepresentationValue?: string
}

export const AbstractEntitySelectModal = <T extends AbstractEntitySelectorProp>(props: IProps<T>) => {
    const {
        open,
        onClose,
        mappedList,
        unMappedList,
        handleSave,
        title,
        subTitle,
        loading = false,
        disableMoving,
        optionRenderer,
        textRepresentation,
        textRepresentationValue
    } = props;

    const {t} = useTranslation();

    const autoHeight = () => {
        if (mappedList?.length > unMappedList?.length) {
            return mappedList.length <= 10
                ? mappedList.length == 1
                    ? `calc((${mappedList?.length + 1} * 32px) + 36px)`
                    : `calc((${mappedList?.length} * 32px) + 36px)`
                : `calc(400px + 40px + 16px)`
        } else {
            return unMappedList?.length <= 10
                ? unMappedList?.length == 1
                    ? `calc((${unMappedList?.length + 1} * 32px) + 36px)`
                    : `calc((${unMappedList?.length} * 32px) + 36px)`
                : `calc(320px + 36px)`
        }
    };

    const [localUnMappedList, setLocalUnMappedList] = useState<T[]>(unMappedList);
    const [localMappedList, setLocalMappedList] = useState<T[]>(mappedList);

    const handleChange = (mappedList: T[], unMappedList: T[]) => {
        setLocalMappedList(mappedList);
        setLocalUnMappedList(unMappedList);
    };

    const entitySelectorOptions: IAbstractEntityOptions<T> = {
        list: unMappedList,
        selected: mappedList,
        height: autoHeight(),
        disableMoving,
        optionRenderer,
        textRepresentation,
        textRepresentationValue,
        onChange: handleChange,
        actionBlock: (
            <Stack
                sx={{marginTop: '16px'}}
                flexDirection='row'
                gap={2}
            >
                <PneButton
                    variant='outlined'
                    onClick={() => onClose()}
                    fullWidth
                >
                    {t('cancel')}
                </PneButton>
                <PneButton
                    variant='contained'
                    onClick={() => {
                        handleSave({
                            mapped: localMappedList,
                            unmapped: localUnMappedList
                        });
                    }}
                    fullWidth
                >
                    {t('save')}
                </PneButton>
            </Stack>
        ),
    };

    return (
        <PneModal
            open={open}
            onClose={onClose}
            title={title}
            subtitle={subTitle}
            containerSx={{
                width: {
                    xs: 'clamp(360px, calc(100vw - 32px), 600px)',
                    sm: '600px'
                },
                minWidth: 0,
                maxWidth: '600px',
                height: 'auto'
            }}
        >
            {/*<LoadingWrapper loading={loading}>*/}
            <AbstractEntitySelector {...entitySelectorOptions}/>
            {/*</LoadingWrapper>*/}
        </PneModal>
    );
};
