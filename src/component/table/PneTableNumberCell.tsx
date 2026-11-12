import React, {forwardRef} from 'react'
import type {SxProps, Theme} from '@mui/material/styles'
import PneTableCell, {PneTableCellProps} from './PneTableCell'

/** The UI Kit mono font: digits of one width, so the numbers of a column stand under each other. */
export const PNE_MONO_FONT = '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

export type PneTableNumberCellProps = Omit<PneTableCellProps, 'align'>

const numberCellSx: SxProps<Theme> = {
    fontFamily: PNE_MONO_FONT,
    // Digits of one width in the fallback fonts too.
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    whiteSpace: 'nowrap',
}

/**
 * A cell with a number: an amount, a count, a rate (UI Kit Cell: Numbers). The value stands at the
 * right edge in the mono font and does not wrap, so the digits of a column line up.
 */
const PneTableNumberCell = forwardRef<HTMLTableCellElement, PneTableNumberCellProps>((props, ref) => {
    const {sx, ...rest} = props

    return <PneTableCell
        data-pne-cell='number'
        {...rest}
        align='right'
        ref={ref}
        sx={[numberCellSx, ...(Array.isArray(sx) ? sx : [sx])] as PneTableCellProps['sx']}
    />
})

PneTableNumberCell.displayName = 'PneTableNumberCell'

export default PneTableNumberCell
