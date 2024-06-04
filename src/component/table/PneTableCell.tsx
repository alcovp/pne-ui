import React from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractTableCell from './AbstractTableCell';
import {TableCellProps} from '@mui/material';
// import { usePaynetTheme } from '../../theme/usePaynetTheme';

const PneTableCell = (props: TableCellProps & { selected?: boolean }) => {
    // const theme = usePaynetTheme();

    const {
        sx,
        onClick,
        children,
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            padding: '9px 19px',
            //TODO нужно добавить тему
            // background: props.selected ? theme.palette.action.selected : '#fff',
            border: 'none',
            color: '#4E5D78',
            position: 'relative',
            cursor: onClick === undefined ? 'inherit' : 'pointer'
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <AbstractTableCell sx={_sx} onClick={onClick} {...rest}>{children}</AbstractTableCell>
}

export default PneTableCell;
