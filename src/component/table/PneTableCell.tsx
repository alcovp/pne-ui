import React, {forwardRef} from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractTableCell from './AbstractTableCell';
import {TableCellProps} from '@mui/material';
import {usePneTheme} from '../../usePneTheme';
import {resolvePneSemanticPalette} from '../../createTheme';

export type PneTableCellProps = Omit<TableCellProps, 'ref'> & { selected?: boolean }

// 10 + 20 + 9 and the 1px line of the row make the 40px of the UI Kit row.
const CELL_PADDING = '10px 12px 9px'

const PneTableCell = forwardRef<HTMLTableCellElement, PneTableCellProps>((props, ref) => {
    const theme = usePneTheme()

    const {
        sx,
        onClick,
        children,
        selected,
        ...rest
    } = props;

    const table = resolvePneSemanticPalette(theme).table
    // UI Kit Cell: 12px at the sides, the 14/20 text of a value; with its line a one-line row is 40px high.
    const _sx: SxProps = [
        {
            padding: CELL_PADDING,
            background: selected ? table.row.selected : 'inherit',
            border: 'none',
            color: table.text,
            fontSize: '14px',
            lineHeight: '20px',
            position: 'relative',
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <AbstractTableCell ref={ref} sx={_sx} onClick={onClick} {...rest}>{children}</AbstractTableCell>
})

PneTableCell.displayName = 'PneTableCell'

export default PneTableCell;
