import {Box, Typography} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import {expect, waitFor, within} from 'storybook/test'
import * as React from 'react'

import {PneButton, PneCoachmark, PneModalActions} from '../index'

const COACHMARK_WIDTH = 'min(560px, calc(100vw - 32px))'

type CoachmarkHarnessProps = {
    actions: (close: () => void) => React.ReactNode
    anchorLabel?: string
    anchored?: boolean
    body: string
    subtitle?: string
    title: string
}

const CoachmarkHarness = ({
    actions,
    anchorLabel = 'Widget help',
    anchored = true,
    body,
    subtitle,
    title,
}: CoachmarkHarnessProps) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const [open, setOpen] = React.useState(true)
    const close = React.useCallback(() => setOpen(false), [])

    return <Box
        sx={{
            minHeight: 520,
            p: 4,
        }}
    >
        {anchored ? <Box
            component='span'
            data-story-coachmark-anchor='true'
            ref={setAnchorEl}
            sx={{display: 'inline-flex'}}
        >
            <PneButton pneStyle='neutral'>{anchorLabel}</PneButton>
        </Box> : null}
        <PneCoachmark
            actions={actions(close)}
            anchorEl={anchored ? anchorEl : null}
            closeLabel='Close coachmark'
            containerSx={{width: COACHMARK_WIDTH}}
            modifiers={[
                {name: 'offset', options: {offset: [0, 12]}},
                {name: 'preventOverflow', options: {padding: 16}},
                {name: 'flip', options: {padding: 16}},
            ]}
            onClose={close}
            open={open}
            placement='bottom-start'
            subtitle={subtitle}
            title={title}
        >
            <Typography sx={{color: 'text.secondary', fontSize: 14, lineHeight: '20px'}}>
                {body}
            </Typography>
        </PneCoachmark>
    </Box>
}

const InvitationActions = ({close}: {close: () => void}) => <PneModalActions
    leading={<PneButton pneStyle='text' onClick={close}>Do not offer again</PneButton>}
    secondary={<PneButton pneStyle='outlined' onClick={close}>Not now</PneButton>}
    primary={<PneButton pneStyle='contained'>Show me</PneButton>}
/>

const WizardActions = ({close}: {close: () => void}) => <PneModalActions
    leading={<PneButton pneStyle='text' onClick={close}>Continue later</PneButton>}
    secondary={<PneButton pneStyle='outlined'>Back</PneButton>}
    primary={<PneButton pneStyle='contained'>Next</PneButton>}
/>

const getRenderedCoachmark = async (canvasElement: HTMLElement, name: string) => {
    const iframeDocument = canvasElement.ownerDocument
    const documentCanvas = within(iframeDocument.body)
    const dialog = await documentCanvas.findByRole('dialog', {name})
    const surface = dialog.closest<HTMLElement>('[data-pne-coachmark-container="true"]')

    expect(surface).toBe(dialog)
    expect(dialog).toHaveAttribute('aria-modal', 'false')
    if (!surface) throw new Error('Coachmark surface did not render')

    return {dialog, iframeDocument, surface}
}

const meta = {
    title: 'pne-ui/PneCoachmark',
    component: PneCoachmark,
    args: {
        onClose: () => undefined,
        open: true,
        title: 'Coachmark',
    },
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'A non-modal instructional surface that follows an anchor when available and centers safely when the anchor is missing. Compose actions with PneModalActions so hierarchy, spacing, and responsive order stay consistent.',
            },
        },
    },
} satisfies Meta<typeof PneCoachmark>

export default meta
type Story = StoryObj<typeof meta>

export const AnchoredInvitation: Story = {
    name: 'Anchored invitation — three actions',
    globals: {
        viewport: {
            value: 'tablet600',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'An optional invitation remains anchored to its quiet trigger. Above 480px all three default-size actions stay in one 40px row with single-line labels.',
            },
        },
    },
    play: async ({canvasElement}) => {
        const {dialog, iframeDocument, surface} = await getRenderedCoachmark(
            canvasElement,
            'New: customize your widgets',
        )
        const anchor = within(canvasElement).getByRole('button', {name: 'Widget help'})
        const popper = iframeDocument.body.querySelector<HTMLElement>(
            '[data-pne-coachmark-popper="true"]',
        )

        expect(popper).toBeVisible()
        expect(iframeDocument.body.querySelector('[data-pne-coachmark-fallback="true"]'))
            .toBeNull()
        expect(within(dialog).getByRole('button', {name: 'Close coachmark'})).toBeVisible()
        const actions = dialog.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!
        const actionButtons = within(actions).getAllByRole('button')
        expect(iframeDocument.defaultView?.innerWidth).toBe(600)
        expect(actionButtons.map(button => button.textContent))
            .toEqual(['Do not offer again', 'Not now', 'Show me'])

        await waitFor(() => {
            const anchorRect = anchor.getBoundingClientRect()
            const surfaceRect = surface.getBoundingClientRect()
            const actionsRect = actions.getBoundingClientRect()
            const buttonRects = actionButtons.map(button => button.getBoundingClientRect())

            expect(surfaceRect.top).toBeGreaterThanOrEqual(anchorRect.bottom)
            expect(Math.abs(surfaceRect.left - anchorRect.left)).toBeLessThanOrEqual(1)
            expect(actionsRect.height).toBe(40)
            expect(Math.max(...buttonRects.map(rect => rect.top))
                - Math.min(...buttonRects.map(rect => rect.top))).toBeLessThanOrEqual(1)
            actionButtons.forEach((button, index) => {
                expect(buttonRects[index].height).toBe(40)
                expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1)
                expect(getComputedStyle(button).whiteSpace).toBe('nowrap')
                expect(getComputedStyle(button).flexShrink).toBe('0')
            })
        })
    },
    render: () => <CoachmarkHarness
        actions={close => <InvitationActions close={close}/>}
        body='Change widget order, width, and visibility in a quick guided tour.'
        title='New: customize your widgets'
    />,
}

