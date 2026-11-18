import * as React from 'react'
import {Box, Button, Stack, Tooltip, Typography} from '@mui/material'
import type {TooltipProps} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'

// The library has no tooltip of its own: these are the stories of the MUI `Tooltip` as the theme of
// pne-ui draws it (UI Kit Tooltip).
export default {
    title: 'pne-ui/Tooltip',
    component: Tooltip,
    args: {
        title: 'Refresh the list of terminals',
        placement: 'bottom',
        arrow: true,
    },
    argTypes: {
        placement: {control: 'select', options: ['top', 'bottom', 'left', 'right']},
    },
} as Meta<typeof Tooltip>

type Story = StoryObj<typeof Tooltip>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// A tooltip kept open with no animation, so the picture of a story is the same every time.
const Pinned = ({children, ...props}: Omit<TooltipProps, 'open'>) => (
    <Tooltip {...props} open slotProps={{...props.slotProps, transition: {timeout: 0}}}>
        {children}
    </Tooltip>
)

const PLACEMENTS: Array<NonNullable<TooltipProps['placement']>> = ['top', 'bottom', 'left', 'right']

/** The four sides: the 10×6 arrow points at the trigger and fills the 6px between them. */
export const Placements: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack direction='row' spacing={22} sx={{p: 3, pt: 8, pb: 8, pl: 22}}>
            {PLACEMENTS.map(placement => (
                <Pinned key={placement} placement={placement} title='Refresh the list'>
                    <Button variant='outlined'>{placement}</Button>
                </Pinned>
            ))}
        </Stack>
    ),
}

/** A long text wraps at 240px; a tooltip without the arrow keeps the same gap. */
export const LongTextAndNoArrow: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack direction='row' spacing={36} sx={{p: 3, pb: 14}}>
            <Box>
                <Typography sx={CAPTION_SX}>long text</Typography>
                <Pinned
                    placement='bottom-start'
                    title='The endpoint routes its traffic to this gate whatever the processing strategy of the project says'
                >
                    <Button variant='outlined'>Gate</Button>
                </Pinned>
            </Box>
            <Box>
                <Typography sx={CAPTION_SX}>arrow=false</Typography>
                <Pinned arrow={false} placement='bottom' title='Refresh the list'>
                    <Button variant='outlined'>Refresh</Button>
                </Pinned>
            </Box>
        </Stack>
    ),
}

export const Playground: Story = {
    render: args => (
        <Box sx={{p: 8}}>
            <Tooltip {...args}>
                <Button variant='outlined'>Hover or focus me</Button>
            </Tooltip>
        </Box>
    ),
}
