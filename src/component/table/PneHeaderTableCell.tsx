import React from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractHeaderTableCell from './AbstractHeaderTableCell';
import {TableCellProps} from '@mui/material';
import {usePneTheme} from "../../usePneTheme";

const PneHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props

    const theme = usePneTheme()

    const _sx: SxProps = [
        {
            borderBottom: `1px solid ${theme.palette.primary.light}`,
            background: 'transparent',
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <AbstractHeaderTableCell sx={_sx} {...rest}>{children}</AbstractHeaderTableCell>
}

export default PneHeaderTableCell;