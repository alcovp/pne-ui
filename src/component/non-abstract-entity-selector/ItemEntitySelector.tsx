import React from 'react';
import {StyledListItemButton} from './styled';
import {DraggableProvided} from '@hello-pangea/dnd';
import {AbstractEntity} from '../../common/paynet/type';
import {IconButton} from '@mui/material';
import PneDragHandleIcon from '../PneDragHandleIcon';
import {PneCloseIcon} from '../dropdown/dropdownLook';
import PneNextPageIcon from '../table/PneNextPageIcon';
import {resolvePneSemanticPalette} from '../../createTheme';
import {useTranslation} from 'react-i18next';

export type ItemEntitySelectorAttributes = React.AriaAttributes & {
    [key: `data-${string}`]: unknown
}

interface IProps {
    name: string,
    provided: DraggableProvided,
    item: AbstractEntity,
    handleClick: () => void,
    itemAttributes?: ItemEntitySelectorAttributes,
    dragHandle?: 'row' | 'button',
    /** What a click on the row does: the sign at its end - an arrow to add, a cross to take back. */
    action?: 'add' | 'remove',
}

const ItemEntitySelector = ({provided, item, handleClick, name, itemAttributes, dragHandle = 'row', action}: IProps) => {
    const {t} = useTranslation();
    const separateHandle = dragHandle === 'button';

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
                ...(separateHandle && {display: 'flex', alignItems: 'stretch'}),
                ...provided.draggableProps.style,
            }}
        >
            <StyledListItemButton
                {...(!separateHandle && provided.dragHandleProps)}
                {...itemAttributes}
                component='button'
                type='button'
                key={item.id}
                onClick={handleClick}
                title={name}
                sx={separateHandle ? {minWidth: 0, flex: 1} : undefined}
            >
                <span data-pne-transfer-label=''>{name}</span>
                {action ? <span data-pne-transfer-sign={action} aria-hidden={true}>
                    {action === 'add' ? <PneNextPageIcon/> : <PneCloseIcon sx={{fontSize: 16}}/>}
                </span> : null}
            </StyledListItemButton>
            {separateHandle && provided.dragHandleProps && <IconButton
                {...provided.dragHandleProps}
                type='button'
                aria-label={t('abstractSelector.reorder', {name, defaultValue: 'Reorder {{name}}'})}
                disableRipple
                style={{touchAction: 'none'}}
                sx={theme => ({
                    flexShrink: 0,
                    width: 32,
                    minHeight: 32,
                    padding: 0,
                    borderRadius: '4px',
                    color: 'text.secondary',
                    cursor: 'grab',
                    '@media (pointer: coarse)': {width: 44, minHeight: 44},
                    '&:hover': {backgroundColor: resolvePneSemanticPalette(theme).dropdown.option.hover},
                    '&.Mui-focusVisible': {
                        outline: '2px solid',
                        outlineColor: resolvePneSemanticPalette(theme).focusRing,
                        outlineOffset: -2,
                    },
                })}
            >
                <PneDragHandleIcon sx={{fontSize: 16}}/>
            </IconButton>}
        </div>
    );
};

export default ItemEntitySelector;
