import React from 'react'
import {Box, BoxProps} from '@mui/material'
import {createAutoTestAttributes} from '../AutoTestAttribute'

export type PneTableSelectionControlsProps = Omit<
    BoxProps,
    'children' | 'component' | 'ref'
> & {
    /** Consumer-localized selection count/summary. */
    summary: React.ReactNode
    /** Consumer-owned Select All, Clear, and domain bulk actions. */
    actions?: React.ReactNode
}

const PneTableSelectionControls = (props: PneTableSelectionControlsProps) => {
    const {
        actions,
        summary,
        sx,
        ...rootProps
    } = props

    return <Box
        {...rootProps}
        {...createAutoTestAttributes('selection-controls')}
        sx={[
            {
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'flex-end',
                maxWidth: '100%',
                minWidth: 0,
                width: 'max-content',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        <Box
            {...createAutoTestAttributes('selection-summary')}
            aria-atomic='true'
            aria-live='polite'
            role='status'
            sx={{
                alignItems: 'center',
                display: 'flex',
                minHeight: '40px',
                minWidth: 0,
                overflowWrap: 'anywhere',
            }}
        >
            {summary}
        </Box>
        {/*
          * The actions are a transparent group: as a real box they would be one
          * flex item whose natural width rarely fits beside the summary, so the
          * whole group dropped to its own line and left the summary alone on the
          * previous one - several wasted rows at the 360px minimum supported width.
          * `display: contents` lets each action wrap individually against the
          * summary instead.
          *
          * The element keeps its autotest id and stays in the DOM as an anchor for
          * locating the actions, but it has no box of its own: it cannot be clicked
          * or measured, so target the individual actions inside it.
          */}
        {actions !== undefined && actions !== null && typeof actions !== 'boolean' ? <Box
            {...createAutoTestAttributes('selection-actions')}
            sx={{display: 'contents'}}
        >
            {actions}
        </Box> : null}
    </Box>
}

export default PneTableSelectionControls
