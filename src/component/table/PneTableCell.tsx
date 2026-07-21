import React, {forwardRef} from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractTableCell from './AbstractTableCell';
import {TableCellProps} from '@mui/material';
import {usePneTheme} from '../../usePneTheme';

export type PneTableCellProps = Omit<TableCellProps, 'ref'> & { selected?: boolean }

const PneTableCell = forwardRef<HTMLTableCellElement, PneTableCellProps>((props, ref) => {
    const theme = usePneTheme()

    const {
        sx,
        onClick,
        children,
        selected,
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            padding: '8px',
            background: selected ? theme.palette.action.selected : 'inherit',
            border: 'none',
            color: '#4E5D78',
            position: 'relative',
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <AbstractTableCell ref={ref} sx={_sx} onClick={onClick} {...rest}>{children}</AbstractTableCell>
})

PneTableCell.displayName = 'PneTableCell'

export default PneTableCell;
