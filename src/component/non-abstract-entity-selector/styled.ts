import {styled} from '@mui/material/styles';
import {PneHeaderTableCell} from "../../index";
import {ListItem, ListItemButton} from '@mui/material';

export const HeaderWrapper = styled('div')`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const EntitySelectorListItemDisplayName = styled('div')`
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
`;

export const StyledEntitySelectorListItemDisplayName = styled(EntitySelectorListItemDisplayName)`
    text-overflow: ellipsis;
`;

export const StyledPneHeaderTableCell = styled(PneHeaderTableCell)`
    background: #F1F5FA;
`;

export const SeparateWrapper = styled('div')`
    margin-top: 20px;
`;

export const PropertyGroupTitle = styled('div')`
    margin-top: 1em;
    padding: 10px 20px;
    font-size: 20px;
    color: #274152;
    box-sizing: border-box;
`;

export const EntitySelectorListItem = styled('div', {
    shouldForwardProp: prop => prop !== 'isAdded'
})<{ isAdded?: boolean }>(({theme}) => ({
    // backgroundColor: theme.color.background, //TODO theme
    borderRadius: '4px',
    marginBottom: '2px',
    boxSizing: 'border-box',
    padding: '10px 24px 10px 12px',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    wordBreak: 'break-all',

    '&:hover': {
        // backgroundColor: theme.skin.experimentalColor, //TODO theme
        // color: theme.skin.experimentalColor //TODO theme
    },

}));

export const StyledEntitySelectorListItem = styled(EntitySelectorListItem)`
    padding-right: 12px;
`
export const Container = styled('div', {
    shouldForwardProp: prop => prop !== 'height'
})<{ height?: string }>(() => ({
    boxSizing: 'border-box',
    minHeight: '320px',
    display: 'flex',
    justifyContent: 'space-between',
}));


export const ColumnWrapper = styled('div', {})(() => ({
    width: 'calc(50% - 4px)',
    boxSizing: 'border-box',

}));

export const AddedListWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
`;

export const HeaderColumnWrapper = styled('div')`
    height: 20px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 16px;
`;

export const HeaderColumn = styled('div')`
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 20px;
    color: #4E5D78;

`;

export const ItemList = styled('div', {
    shouldForwardProp: prop => prop !== 'withSearch'
})<{ withSearch?: boolean }>(({withSearch}) => ({
    height: withSearch ? 'calc(100% - 92px)' : 'calc(100% - 46px)',
    overflowY: 'scroll',
    borderRadius: '8px',
    padding: '2px',
}));

export const ListContainer = styled(ItemList)`
    &::-webkit-scrollbar-track {
        background: #FFFFFF;
        border-radius: 12px;
    }

    &::-webkit-scrollbar-thumb {
        background: #DDE1E6 !important;
        border-radius: 12px;
        border: 4px solid #FFFFFF;
    }
`;

export const EntitySelectorListItemId = styled('div', {
    shouldForwardProp: prop => prop !== 'width  '
})<{ width?: string }>(() => ({
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#939393',
    marginRight: '16px',
    textAlign: 'right',
    flexShrink: 0,
}));

export const StyledListItem = styled(ListItem)(() => ({
    minHeight: '32px',
    padding: '6px 8px',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    fontSize: '14px',
    marginBottom: '2px',
    cursor: 'pointer'
}));

export const StyledListItemButton = styled(ListItemButton)(() => ({
    minHeight: '32px',
    padding: '6px 8px',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    fontSize: '14px',
    marginBottom: '2px',
    cursor: 'pointer'
}));
