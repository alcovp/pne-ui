import React from 'react'
import {TableCell, TableCellProps} from '@mui/material'

export type AbstractTableCellProps = Omit<TableCellProps, 'ref'>

const AbstractTableCell = ({
    ref,
    ...props
}: React.PropsWithoutRef<AbstractTableCellProps> & {ref?: React.Ref<HTMLTableCellElement>}) => {
    return <TableCell ref={ref} {...props} />
}

AbstractTableCell.displayName = 'AbstractTableCell'

export default AbstractTableCell
