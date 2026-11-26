import React from 'react'
import {SxProps} from '@mui/material/styles'
import {TableCellProps} from '@mui/material'
import PneTableCell from './PneTableCell'

export type PneTableControlCellProps = Omit<TableCellProps, 'ref'> & {selected?: boolean}

const PneTableControlCell = ({
    ref,
    ...props
}: React.PropsWithoutRef<PneTableControlCellProps> & {ref?: React.Ref<HTMLTableCellElement>}) => {
    const {sx, ...rest} = props

    const _sx: SxProps = [
        {
            padding: '0 8px',
            verticalAlign: 'middle',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    return <PneTableCell ref={ref} sx={_sx} {...rest} />
}

PneTableControlCell.displayName = 'PneTableControlCell'

export default PneTableControlCell
