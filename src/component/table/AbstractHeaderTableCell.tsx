import React from 'react';
import {SxProps, TableCell, TableCellProps} from '@mui/material';

const AbstractHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 'bold',
            lineHeight: '12px',
            color: '#4E5D78',
            padding: '12px 19px',
            borderBottom: '1px solid #b7cdda'
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TableCell sx={_sx} {...rest}>{children}</TableCell>
}

export default AbstractHeaderTableCell;