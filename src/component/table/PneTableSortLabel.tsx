import React from 'react';
import {SxProps, type Theme} from '@mui/material/styles';
import {TableSortLabel, tableSortLabelClasses, TableSortLabelProps} from '@mui/material';
import {TableSortOptions} from './AbstractTable';
import {resolvePneSemanticPalette} from '../../createTheme';

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

    const _sx: SxProps<Theme> = [pneTableSortLabelSx, ...(Array.isArray(sx) ? sx : [sx])]

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
        IconComponent={PneSortIcon}
        sx={_sx}
        {...rest}
    >
        {children}
    </TableSortLabel>
}

// UI Kit Sort glyph (Ic/Arrow/Arrow-up-down): the up arrow on the left, the down arrow on the right.
const PneSortIcon = ({className}: {className?: string}) => (
    <svg
        aria-hidden='true'
        className={className}
        fill='none'
        height='16'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
        width='16'
    >
        <g className='PneTableSortLabel-up' stroke='currentColor'><path d='M7 20V5'/><path d='M4 7.5 7 4.5l3 3'/></g>
        <g className='PneTableSortLabel-down' stroke='currentColor'><path d='M17 4v15'/><path d='M14 16.5l3 3 3-3'/></g>
    </svg>
)

/**
 * The sort sign of a header by the UI Kit: both arrows stand beside the label at all times. On the
 * sorted column the direction in force reads as a link and the other one is dimmed; on the others
 * both are grey and take the link colour under the pointer. The label keeps the header colour.
 */
const pneTableSortLabelSx: SxProps<Theme> = theme => {
    const sort = resolvePneSemanticPalette(theme).table.sort
    const icon = `& .${tableSortLabelClasses.icon}`
    const active = `&.${tableSortLabelClasses.active}`
    return {
        color: 'inherit',
        '&:hover, &:focus': {
            color: 'inherit',
        },
        [active]: {
            color: 'inherit',
        },
        // MUI hides the icon of an unsorted column and turns it over for the direction.
        [`${icon}, ${active} ${icon.slice(2)}`]: {
            color: sort.idle,
            fontSize: '16px',
            marginLeft: '4px',
            marginRight: 0,
            opacity: 1,
            transform: 'none',
        },
        [`&:hover ${icon.slice(2)}`]: {
            color: sort.active,
            opacity: 1,
        },
        [`${active}.${tableSortLabelClasses.directionAsc} .PneTableSortLabel-up, `
            + `${active}.${tableSortLabelClasses.directionDesc} .PneTableSortLabel-down`]: {
            stroke: sort.active,
        },
        [`${active}.${tableSortLabelClasses.directionAsc} .PneTableSortLabel-down, `
            + `${active}.${tableSortLabelClasses.directionDesc} .PneTableSortLabel-up`]: {
            stroke: sort.inactive,
        },
    }
}

export default PneTableSortLabel;
