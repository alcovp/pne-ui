import React from 'react';
import {SearchUIFiltersCriterionHeaderButton} from '../../styled';

interface IProps {
    onClick: () => void
}

const SearchUIFiltersCriterionHeaderClearButton = (props: IProps) => {
    const {
        onClick
    } = props;

    return (
        <SearchUIFiltersCriterionHeaderButton onClick={onClick}>
            <EraseIcon/>
        </SearchUIFiltersCriterionHeaderButton>
    );
}

export default SearchUIFiltersCriterionHeaderClearButton;

const EraseIcon = () => {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 14.667H14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path
            d="M1.94047 11.7205L4.28048 14.0605C5.06048 14.8405 6.3338 14.8405 7.10714 14.0605L14.0605 7.10713C14.8405 6.32713 14.8405 5.0538 14.0605 4.28046L11.7205 1.94047C10.9405 1.16047 9.66717 1.16047 8.89384 1.94047L1.94047 8.8938C1.16047 9.66713 1.16047 10.9405 1.94047 11.7205Z"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M4.74609 6.08691L9.91276 11.2536" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
}