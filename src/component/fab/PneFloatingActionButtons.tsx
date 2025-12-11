import React, { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import { Box, Button, Fab, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Tooltip } from '@mui/material'
import { DEFAULT_BREAKPOINTS } from '../../common/responsive/breakpoints'
import { useBreakpoint } from '../responsive/useBreakpoint'

export type PneFabAction = {
    id: string
    label: React.ReactNode
    onClick: () => void
    icon?: React.ReactNode
    disabled?: boolean
    tooltip?: string
}

export type PneFloatingActionButtonsProps = {
    actions: PneFabAction[]
    breakpoints?: readonly number[]
    mobileBreakpoint?: number
    position?: { bottom?: number; right?: number }
    fabLabel?: React.ReactNode
    fabIcon?: React.ReactNode
    className?: string
}

/**
 * Responsive FAB menu: shows a single floating button with a menu on small screens,
 * and a sticky action rail on larger screens. Breakpoint set defaults to 6-step layout.
 */
export function PneFloatingActionButtons({
    actions,
    breakpoints = DEFAULT_BREAKPOINTS,
    mobileBreakpoint = 800,
    position = { bottom: 24, right: 24 },
    fabLabel = 'Actions',
    fabIcon = <AddIcon />,
    className,
}: PneFloatingActionButtonsProps) {
    const breakpoint = useBreakpoint({ breakpoints })
    const isMobile = breakpoint <= mobileBreakpoint

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handleClose = () => setAnchorEl(null)

    const handleAction = (action: PneFabAction) => {
        handleClose()
        action.onClick()
    }

    const renderedActions = useMemo(
        () =>
            actions.map(action => (
                <Tooltip key={action.id} title={action.tooltip ?? ''} placement='left'>
                    <span>
                        <Button
                            onClick={() => handleAction(action)}
                            startIcon={action.icon}
                            disabled={action.disabled}
                            fullWidth
                            variant='contained'
                            color='primary'
                            size='small'
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                            {action.label}
                        </Button>
                    </span>
                </Tooltip>
            )),
        [actions],
    )

    if (isMobile) {
        return (
            <Box position='fixed' bottom={position.bottom ?? 24} right={position.right ?? 24} zIndex={1300} className={className}>
                <Tooltip title={fabLabel}>
                    <Fab color='primary' onClick={handleOpen} aria-label={typeof fabLabel === 'string' ? fabLabel : 'Actions'}>
                        {fabIcon}
                    </Fab>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
                    {actions.map(action => (
                        <MenuItem key={action.id} disabled={action.disabled} onClick={() => handleAction(action)}>
                            {action.icon ? <ListItemIcon>{action.icon}</ListItemIcon> : null}
                            <ListItemText>{action.label}</ListItemText>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        )
    }

    return (
        <Box position='fixed' bottom={position.bottom ?? 24} right={position.right ?? 24} zIndex={1300} className={className}>
            <Paper elevation={3} sx={{ borderRadius: 2, p: 1, minWidth: 200 }}>
                <Stack spacing={1}>{renderedActions}</Stack>
            </Paper>
        </Box>
    )
}

export default PneFloatingActionButtons
