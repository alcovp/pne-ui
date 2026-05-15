import React from 'react'
import {Stack, ToggleButton, ToggleButtonGroup} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneAutocomplete, PneField, PneSelect, PneTextField} from '../index'

export default {
    title: 'pne-ui/PneField',
    component: PneField,
} as Meta<typeof PneField>

type Story = StoryObj<typeof PneField>

const deliveryServers = ['Please select', 'Email', 'SFTP']
const toggleGroupSx = {
    height: 40,
    width: '100%',
    '& .MuiToggleButton-root': {
        flex: 1,
        textTransform: 'none',
    },
}

export const Base: Story = {
    render: () => <Stack
        sx={{
            width: 420,
        }}
    >
        <PneField
            htmlFor='report-file-name'
            label='Report file name'
        >
            <PneTextField
                defaultValue='Cashflow_10_12_2024'
                fullWidth
                id='report-file-name'
            />
        </PneField>
    </Stack>,
}

export const Controls: Story = {
    render: () => <Stack
        spacing={2}
        sx={{
            width: 420,
        }}
    >
        <PneField
            htmlFor='report-file-name-controls'
            label='Report file name'
        >
            <PneTextField
                defaultValue='Cashflow_10_12_2024'
                fullWidth
                id='report-file-name-controls'
            />
        </PneField>
        <PneField
            label='Message server'
            required
        >
            <PneSelect
                options={deliveryServers.slice(1)}
                placeholder='Please select'
                value=''
                onChange={() => undefined}
            />
        </PneField>
        <PneField label='Delivery server'>
            <PneAutocomplete
                options={deliveryServers.slice(1)}
                placeholder='Please select'
                sx={{
                    width: '100%',
                }}
            />
        </PneField>
    </Stack>,
}

export const SegmentedControl: Story = {
    render: () => <Stack
        sx={{
            width: 420,
        }}
    >
        <PneField label='Period'>
            <ToggleButtonGroup
                exclusive
                size='medium'
                sx={toggleGroupSx}
                value='weeks'
            >
                <ToggleButton value='days'>Days</ToggleButton>
                <ToggleButton value='weeks'>Weeks</ToggleButton>
                <ToggleButton value='months'>Months</ToggleButton>
            </ToggleButtonGroup>
        </PneField>
    </Stack>,
}
