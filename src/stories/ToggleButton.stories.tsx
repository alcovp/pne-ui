import * as React from 'react'
import {Box, Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material'
import type {ToggleButtonGroupProps} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'

// The library has no toggle group of its own: these are the stories of the MUI `ToggleButtonGroup`
// as the theme of pne-ui draws it.
export default {
    title: 'pne-ui/ToggleButton',
    component: ToggleButtonGroup,
} as Meta<typeof ToggleButtonGroup>

type Story = StoryObj<typeof ToggleButtonGroup>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

const Group = ({labels = ['Disabled', 'Enabled', 'Deleted'], picked = 1, ...props}: ToggleButtonGroupProps & {
    labels?: string[]
    picked?: number
}) => {
    const [value, setValue] = React.useState(picked)
    return (
        <ToggleButtonGroup
            exclusive
            onChange={(_event, next) => next !== null && setValue(next)}
            value={value}
            {...props}
        >
            {labels.map((label, index) => <ToggleButton key={label} value={index}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
    )
}

const LOOKS: Array<{label: string, props: ToggleButtonGroupProps}> = [
    {label: 'small', props: {size: 'small'}},
    {label: 'small · primary', props: {size: 'small', color: 'primary'}},
    {label: 'small · pneAccentuated', props: {size: 'small', color: 'pneAccentuated'}},
    {label: 'medium', props: {}},
    {label: 'medium · primary', props: {color: 'primary'}},
    {label: 'small · disabled', props: {size: 'small', disabled: true}},
]

/** `size` × `color` as pages set them. */
export const Looks: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 10px', m: 1}}>
            <tbody>
                {LOOKS.map(look => (
                    <tr key={look.label}>
                        <Box component='td' sx={CAPTION_SX}>{look.label}</Box>
                        <td><Group {...look.props}/></td>
                    </tr>
                ))}
            </tbody>
        </Box>
    ),
}

const Case = ({children, title}: {children: React.ReactNode, title: string}) => (
    <Box>
        <Typography sx={{...CAPTION_SX, mb: 0.5}}>{title}</Typography>
        {children}
    </Box>
)

/** Toggle groups the way pages of the applications build them. */
export const AsPagesUseIt: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={2.5} sx={{p: 3, maxWidth: 560}}>
            <Case title='A status of a form, the width of its column (small, fullWidth)'>
                <Group fullWidth size='small'/>
            </Case>
            <Case title='A choice in a form of a limit (small)'>
                <Group labels={['Daily', 'Weekly', 'Monthly', 'Custom']} picked={0} size='small'/>
            </Case>
            <Case title='A filter above a list (small, primary, fullWidth)'>
                <Group color='primary' fullWidth labels={['Enabled', 'All']} picked={0} size='small'/>
            </Case>
            <Case title='The panels of a page in its blue header (small, pneAccentuated)'>
                <Box sx={{bgcolor: 'primary.main', display: 'inline-flex', p: 1.5}}>
                    <Group color='pneAccentuated' labels={['List', 'Sync', 'Export', 'Import', 'Add']} picked={1} size='small'/>
                </Box>
            </Case>
            <Case title='The tabs of a section (medium, primary, fullWidth)'>
                <Group color='primary' fullWidth labels={['Balances', 'Adjustments', 'Scheduled', 'History']} picked={0}/>
            </Case>
            <Case title='A node of the balancing tree: pressed to 26px by the page (small, primary, fullWidth)'>
                <Box sx={{width: 160}}>
                    <Group color='primary' fullWidth labels={['Yes', 'No']} picked={0} size='small' sx={{height: '26px'}}/>
                </Box>
            </Case>
            <Case title='Stacked on a phone (vertical)'>
                <Group color='primary' labels={['Card', 'Bank transfer', 'Wallet']} orientation='vertical' picked={0} size='small'/>
            </Case>
        </Stack>
    ),
}
