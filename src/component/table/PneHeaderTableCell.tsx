import React from 'react';
import {SxProps} from '@mui/material/styles';
import AbstractHeaderTableCell from './AbstractHeaderTableCell';
import {TableCellProps} from '@mui/material';
import {usePneTheme} from "../../usePneTheme";
import type {TableSortOptions} from './AbstractTable';

export type PneHeaderTableCellProps = TableCellProps & {
    sortIndex?: number
    sortOptions?: TableSortOptions
}

const PneHeaderTableCell = (props: PneHeaderTableCellProps) => {
    const {
        sx,
        sortDirection,
        sortIndex,
        sortOptions,
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

    const derivedSortDirection = sortOptions && sortIndex !== undefined
        ? sortOptions.sortIndex === sortIndex ? sortOptions.order : false
        : undefined

    return <AbstractHeaderTableCell
        sortDirection={sortDirection ?? derivedSortDirection}
        sx={_sx}
        {...rest}
    >
        {children}
    </AbstractHeaderTableCell>
}

export default PneHeaderTableCell;
