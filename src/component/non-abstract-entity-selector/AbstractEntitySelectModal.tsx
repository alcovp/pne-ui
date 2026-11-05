import React, {useState} from 'react';
import {TFunction, useTranslation} from 'react-i18next';
import {
    AbstractEntitySelector,
    AbstractEntitySelectorProp,
    IAbstractEntityOptions,
    IMappedUnmappedList
} from './AbstractEntitySelector';
import PneButton from '../PneButton';
import PneModal, {
    PneModalCloseButtonProps,
    PneModalContainerProps,
} from "../PneModal";
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
    /** Use false for short reorderable lists to keep the original touch target mounted. */
    virtualized?: boolean;
    /** Show a separate handle for immediate touch dragging; disables list virtualization. */
    dragHandle?: 'row' | 'button';
    disableMoving?: 'ADDED' | 'AVAILABLE' | undefined;
    allowNewlyAddedRemoval?: boolean;
    optionRenderer?: TFunction;
    textRepresentation?: 'ID' | 'NAME' | undefined;
    textRepresentationValue?: string;
    containerProps?: PneModalContainerProps;
    closeButtonProps?: PneModalCloseButtonProps;
    closeLabel?: string;
    getItemAttributes?: IAbstractEntityOptions<T>['getItemAttributes'];
    elementAttributes?: IAbstractEntityOptions<T>['elementAttributes'];
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
        virtualized: requestedVirtualization = true,
        dragHandle = 'row',
        disableMoving,
        allowNewlyAddedRemoval,
        optionRenderer,
        textRepresentation,
        textRepresentationValue,
        containerProps,
        closeButtonProps,
        closeLabel,
        getItemAttributes,
        elementAttributes,
    } = props;

    const virtualized = requestedVirtualization && dragHandle !== 'button';

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
        virtualized,
        dragHandle,
        disableMoving,
        allowNewlyAddedRemoval,
        optionRenderer,
        textRepresentation,
        textRepresentationValue,
        onChange: handleChange,
        getItemAttributes,
        elementAttributes,
    };

    return (
        <PneModal
            actions={<PneModalActions
                secondary={<PneButton pneStyle='outlined' onClick={onClose}>
                    {t('cancel')}
                </PneButton>}
                primary={<PneButton
                    pneStyle='contained'
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
            closeLabel={closeLabel}
            modalProps={!virtualized ? {
                sx: {display: 'flex', alignItems: 'center', justifyContent: 'center'},
            } : undefined}
            slotProps={{
                container: containerProps,
                closeButton: closeButtonProps,
            }}
            containerSx={{
                width: {
                    xs: 'clamp(360px, calc(100vw - 32px), 600px)',
                    sm: '600px'
                },
                minWidth: 0,
                maxWidth: '600px',
                height: 'auto',
                // Standard DnD keeps the touched row in place. Its fixed drag positioning
                // needs viewport coordinates, without a transformed modal ancestor.
                ...(!virtualized && {position: 'relative', top: 'auto', left: 'auto', transform: 'none'}),
            }}
        >
            {/*<LoadingWrapper loading={loading}>*/}
            <AbstractEntitySelector {...entitySelectorOptions}/>
            {/*</LoadingWrapper>*/}
        </PneModal>
    );
};
