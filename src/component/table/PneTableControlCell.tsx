import React, {forwardRef} from 'react';
import {SxProps} from '@mui/material/styles';
import {TableCellProps} from '@mui/material';
import PneTableCell from './PneTableCell';

export type PneTableControlCellProps = Omit<TableCellProps, 'ref'> & { selected?: boolean }

const PneTableControlCell = forwardRef<HTMLTableCellElement, PneTableControlCellProps>((props, ref) => {
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

    return <PneTableCell ref={ref} sx={_sx} {...rest}/>
})

PneTableControlCell.displayName = 'PneTableControlCell'

export default PneTableControlCell;
