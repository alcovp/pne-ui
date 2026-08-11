import {styled} from '@mui/system';
import {TableRow} from '@mui/material';

const PneTableRow = styled(TableRow, {
    shouldForwardProp: prop => prop !== 'hover'
})<{ hover?: boolean }>(({theme, hover = true}) => ({
    borderColor: 'transparent',
    borderBottomColor: theme.palette.mode === 'dark' ? theme.palette.divider : '#F1F5FA',
    fontSize: '12px',
    lineHeight: '16px',
    '&:first-of-type': {
        borderBottomColor: theme.palette.mode === 'dark' ? theme.palette.divider : '#F1F5FA',
    },
    '& td': {
        borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#fff'}`,
        borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#fff'}`,
        borderColor: 'inherit',
    },
    '& td:first-of-type': {
        borderLeft: `1px solid ${theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#fff'}`,
        borderColor: 'inherit',
    },
    '& td:last-of-type': {
        borderRight: `1px solid ${theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#fff'}`,
        borderColor: 'inherit',
    },
}))

export default PneTableRow;
