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
          * `display: contents` keeps the Selenium hook in the DOM while letting the
          * actions share wrap lines with the summary. As a real box the group is a
          * single flex item whose unwrapped width rarely fits beside the summary, so
          * it always dropped to its own line and left the summary on a row of its
          * own - several wasted rows at the 360px minimum supported width.
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
