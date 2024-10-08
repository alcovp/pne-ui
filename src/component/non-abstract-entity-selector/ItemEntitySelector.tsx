import React from 'react';
import {StyledListItem} from './styled';
import {DraggableProvided} from '@hello-pangea/dnd';
import {AbstractEntity} from '../../common/paynet/type';

interface IProps {
    name: string,
    provided: DraggableProvided,
    item: AbstractEntity,
    handleClick: () => void,
}

const ItemEntitySelector = ({provided, item, handleClick, name}: IProps) => {

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
        >
            <StyledListItem
                key={item.id}
                onClick={handleClick}
            >
                {name}
            </StyledListItem>
        </div>
    );
};

export default ItemEntitySelector;