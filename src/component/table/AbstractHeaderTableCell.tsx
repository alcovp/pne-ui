import React, {use} from 'react';
import {SxProps, TableCell, TableCellProps} from '@mui/material';
import type {Theme} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../createTheme';
import {PneTableHeaderVariantContext} from './tableHeaderVariant';

const AbstractHeaderTableCell = (props: TableCellProps) => {
    const {
        sx,
        children,
        ...rest
    } = props;

    const island = use(PneTableHeaderVariantContext) === 'island';

    const _sx: SxProps<Theme> = [
        island ? islandHeaderCellSx : mainHeaderCellSx,
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TableCell sx={_sx} {...rest}>{children}</TableCell>
}

// UI Kit Cell/Header: 14/20 SemiBold over a hairline; with the line the header row is 40px high.
const mainHeaderCellSx: SxProps<Theme> = {
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '20px',
    color: (theme: Theme) => resolvePneSemanticPalette(theme).table.header.text,
    padding: '10px 12px 9px',
    borderBottom: (theme: Theme) => `1px solid ${resolvePneSemanticPalette(theme).table.line}`,
    // MUI fills a sticky header cell with the page background, a grey band over a table that stands on a
    // surface. The header that stays while the rows scroll looks as every header does: on the surface.
    '&.MuiTableCell-stickyHeader': {
        backgroundColor: (theme: Theme) => theme.palette.background.paper,
    },
}

// UI Kit Cell/Header-island: a 24px strip on the sunken fill with 12/16 Medium text and no line
// under it; the ends of the strip are rounded by 4px.
const islandHeaderCellSx: SxProps<Theme> = theme => {
    const island = resolvePneSemanticPalette(theme).table.header.island
    return {
        // `&&`: a consumer's header cell sets its own transparent background over the main header.
        '&&': {backgroundColor: island.fill},
        borderBottom: 'none',
        color: island.text,
        fontSize: '12px',
        fontStyle: 'normal',
        fontWeight: 500,
        lineHeight: '16px',
        padding: '4px 12px',
        // A sort label is an inline box: on the baseline it makes the 16px line a little higher.
        '& .MuiTableSortLabel-root': {verticalAlign: 'top'},
        '&:first-of-type': {borderBottomLeftRadius: '4px', borderTopLeftRadius: '4px'},
        '&:last-of-type': {borderBottomRightRadius: '4px', borderTopRightRadius: '4px'},
    }
}

export default AbstractHeaderTableCell;
