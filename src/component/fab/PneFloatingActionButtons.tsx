import React, { useEffect, useState } from 'react'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Divider, Fab, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip } from '@mui/material'
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

export type PneFabContent = {
    id: string
    kind: 'content'
    node: React.ReactNode
}

export type PneFabDivider = {
    id: string
    kind: 'divider'
}

export type PneFabItem = PneFabAction | PneFabContent | PneFabDivider

const isContentItem = (item: PneFabItem): item is PneFabContent => 'kind' in item && item.kind === 'content'
const isDividerItem = (item: PneFabItem): item is PneFabDivider => 'kind' in item && item.kind === 'divider'
const isActionItem = (item: PneFabItem): item is PneFabAction => !isContentItem(item) && !isDividerItem(item)

export type PneFloatingActionButtonsProps = {
    actions: PneFabItem[]
    breakpoints?: readonly number[]
    mobileBreakpoint?: number
    position?: { bottom?: number; right?: number }
    fabLabel?: React.ReactNode
    fabIcon?: React.ReactNode
    className?: string
    bannerText?: React.ReactNode
}

/**
 * Floating action menu:
 * - on mobile: actions/content rendered inside a Menu
 * - on desktop: actions rendered as floating Fabs stacked above the trigger; Menu still opens for content/banner
 * Actions array may include content blocks (`{ kind: 'content', node: <...> }`) to embed custom UI.
 */
export function PneFloatingActionButtons({
    actions,
    breakpoints = DEFAULT_BREAKPOINTS,
    mobileBreakpoint = 800,
    position,
    fabLabel = 'Actions',
    fabIcon = <EditIcon />,
    className,
    bannerText,
}: PneFloatingActionButtonsProps) {
    const breakpoint = useBreakpoint({ breakpoints })
    const isMobile = breakpoint < mobileBreakpoint
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handleClose = () => setAnchorEl(null)

    const handleAction = (action: PneFabAction) => {
        handleClose()
        action.onClick()
    }

    const handleScrollTop = () => {
        if (typeof window === 'undefined') return
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const renderMenuItems = (items: PneFabItem[]) =>
        items.map(item =>
            isContentItem(item) ? (
                <Box key={item.id}>
                    {item.node}
                </Box>
            ) : isDividerItem(item) ? (
                <Divider key={item.id} component='li' role='presentation' sx={{ my: 2 }} />
            ) : isActionItem(item) ? (
                <MenuItem
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => handleAction(item)}
                    sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }} sx={{ flex: 1 }}>
                        {item.label}
                    </ListItemText>
                    {item.icon ? (
                        <Box component='span' sx={{ display: 'inline-flex', color: 'inherit', lineHeight: 0 }}>
                            {item.icon}
                        </Box>
                    ) : null}
                </MenuItem>
            ) : null,
        )

    // Desktop: keep actions both in the floating stack and inside the menu
    const menuItems = actions
    const actionItems = isMobile ? [] : actions.filter(isActionItem)
    const fabSx = isMobile ? { opacity: 0.85 } : { opacity: 0.3 }
    const stackSx = isMobile ? undefined : { '&:hover .pne-fab': { opacity: 0.85 } }
    const baseOffset = isMobile ? 16 : 24
    const bottomOffset = position?.bottom ?? baseOffset
    const rightOffset = position?.right ?? baseOffset
    const containerSx = {
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        right: `calc(${rightOffset}px + env(safe-area-inset-right, 0px))`,
    }

    useEffect(() => {
        if (typeof window === 'undefined') return
        let frameId: number | null = null
        const update = () => {
            frameId = null
            const offset = window.scrollY ?? document.documentElement.scrollTop ?? 0
            setShowScrollTop(offset > 16)
        }
        update()
        const handleScroll = () => {
            if (frameId !== null) return
            frameId = window.requestAnimationFrame(update)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId)
            }
        }
    }, [])

    return (
        <Box position='fixed' zIndex={1300} className={className} sx={containerSx}>
            <Stack spacing={1} alignItems='flex-end' sx={stackSx}>
                {showScrollTop ? (
                    <Tooltip title='Scroll to top' placement='left' disableInteractive>
                        <span>
                            <Fab
                                className='pne-fab'
                                color='primary'
                                size='small'
                                onClick={handleScrollTop}
                                aria-label='Scroll to top'
                                sx={fabSx}
                            >
                                <ArrowUpwardIcon fontSize='small' />
                            </Fab>
                        </span>
                    </Tooltip>
                ) : null}
                {!isMobile
                    ? actionItems.map(item => {
                        const title =
                            item.tooltip ?? (typeof item.label === 'string' ? item.label : typeof fabLabel === 'string' ? fabLabel : 'Action')
                        return (
                            <Tooltip key={item.id} title={title} placement='left' disableInteractive>
                                <span>
                                    <Fab
                                        className='pne-fab'
                                        color='primary'
                                        size='small'
                                        onClick={() => handleAction(item)}
                                        aria-label={typeof title === 'string' ? title : 'Action'}
                                        sx={fabSx}
                                    >
                                        {item.icon ?? (typeof item.label === 'string' ? item.label.charAt(0) : fabIcon)}
                                    </Fab>
                                </span>
                            </Tooltip>
                        )
                    })
                    : null}
                <Tooltip title={fabLabel} disableInteractive>
                    <Fab
                        className='pne-fab'
                        color='primary'
                        size='small'
                        onClick={handleOpen}
                        aria-label={typeof fabLabel === 'string' ? fabLabel : 'Actions'}
                        sx={fabSx}
                    >
                        {fabIcon}
                    </Fab>
                </Tooltip>
            </Stack>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                MenuListProps={{ sx: { py: 0 } }}
            >
                {renderMenuItems(menuItems)}
                {bannerText ? (
                    <MenuItem
                        disabled
                        sx={{
                            pointerEvents: 'none',
                            bgcolor: theme => theme.palette.primary.main,
                            color: theme => theme.palette.primary.contrastText,
                            '&.Mui-disabled': { opacity: 1 },
                            minHeight: 60,
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{fabIcon}</ListItemIcon>
                        <ListItemText
                            primaryTypographyProps={{
                                fontWeight: 600,
                                fontSize: '20px',
                            }}
                        >
                            {bannerText}
                        </ListItemText>
                    </MenuItem>
                ) : null}
            </Menu>
        </Box>
    )
}

export default PneFloatingActionButtons
