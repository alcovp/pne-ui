import React, {forwardRef} from 'react'
import {Box} from '@mui/material'
import PneTableCell, {PneTableCellProps} from './PneTableCell'

export type PneTableActionsCellProps = PneTableCellProps

const JUSTIFY: Record<string, string> = {
    center: 'center',
    right: 'flex-end',
}

/**
 * A cell with the actions of a row (UI Kit Cell: Actions): `PneTableAction` buttons 4px apart, in
 * the middle of the row. `align` puts them at the left edge (the default), in the centre or at the
 * right edge of the cell.
 */
const PneTableActionsCell = forwardRef<HTMLTableCellElement, PneTableActionsCellProps>((props, ref) => {
    const {align, children, sx, ...rest} = props

    return <PneTableCell
        data-pne-cell='actions'
        {...rest}
        align={align}
        ref={ref}
        sx={[
            // The 24px actions stand in the 40px row with the side padding of a value.
            {padding: '0 12px'},
            ...(Array.isArray(sx) ? sx : [sx]),
        ] as PneTableCellProps['sx']}
    >
        <Box
            sx={{
                alignItems: 'center',
                display: 'flex',
                gap: '4px',
                justifyContent: JUSTIFY[align ?? ''] ?? 'flex-start',
            }}
        >
            {children}
        </Box>
    </PneTableCell>
})

PneTableActionsCell.displayName = 'PneTableActionsCell'

export default PneTableActionsCell
