import React from 'react';
import {Tooltip} from '@mui/material';
import {SEARCH_UI_FILTERS_TOOLTIP_DELAY, SearchUIFiltersCriterionHeaderButton} from '../../styled';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';

const CLEAR_CRITERION_AUTOTEST_ID = 'clear-criterion';

interface IProps {
    onClick: () => void
    ariaLabel: string
}

const SearchUIFiltersCriterionHeaderClearButton = (props: IProps) => {
    const {
        ariaLabel,
        onClick,
    } = props;

    // The icon alone does not say what it does: the tooltip shows the same text as the label.
    return (
        <Tooltip
            disableInteractive
            enterDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
            enterNextDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
            title={ariaLabel}
        >
            <SearchUIFiltersCriterionHeaderButton
                {...createAutoTestAttributes(CLEAR_CRITERION_AUTOTEST_ID)}
                type={'button'}
                aria-label={ariaLabel}
                onClick={onClick}
            >
                <ReloadIcon/>
            </SearchUIFiltersCriterionHeaderButton>
        </Tooltip>
    );
}

export default SearchUIFiltersCriterionHeaderClearButton;

// UI Kit IcArrowArrowReload: the criterion goes back to its empty value.
const ReloadIcon = () => {
    return <svg
        aria-hidden={true}
        focusable={false}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M14.67 3l.5.91c.34.62.51.93.4 1.06-.11.13-.48.03-1.22-.19A9.2 9.2 0 0 0 12 4.46C7.58 4.46 4 7.83 4 12c0 1.37.39 2.66 1.07 3.77M9.33 21l-.5-.91c-.34-.62-.51-.93-.4-1.06.11-.13.48-.03 1.22.19.74.21 1.53.32 2.35.32 4.42 0 8-3.37 8-7.54 0-1.37-.39-2.66-1.07-3.77"
            strokeWidth="1.5" strokeLinecap="round"
        />
    </svg>
}
