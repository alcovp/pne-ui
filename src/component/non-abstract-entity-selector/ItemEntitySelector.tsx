import React from 'react';
import {StyledListItemButton} from './styled';
import {DraggableProvided} from '@hello-pangea/dnd';
import {AbstractEntity} from '../../common/paynet/type';

export type ItemEntitySelectorAttributes = React.AriaAttributes & {
    [key: `data-${string}`]: unknown
}

interface IProps {
    name: string,
    provided: DraggableProvided,
    item: AbstractEntity,
    handleClick: () => void,
    itemAttributes?: ItemEntitySelectorAttributes,
}

const ItemEntitySelector = ({provided, item, handleClick, name, itemAttributes}: IProps) => {

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
        >
            <StyledListItemButton
                {...provided.dragHandleProps}
                {...itemAttributes}
                component='button'
                type='button'
                key={item.id}
                onClick={handleClick}
                title={name}
            >
                {name}
            </StyledListItemButton>
        </div>
    );
};

export default ItemEntitySelector;
