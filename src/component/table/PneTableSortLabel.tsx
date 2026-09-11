import React from 'react';
import {SxProps, type Theme} from '@mui/material/styles';
import {TableSortLabel, tableSortLabelClasses, TableSortLabelProps} from '@mui/material';
import {TableSortOptions} from './AbstractTable';

type TableSortLabelPropsOmittingUnion = 'active' | 'direction' | 'onClick'

interface PneTableSortLabelProps extends Omit<TableSortLabelProps, TableSortLabelPropsOmittingUnion> {
    sortOptions?: TableSortOptions
    sortIndex: number
}

const PneTableSortLabel = (props: PneTableSortLabelProps) => {
    const {
        sx,
        sortOptions = {
            sortIndex: 1,
            order: 'asc',
            setSortIndex: () => {throw new Error('Undefined sortOptions.setSortIndex')},
            setOrder: () => {throw new Error('Undefined sortOptions.setOrder')},
            onSortChange: () => {throw new Error('Undefined sortOptions.onSortChange')},
        },
        sortIndex,
        children,
        ...rest
    } = props;

    const _sx: SxProps<Theme> = [
        {
            [`&.${tableSortLabelClasses.active}`]: {
                color: (theme: Theme) => theme.palette.mode === 'dark'
                    ? theme.palette.pne.brand.foreground
                    : '#809EAE',
            }
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TableSortLabel
        active={sortOptions.sortIndex === sortIndex}
        direction={sortOptions.sortIndex === sortIndex ? sortOptions.order : 'asc'}
        onClick={() => {
            if (sortOptions) {
                sortOptions.setSortIndex(sortIndex);
                if (sortIndex === sortOptions.sortIndex) {
                    const order = sortOptions.order === 'asc' ? 'desc' : 'asc';
                    sortOptions.setOrder(order);
                    sortOptions.onSortChange(sortIndex, order)
                } else {
                    sortOptions.setOrder('asc');
                    sortOptions.onSortChange(sortIndex, 'asc')
                }
            }
        }}
        sx={_sx}
        {...rest}
    >
        {children}
    </TableSortLabel>
}

export default PneTableSortLabel;
