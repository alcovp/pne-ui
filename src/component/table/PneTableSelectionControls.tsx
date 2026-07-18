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
    /** Optional full-width warning or informational content. */
    status?: React.ReactNode
}

const PneTableSelectionControls = (props: PneTableSelectionControlsProps) => {
    const {
        actions,
        status,
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
        {actions !== undefined && actions !== null && typeof actions !== 'boolean' ? <Box
            {...createAutoTestAttributes('selection-actions')}
            sx={{
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'flex-end',
                minHeight: '40px',
                minWidth: 0,
            }}
        >
            {actions}
        </Box> : null}
        {status !== undefined && status !== null && typeof status !== 'boolean' ? <Box
            {...createAutoTestAttributes('selection-status')}
            sx={{
                flex: '1 0 100%',
                maxWidth: '100%',
                minWidth: 0,
                overflowWrap: 'anywhere',
            }}
        >
            {status}
        </Box> : null}
    </Box>
}

export default PneTableSelectionControls
