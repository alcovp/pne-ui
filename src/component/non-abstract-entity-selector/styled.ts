// The Material `styled`: its default theme has a palette when no provider stands over the list.
import {styled} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../createTheme';
import PneHeaderTableCell from "../table/PneHeaderTableCell";
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
    width: 'calc(50% - 8px)',
    boxSizing: 'border-box',

}));

// UI Kit Transfer list: a caption with the action of the whole list over a box with a hairline; the
// box is the list itself, virtual or not, so its 4px inset scrolls with the rows.
export const AddedListWrapper = styled('div')(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
    '& > [data-virtuoso-scroller], & > [data-rfd-droppable-id]': {
        borderRadius: '8px',
        boxShadow: `inset 0 0 0 1px ${resolvePneSemanticPalette(theme).dropdown.panel.ring}`,
        boxSizing: 'border-box',
        padding: '4px',
    },
}));

export const HeaderColumnWrapper = styled('div')`
    min-height: 24px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 8px;
`;

export const HeaderColumn = styled('div')(({theme}) => ({
    color: (theme).palette.text.secondary,
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
}));

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
    cursor: 'pointer',
    width: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
}));

/**
 * A row of a transfer list (UI Kit): 32px, 14/20, the name and the sign of what a click does at the
 * end. The row has no fill of its own; the pointer and the keyboard give it the highlight of a list.
 */
export const StyledListItemButton = styled(ListItemButton)(({theme}) => {
    const dropdown = resolvePneSemanticPalette(theme).dropdown
    return {
        borderRadius: '4px',
        color: dropdown.option.text,
        columnGap: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '20px',
        minHeight: '32px',
        padding: '6px 8px 6px 12px',
        width: '100%',
        '&:hover, &.Mui-focusVisible': {
            backgroundColor: dropdown.option.hover,
        },
        '& [data-pne-transfer-label]': {
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        '& [data-pne-transfer-sign]': {
            color: dropdown.chip.remove,
            display: 'inline-flex',
            flexShrink: 0,
        },
        '&:hover [data-pne-transfer-sign="add"], &.Mui-focusVisible [data-pne-transfer-sign="add"]': {
            color: resolvePneSemanticPalette(theme).link,
        },
        '&:hover [data-pne-transfer-sign="remove"], &.Mui-focusVisible [data-pne-transfer-sign="remove"]': {
            color: (theme).palette.error.main,
        },
    }
}) as typeof ListItemButton;
