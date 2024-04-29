import {styled} from '@mui/material/styles';
import {TableRow} from '@mui/material';

const PneTableRow = styled(TableRow, {
    shouldForwardProp: prop => prop !== 'hover'
})<{ hover?: boolean }>(({theme, hover = true}) => ({
    borderColor: 'solid 1px grey',
    fontSize: '14px',
    lineHeight: '24px',
    '&:hover': {
        //TODO добавить тему
        // color: hover ? theme.skin.experimentalColor : '',
        // borderColor: hover ? theme.skin.experimentalColor : '',
    },
    '& td': {
        borderTop: '1px solid #fff',
        borderBottom: '1px solid #fff',
        borderColor: 'inherit',
    },
    '& td:first-of-type': {
        borderLeft: '1px solid #fff',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderColor: 'inherit',
    },
    '& td:last-of-type': {
        borderRight: '1px solid #fff',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        borderColor: 'inherit',
    },
}))

export default PneTableRow;
