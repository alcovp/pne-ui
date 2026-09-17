import React from 'react'
import {Box, BoxProps, SxProps, Theme} from '@mui/material'
import {createAutoTestAttributes} from '../AutoTestAttribute'

type PneTableToolbarAccessibleName =
    | {
        'aria-label': string
        'aria-labelledby'?: never
    }
    | {
        'aria-label'?: never
        'aria-labelledby': string
    }

export type PneTableToolbarProps = Omit<
    BoxProps,
    'aria-label' | 'aria-labelledby' | 'children' | 'component' | 'ref'
> & PneTableToolbarAccessibleName & {
    /** Contextual controls such as current selection and bulk actions. */
    contextual?: React.ReactNode
    /** Persistent controls such as a table View selector. */
    persistent?: React.ReactNode
}

/** Gap between the control groups, and between the rows they wrap onto. */
const CONTROL_GROUP_GAP = 8

/**
 * Each control group claims its natural single-row width (`flex-basis:
 * max-content`), so the browser moves the whole group onto the next row rather
 * than squeezing it - the group is never split mid-way. `flex-shrink: 1` then
 * lets a group that already owns a row use that row and wrap inside itself.
 *
 * The band therefore reads its layout from the width the parent offers and from
 * the intrinsic width of its content, and never from the layout it is currently
 * rendering. That is what keeps it stable: a responsive decision that measures
 * its own result feeds back into itself, and with fractional CSS pixels the
 * feedback oscillates.
 */
const groupSx: SxProps<Theme> = {
    alignItems: 'center',
    display: 'flex',
    flexBasis: 'max-content',
    flexGrow: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    minWidth: 0,
}

const PneTableToolbar = (props: PneTableToolbarProps) => {
    const {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        contextual,
        persistent,
        sx,
        ...rootProps
    } = props
    const hasContextual = contextual !== undefined
        && contextual !== null
        && typeof contextual !== 'boolean'
    const hasPersistent = persistent !== undefined
        && persistent !== null
        && typeof persistent !== 'boolean'

    return <Box
        {...rootProps}
        {...createAutoTestAttributes('table-control-bar')}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        role='group'
        sx={[
            {
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${CONTROL_GROUP_GAP}px`,
                justifyContent: 'flex-end',
                minWidth: 0,
                width: '100%',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        {hasContextual ? <Box
            {...createAutoTestAttributes('table-contextual-controls')}
            key='contextual'
            sx={groupSx}
        >
            {contextual}
        </Box> : null}
        {hasPersistent ? <Box
            {...createAutoTestAttributes('table-persistent-controls')}
            key='persistent'
            sx={groupSx}
        >
            {persistent}
        </Box> : null}
    </Box>
}

export default PneTableToolbar
