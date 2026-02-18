import React from 'react';
import {SxProps} from '@mui/material/styles';
import {TableCellProps} from '@mui/material';
import PneTableCell from './PneTableCell';

const PneTableControlCell = (props: TableCellProps & { selected?: boolean }) => {
    const {
        sx,
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            padding: '0 8px',
            verticalAlign: 'middle',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
    ];

    return <PneTableCell sx={_sx} {...rest}/>
}

export default PneTableControlCell;
