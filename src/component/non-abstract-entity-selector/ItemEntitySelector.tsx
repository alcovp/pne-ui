import React from 'react';
import {StyledListItemButton} from './styled';
import {DraggableProvided} from '@hello-pangea/dnd';
import {AbstractEntity} from '../../common/paynet/type';
import {IconButton} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
}

const ItemEntitySelector = ({provided, item, handleClick, name, itemAttributes, dragHandle = 'row'}: IProps) => {
    const {t} = useTranslation();
    const separateHandle = dragHandle === 'button';

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
                ...(separateHandle && {display: 'flex', alignItems: 'stretch', marginBottom: 2}),
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
                sx={separateHandle ? {minWidth: 0, flex: 1, marginBottom: 0} : undefined}
            >
                {name}
            </StyledListItemButton>
            {separateHandle && provided.dragHandleProps && <IconButton
                {...provided.dragHandleProps}
                type='button'
                aria-label={t('abstractSelector.reorder', {name, defaultValue: 'Reorder {{name}}'})}
                disableRipple
                style={{touchAction: 'none'}}
                sx={{
                    flexShrink: 0,
                    width: 32,
                    minHeight: 32,
                    padding: 0,
                    borderRadius: 0,
                    cursor: 'grab',
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    '@media (pointer: coarse)': {width: 44, minHeight: 44},
                    '&:hover': {backgroundColor: 'rgba(25, 118, 210, 0.12)'},
                    '@media (hover: none)': {
                        '&:hover': {backgroundColor: 'rgba(25, 118, 210, 0.08)'},
                    },
                    '&.Mui-focusVisible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: -2,
                    },
                }}
            >
                <DragIndicatorIcon fontSize='small'/>
            </IconButton>}
        </div>
    );
};

export default ItemEntitySelector;
