import React from 'react';
import {SxProps, TableCell, TableCellProps} from '@mui/material';
import type {Theme} from '@mui/material/styles';

const AbstractHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props;

    const _sx: SxProps<Theme> = [
        {
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 'bold',
            lineHeight: '12px',
            color: (theme: Theme) => theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : '#4E5D78',
            padding: '8px',
            borderBottom: (theme: Theme) => `1px solid ${theme.palette.mode === 'dark'
                ? theme.palette.divider
                : '#b7cdda'}`
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TableCell sx={_sx} {...rest}>{children}</TableCell>
}

export default AbstractHeaderTableCell;
