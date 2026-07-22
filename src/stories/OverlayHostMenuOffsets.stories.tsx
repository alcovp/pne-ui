import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { expect, within } from 'storybook/test'
import {
    overlayActions,
    OverlayHost,
    PAYNET_LEFT_MENU_OVERLAY_OFFSET,
} from '../index'

const menuItems = ['Dashboard', 'Transactions', 'Reports', 'Settings']

const MenuOffsetPreview = () => {
    const [settled, setSettled] = React.useState(false)
    const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth)

    React.useEffect(() => {
        overlayActions.clearSnackbars()
        overlayActions.showError({
            id: 'menu-offset-error',
            error: {
                errorId: 'story-menu-offset-500',
                messageId: 'react.unexpected.exception.message',
                details: 'Processor response: Do not honor.',
            },
        })
        const settledTimer = window.setTimeout(() => setSettled(true), 500)
        const updateViewportWidth = () => setViewportWidth(window.innerWidth)
        window.addEventListener('resize', updateViewportWidth)

        return () => {
            window.clearTimeout(settledTimer)
            window.removeEventListener('resize', updateViewportWidth)
            overlayActions.clearSnackbars()
        }
    }, [])

    return (
        <Box
            data-story-menu-shell
            data-story-overlay-settled={settled ? 'true' : 'false'}
            sx={{ bgcolor: 'grey.50', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}
        >
            <Box
                data-story-menu
                sx={{
                    bgcolor: 'background.paper',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    boxSizing: 'border-box',
                    height: 64,
                    left: 0,
                    position: 'fixed',
                    top: 0,
                    width: 48,
                    zIndex: 999,
                    '@media (min-width: 1080px)': {
                        height: '100vh',
                        width: 49,
                    },
                    '@media (min-width: 1600px)': {
                        width: 257,
                    },
                }}
            >
                <Box
                    sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        fontSize: 12,
                        fontWeight: 700,
                        height: 48,
                        justifyContent: 'center',
                    }}
                >
                    PNE
                </Box>
                <Stack
                    spacing={1}
                    sx={{
                        display: 'none',
                        p: 1,
                        '@media (min-width: 1080px)': { display: 'flex' },
                    }}
                >
                    {menuItems.map((label, index) => (
                        <Box
                            key={label}
                            sx={{
                                alignItems: 'center',
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                display: 'flex',
                                gap: 1,
                                height: 32,
                                overflow: 'hidden',
                                px: 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: 'primary.main',
                                    borderRadius: 0.75,
                                    flex: '0 0 auto',
                                    height: 24,
                                    opacity: 0.72,
                                    width: 24,
                                }}
                            />
                            <Typography
                                sx={{
                                    display: 'none',
                                    fontSize: 13,
                                    fontWeight: index === 0 ? 700 : 500,
                                    whiteSpace: 'nowrap',
                                    '@media (min-width: 1600px)': { display: 'block' },
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>
            <Box
                sx={{
                    boxSizing: 'border-box',
                    ml: 0,
                    p: 3,
                    pl: '64px',
                    '@media (min-width: 1080px)': { ml: '49px', pl: 3 },
                    '@media (min-width: 1600px)': { ml: '257px', pl: 3 },
                }}
            >
                <Typography component='h1' sx={{ fontSize: 20, fontWeight: 700, lineHeight: '28px' }}>
                    Adaptive menu offset
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: '20px', maxWidth: 680, mt: 0.5 }}>
                    The error stays 16 px from the viewport on mobile, 16 px beyond the collapsed menu at
                    1080–1599 px, and 16 px beyond the expanded menu from 1600 px.
                </Typography>
                <Typography
                    color='text.secondary'
                    data-story-viewport-width
                    sx={{ fontFamily: 'monospace', fontSize: 12, lineHeight: '18px', mt: 1 }}
                >
                    Preview iframe width: {viewportWidth}px
                </Typography>
            </Box>
            <OverlayHost leftOffset={PAYNET_LEFT_MENU_OVERLAY_OFFSET} />
        </Box>
    )
}

const createOffsetCheck = (
    viewportWidth: number,
    expectedLeft: number,
    expectedMenuWidth: number,
): NonNullable<Story['play']> => async ({ canvasElement }) => {
    const iframeDocument = canvasElement.ownerDocument
    const iframeWindow = iframeDocument.defaultView!

    await within(iframeDocument.body).findByText('Processor response: Do not honor.')

    const stack = iframeDocument.querySelector<HTMLElement>('[data-pne-overlay-stack="bottom-left"]')!
    const menu = iframeDocument.querySelector<HTMLElement>('[data-story-menu]')!

    expect(iframeWindow.innerWidth).toBe(viewportWidth)
    expect(Math.round(stack.getBoundingClientRect().left)).toBe(expectedLeft)
    expect(Math.round(menu.getBoundingClientRect().width)).toBe(expectedMenuWidth)
    expect(stack.getBoundingClientRect().right).toBeLessThanOrEqual(viewportWidth)
}

const meta = {
    title: 'pne-ui/OverlayHost/Errors/Menu offset',
    component: MenuOffsetPreview,
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof MenuOffsetPreview>

export default meta

type Story = StoryObj<typeof meta>

export const BelowDesktop1079: Story = {
    globals: { viewport: { value: 'menuBoundary1079', isRotated: false } },
    play: createOffsetCheck(1079, 16, 48),
}

export const CollapsedStart1080: Story = {
    globals: { viewport: { value: 'menuBoundary1080', isRotated: false } },
    play: createOffsetCheck(1080, 64, 49),
}

export const CollapsedEnd1599: Story = {
    globals: { viewport: { value: 'menuBoundary1599', isRotated: false } },
    play: createOffsetCheck(1599, 64, 49),
}

export const ExpandedStart1600: Story = {
    globals: { viewport: { value: 'menuBoundary1600', isRotated: false } },
    play: createOffsetCheck(1600, 272, 257),
}

export const ExpandedWide1920: Story = {
    globals: { viewport: { value: 'menuWide1920', isRotated: false } },
    play: createOffsetCheck(1920, 272, 257),
}
