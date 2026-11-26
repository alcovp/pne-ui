import * as React from 'react'
import {Box, Chip, Stack, Typography} from '@mui/material'
import type {ChipProps} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'

// The library has no chip of its own: these are the stories of the MUI `Chip` as the theme of
// pne-ui draws it (UI Kit Badge).
export default {
    title: 'pne-ui/Chip',
    component: Chip,
    args: {
        label: 'Visa',
        size: 'medium',
        variant: 'filled',
        disabled: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium']},
        variant: {control: 'inline-radio', options: ['filled', 'outlined']},
        color: {control: 'select', options: ['default', 'primary', 'success', 'error', 'warning', 'info']},
    },
} as Meta<typeof Chip>

type Story = StoryObj<typeof Chip>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const
const noop = () => undefined

type Row = {label: string; props: ChipProps}

const KINDS: Row[] = [
    {label: 'read-only', props: {}},
    {label: 'removable', props: {onDelete: noop}},
    {label: 'clickable', props: {onClick: noop}},
    {label: 'clickable, removable', props: {onClick: noop, onDelete: noop}},
    {label: 'disabled', props: {disabled: true, onDelete: noop}},
]

const LOOKS: Row[] = [
    {label: 'filled', props: {}},
    {label: 'outlined', props: {variant: 'outlined'}},
    {label: 'filled primary', props: {color: 'primary'}},
    {label: 'outlined primary', props: {color: 'primary', variant: 'outlined'}},
    {label: 'filled success', props: {color: 'success'}},
    {label: 'filled error', props: {color: 'error'}},
    {label: 'filled warning', props: {color: 'warning'}},
    {label: 'filled info', props: {color: 'info'}},
]

const Matrix = ({size}: {size: 'small' | 'medium'}) => (
    <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 8px', ml: -2}}>
        <thead>
            <tr>
                <Box component='th' sx={{...CAPTION_SX, fontWeight: 400, textAlign: 'left'}}>
                    {size}
                </Box>
                {KINDS.map(kind => (
                    <Box component='th' key={kind.label} sx={{...CAPTION_SX, fontWeight: 400, textAlign: 'left'}}>
                        {kind.label}
                    </Box>
                ))}
            </tr>
        </thead>
        <tbody>
            {LOOKS.map(look => (
                <tr key={look.label}>
                    <Box component='td' sx={CAPTION_SX}>
                        {look.label}
                    </Box>
                    {KINDS.map(kind => (
                        <td key={kind.label}>
                            <Chip label='Visa' size={size} {...look.props} {...kind.props} />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </Box>
)

/** `variant` × `color` by what the chip does, in both sizes of MUI. */
export const Looks: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={3} sx={{p: 3}}>
            <Matrix size='medium' />
            <Matrix size='small' />
        </Stack>
    ),
}

const Case = ({children, title}: {children: React.ReactNode; title: string}) => (
    <Box>
        <Typography sx={{...CAPTION_SX, mb: 0.5}}>{title}</Typography>
        <Stack direction='row' spacing={0.5} sx={{alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5}}>
            {children}
        </Stack>
    </Box>
)

/** Chips the way pages of the applications build them: tags of a table cell, picked values, links, a toggle. */
export const AsPagesUseIt: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={2} sx={{p: 3, maxWidth: 760}}>
            <Case title='Values of a table cell, the rest behind «+ N»'>
                <Chip label='ATEndPoint#2CG5R8' />
                <Chip label='Test3ds2ProcessorAmManageEndpoint' />
                <Chip label='test-endpoint' />
                <Chip label='+ 12' />
            </Case>
            <Case title='Small tags of a row'>
                <Chip label='USD' size='small' />
                <Chip label='EUR' size='small' />
            </Case>
            <Case title='Picked values that can be removed; keywords are outlined'>
                <Chip label='self' onDelete={noop} variant='outlined' />
                <Chip label='all' onDelete={noop} variant='outlined' />
                <Chip label='https://cdn.example.com' onDelete={noop} />
                <Chip label='Germany' onDelete={noop} />
            </Case>
            <Case title='Links to another page'>
                <Chip clickable component='a' href='#' label='Gold' />
                <Chip clickable color='error' component='a' href='#' label='Inactive project' />
                <Chip clickable component='a' href='#' label='test-endpoint' variant='outlined' />
            </Case>
            <Case title='A yes / no mark that opens a list'>
                <Chip color='success' label='Yes' onClick={noop} />
                <Chip label='No' />
            </Case>
            <Case title='A toggle: the picked ones are primary'>
                <Chip clickable color='primary' label='Turnover' onClick={noop} />
                <Chip clickable label='Declines' onClick={noop} variant='outlined' />
                <Chip clickable label='Chargebacks' onClick={noop} variant='outlined' />
            </Case>
        </Stack>
    ),
}

export const Playground: Story = {
    render: args => (
        <Box sx={{p: 3}}>
            <Chip {...args} />
        </Box>
    ),
}
