import {styled} from '@mui/material/styles';
import {TableRow} from '@mui/material';

const PneTableRow = styled(TableRow, {
    shouldForwardProp: prop => prop !== 'hover'
})<{ hover?: boolean }>(({theme, hover = true}) => ({
    borderColor: 'transparent',
    borderBottomColor: '#F1F5FA',
    fontSize: '12px',
    lineHeight: '16px',
    '&:first-of-type': {
        borderBottomColor: '#F1F5FA',
    },
    '& td': {
        borderTop: '1px solid #fff',
        borderBottom: '1px solid #fff',
        borderColor: 'inherit',
    },
    '& td:first-of-type': {
        borderLeft: '1px solid #fff',
        borderColor: 'inherit',
    },
    '& td:last-of-type': {
        borderRight: '1px solid #fff',
        borderColor: 'inherit',
    },
}))

export default PneTableRow;
