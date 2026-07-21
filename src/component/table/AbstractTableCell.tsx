import React, {forwardRef} from 'react';
import {TableCell, TableCellProps} from '@mui/material';

export type AbstractTableCellProps = Omit<TableCellProps, 'ref'>

const AbstractTableCell = forwardRef<HTMLTableCellElement, AbstractTableCellProps>((props, ref) => {
    return <TableCell ref={ref} {...props}/>
})

AbstractTableCell.displayName = 'AbstractTableCell'

export default AbstractTableCell;
