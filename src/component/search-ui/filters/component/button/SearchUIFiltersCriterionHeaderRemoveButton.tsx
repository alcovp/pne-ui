import React from 'react';
import {Tooltip} from '@mui/material';
import {SEARCH_UI_FILTERS_TOOLTIP_DELAY, SearchUIFiltersCriterionHeaderButton} from '../../styled';
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

    // The icon alone does not say what it does: the tooltip shows the same text as the label.
    return <Tooltip
        disableInteractive
        enterDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        enterNextDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        title={ariaLabel}
    >
        <SearchUIFiltersCriterionHeaderButton
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
                <path d="M12 4L4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 4L12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </SearchUIFiltersCriterionHeaderButton>
    </Tooltip>
}

export default SearchUIFiltersCriterionHeaderRemoveButton;
