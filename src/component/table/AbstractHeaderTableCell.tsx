import React from 'react';
import {SxProps, TableCell, TableCellProps} from '@mui/material';
import type {Theme} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../createTheme';

const AbstractHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props;

    // UI Kit Cell/Header: 14/20 SemiBold over a hairline; with the line the header row is 40px high.
    const _sx: SxProps<Theme> = [
        {
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: 600,
            lineHeight: '20px',
            color: (theme: Theme) => resolvePneSemanticPalette(theme).table.header.text,
            padding: '10px 12px 9px',
            borderBottom: (theme: Theme) => `1px solid ${resolvePneSemanticPalette(theme).table.line}`,
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TableCell sx={_sx} {...rest}>{children}</TableCell>
}

export default AbstractHeaderTableCell;
