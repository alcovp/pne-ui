import React from 'react';
import {SearchUIFiltersCriterionHeaderButton} from '../../styled';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';

const REMOVE_CRITERION_AUTOTEST_ID = 'remove-criterion';

interface IProps {
    onClick: () => void
    ariaLabel: string
}

const SearchUIFiltersCriterionHeaderRemoveButton = (props: IProps) => {
    const {
        ariaLabel,
        onClick,
    } = props

    return <SearchUIFiltersCriterionHeaderButton
        {...createAutoTestAttributes(REMOVE_CRITERION_AUTOTEST_ID)}
        type={'button'}
        aria-label={ariaLabel}
        onClick={onClick}
    >
        <svg
            aria-hidden={true}
            focusable={false}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 4L4 12" stroke="#809EAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 4L12 12" stroke="#809EAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </SearchUIFiltersCriterionHeaderButton>
}

export default SearchUIFiltersCriterionHeaderRemoveButton;
