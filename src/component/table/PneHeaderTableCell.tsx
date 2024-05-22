import React from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractHeaderTableCell from './AbstractHeaderTableCell';
import {TableCellProps} from '@mui/material';

const PneHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            //TODO use theme
            borderBottom: '1px solid #D3E7FF',
            background: 'transparent',
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <AbstractHeaderTableCell sx={_sx} {...rest}>{children}</AbstractHeaderTableCell>
}

export default PneHeaderTableCell;