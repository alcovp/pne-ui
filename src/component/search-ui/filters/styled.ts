import {styled} from '@mui/system';

export const SearchUIFiltersHeaderRight = styled('div')`
    display: flex;
    flex-direction: row;
    align-items: center;
    column-gap: 5px;
    margin-left: auto;

    @media (max-width: 599px) {
        width: 100%;
        margin-left: 0;
        justify-content: flex-start;
        margin-top: 8px;
        column-gap: 4px;
        & > * {
            flex: 1 1 0;
        }
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
