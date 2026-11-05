import React from 'react'
import {Box, BoxProps, Theme} from '@mui/material'
import {createAutoTestAttributes} from '../AutoTestAttribute'
import {TABLE_CONTROL_HOVER_TEXT_COLOR} from './tableControlColors'
import {TABLE_CONTROL_GAP, TABLE_CONTROL_SIZE} from './tableControlMetrics'

export type PneTableSelectionControlsProps = Omit<
    BoxProps,
    'children' | 'component' | 'ref'
> & {
    /** Consumer-localized selection count/summary; leave it out while nothing is selected. */
    summary?: React.ReactNode
    /** Consumer-owned Select All, Clear, and domain bulk actions, e.g. `PneTableControlButton`s. */
    actions?: React.ReactNode
}

const PneTableSelectionControls = (props: PneTableSelectionControlsProps) => {
    const {
        actions,
        summary,
        sx,
        ...rootProps
    } = props
    const hasSummary = summary !== undefined && summary !== null && typeof summary !== 'boolean'

    return <Box
        {...rootProps}
        {...createAutoTestAttributes('selection-controls')}
        sx={[
            {
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                // Everything of the selection stands 4px apart, in a row and between wrapped rows.
                gap: `${TABLE_CONTROL_GAP}px`,
                justifyContent: 'flex-end',
                maxWidth: '100%',
                minWidth: 0,
                width: 'max-content',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        {hasSummary ? <Box
            {...createAutoTestAttributes('selection-summary')}
            aria-atomic='true'
            aria-live='polite'
            role='status'
            sx={(theme: Theme) => ({
                alignItems: 'center',
                color: theme.palette.pne?.control.foregroundHover ?? TABLE_CONTROL_HOVER_TEXT_COLOR,
                display: 'flex',
                fontSize: '14px',
                lineHeight: '20px',
                minHeight: `${TABLE_CONTROL_SIZE}px`,
                minWidth: 0,
                overflowWrap: 'anywhere',
            })}
        >
            {summary}
        </Box> : null}
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
