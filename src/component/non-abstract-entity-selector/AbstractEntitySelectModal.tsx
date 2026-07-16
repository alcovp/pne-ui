import React, {useState} from 'react';
import {TFunction, useTranslation} from 'react-i18next';
import {
    AbstractEntitySelector,
    AbstractEntitySelectorProp,
    IAbstractEntityOptions,
    IMappedUnmappedList
} from './AbstractEntitySelector';
import PneButton from '../PneButton';
import PneModal from "../PneModal";
import PneModalActions from '../PneModalActions';

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
    allowNewlyAddedRemoval?: boolean;
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
        allowNewlyAddedRemoval,
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
        allowNewlyAddedRemoval,
        optionRenderer,
        textRepresentation,
        textRepresentationValue,
        onChange: handleChange,
    };

    return (
        <PneModal
            actions={<PneModalActions
                secondary={<PneButton variant='outlined' onClick={onClose}>
                    {t('cancel')}
                </PneButton>}
                primary={<PneButton
                    variant='contained'
                    onClick={() => handleSave({
                        mapped: localMappedList,
                        unmapped: localUnMappedList
                    })}
                >
                    {t('save')}
                </PneButton>}
            />}
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
