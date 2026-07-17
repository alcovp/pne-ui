import React, {ReactNode, useState} from 'react'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {Box, IconButton, Tooltip} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    PneTableViewOption,
    PneTableViewSelector,
} from '../index'

type ViewId = 'brief' | 'full' | 'risk'

const meta = {
    title: 'pne-ui/PneTable/View selector',
    component: PneTableViewSelector,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof PneTableViewSelector>

export default meta

type Story = StoryObj<typeof meta>

const StorySelector = (props: {
    actions?: ReactNode
    disabled?: boolean
    initialValue?: ViewId
    views: readonly PneTableViewOption<ViewId>[]
}) => {
    const [value, setValue] = useState<ViewId>(props.initialValue ?? props.views[0].id)

    return <Box sx={{p: 2}}>
        <PneTableViewSelector
            aria-label='Table view'
            actions={props.actions}
            autoTestId='storybook-table'
            disabled={props.disabled}
            onChange={setValue}
            value={value}
            views={props.views}
        />
    </Box>
}

const settingsAction = <Tooltip
    enterDelay={300}
    enterNextDelay={300}
    title='Full View Settings'
>
    <IconButton
        aria-label='Full View Settings'
        size='small'
        sx={{borderRadius: '4px', height: '40px', padding: '8px', width: '40px'}}
    >
        <SettingsOutlinedIcon sx={{height: '16px', width: '16px'}}/>
    </IconButton>
</Tooltip>

export const OrdersStyle: Story = {
    render: () => <StorySelector
        actions={settingsAction}
        views={[
            {id: 'brief', label: 'Brief'},
            {id: 'full', label: 'Full'},
        ]}
    />,
}

export const ThreeGenericViews: Story = {
    render: () => <StorySelector
        views={[
            {id: 'brief', label: 'Summary'},
            {id: 'full', label: 'Operations'},
            {id: 'risk', label: 'Risk'},
        ]}
    />,
}

export const DisabledStates: Story = {
    render: () => <StorySelector
        views={[
            {id: 'brief', label: 'Brief'},
            {id: 'full', label: 'Full'},
            {id: 'risk', label: 'Risk', disabled: true},
        ]}
    />,
}

export const DisabledSelector: Story = {
    render: () => <StorySelector
        actions={settingsAction}
        disabled
        views={[
            {id: 'brief', label: 'Brief'},
            {id: 'full', label: 'Full'},
        ]}
    />,
}