export const AnchoredWizardStep: Story = {
    name: 'Anchored wizard — standard action slots',
    parameters: {
        docs: {
            description: {
                story: 'Continue later is a low-emphasis leading action; Back and Next form the trailing secondary/primary navigation group.',
            },
        },
    },
    play: async ({canvasElement}) => {
        const {dialog} = await getRenderedCoachmark(canvasElement, 'Move and resize widgets')
        const actions = dialog.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!

        expect(within(actions).getAllByRole('button').map(button => button.textContent))
            .toEqual(['Continue later', 'Back', 'Next'])
        expect(getComputedStyle(actions).gap).toBe('8px')
    },
    render: () => <CoachmarkHarness
        actions={close => <WizardActions close={close}/>}
        anchorLabel='Highlighted widget'
        body='Drag a widget by its header. Use the side rails to change only its width.'
        subtitle='Step 2 of 5'
        title='Move and resize widgets'
    />,
}

export const CenteredFallback: Story = {
    name: 'Centered fallback — missing anchor',
    parameters: {
        docs: {
            description: {
                story: 'If a responsive target unmounts or cannot be resolved, the same accessible surface remains available in the viewport center.',
            },
        },
    },
    play: async ({canvasElement}) => {
        const {iframeDocument, surface} = await getRenderedCoachmark(
            canvasElement,
            'Widget help is still available',
        )
        const iframeWindow = iframeDocument.defaultView!
        const fallback = iframeDocument.body.querySelector<HTMLElement>(
            '[data-pne-coachmark-fallback="true"]',
        )
        const surfaceRect = surface.getBoundingClientRect()

        expect(fallback).toBeVisible()
        expect(iframeDocument.body.querySelector('[data-pne-coachmark-popper="true"]')).toBeNull()
        expect(Math.abs(surfaceRect.left + surfaceRect.width / 2 - iframeWindow.innerWidth / 2))
            .toBeLessThanOrEqual(1)
        expect(Math.abs(surfaceRect.top + surfaceRect.height / 2 - iframeWindow.innerHeight / 2))
            .toBeLessThanOrEqual(1)
    },
    render: () => <CoachmarkHarness
        actions={close => <PneModalActions
            primary={<PneButton pneStyle='contained' onClick={close}>Close</PneButton>}
        />}
        anchored={false}
        body='The requested target is not mounted at this board size, so this coachmark is centered instead.'
        title='Widget help is still available'
    />,
}

export const ResponsiveActions: Story = {
    name: 'Responsive actions — 360px',
    globals: {
        viewport: {
            value: 'mobile360',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'At 360px the primary action moves first, followed by the secondary and leading actions; every action becomes a separate full-width row.',
            },
        },
    },
    play: async ({canvasElement}) => {
        const {dialog, iframeDocument, surface} = await getRenderedCoachmark(
            canvasElement,
            'Move and resize widgets',
        )
        const iframeWindow = iframeDocument.defaultView!
        const actions = dialog.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!
        const buttons = within(actions).getAllByRole('button')
        const surfaceRect = surface.getBoundingClientRect()

        expect(iframeWindow.innerWidth).toBe(360)
        expect(buttons.map(button => button.textContent))
            .toEqual(['Next', 'Back', 'Continue later'])
        expect(actions.scrollWidth).toBeLessThanOrEqual(actions.clientWidth + 1)
        expect(surfaceRect.left).toBeGreaterThanOrEqual(16)
        expect(surfaceRect.right).toBeLessThanOrEqual(iframeWindow.innerWidth - 16)
        const buttonRects = buttons.map(button => button.getBoundingClientRect())
        buttons.forEach((button, index) => {
            expect(Math.abs(buttonRects[index].width - actions.clientWidth))
                .toBeLessThanOrEqual(1)
            expect(buttonRects[index].height).toBe(40)
            if (index > 0) {
                expect(buttonRects[index].top).toBeGreaterThanOrEqual(
                    buttonRects[index - 1].bottom + 7,
                )
            }
        })
    },
    render: () => <CoachmarkHarness
        actions={close => <WizardActions close={close}/>}
        anchorLabel='Highlighted widget'
        body='Long localized actions remain fully readable without clipping or horizontal overflow.'
        subtitle='Step 2 of 5'
        title='Move and resize widgets'
    />,
}
