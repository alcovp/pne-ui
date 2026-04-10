import {styled} from '@mui/system';

export const SearchUIFiltersHeaderActions = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;
    margin-left: auto;

    @media (max-width: 599px) {
        width: 100%;
        margin-left: 0;
        margin-top: 8px;
        flex-wrap: wrap;
        align-items: flex-start;
        row-gap: 8px;
    }
`;

export const SearchUIFiltersHeaderMainRow = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;

    @media (max-width: 599px) {
        width: 100%;
        flex: 1 1 100%;
        gap: 8px;
    }
`;

export const SearchUIFiltersHeaderLeft = styled('div')`
    display: flex;
    align-items: center;
    flex: 0 0 auto;

    @media (max-width: 599px) {
        justify-content: flex-start;
    }
`;

export const SearchUIFiltersHeaderRight = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 1 auto;
    min-width: 0;
    column-gap: 5px;
    flex-wrap: nowrap;

    @media (max-width: 599px) {
        justify-content: flex-end;
        column-gap: 4px;
    }
`;

export const SearchUIFiltersHeaderSearch = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;

    @media (max-width: 599px) {
        width: 100%;
        flex: 1 1 100%;
    }
`;

export const SearchUIFiltersCriterionHeaderButton = styled('div')`
    display: flex;
    align-items: center;
    padding: 4px;
    height: 16px;
    width: 16px;
    cursor: pointer;
    stroke: #809eae;
`;
