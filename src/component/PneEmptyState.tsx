import React from 'react'
import Box from '@mui/material/Box'
import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../createTheme'

export type PneEmptyStateProps = {
    /** The message: what is not here. */
    children: React.ReactNode
    sx?: SxProps<Theme>
}

/**
 * UI Kit Empty state, the look only: a message in the middle under a glyph in a 48px round fill, 14/20
 * Medium. An empty `PneTable` draws it itself; a list or a panel of the page that has nothing to show
 * says so the same way. It knows no more than its message: no description and no action.
 */
const PneEmptyState = ({children, sx}: PneEmptyStateProps) => <Box
    data-pne-empty-state=''
    sx={[emptyStateSx, ...(Array.isArray(sx) ? sx : [sx])]}
>
    <Box aria-hidden='true' component='span' sx={signSx}>
        <EmptyStateGlyph/>
    </Box>
    <span>{children}</span>
</Box>

PneEmptyState.displayName = 'PneEmptyState'

export default PneEmptyState

const emptyStateSx: SxProps<Theme> = theme => ({
    alignItems: 'center',
    boxSizing: 'border-box',
    color: resolvePneSemanticPalette(theme).table.text,
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    fontWeight: 500,
    gap: '8px',
    lineHeight: '20px',
    textAlign: 'center',
})

const signSx: SxProps<Theme> = theme => {
    const empty = resolvePneSemanticPalette(theme).table.empty
    return {
        alignItems: 'center',
        backgroundColor: empty.fill,
        borderRadius: '50%',
        color: empty.icon,
        display: 'flex',
        height: '48px',
        justifyContent: 'center',
        width: '48px',
    }
}

// UI Kit IcActionSearch: nothing was found.
const EmptyStateGlyph = () => (
    <svg
        fill='none'
        height='24'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
        width='24'
    >
        <circle cx='11' cy='11' r='7'/>
        <path d='M16.5 16.5 20 20'/>
    </svg>
)
