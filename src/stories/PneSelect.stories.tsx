import React, {useState} from 'react'
import {Stack} from '@mui/material'
import {PneField, PneSelect} from '../index'
import {Meta, StoryObj} from '@storybook/react-webpack5'

export default {
    title: 'pne-ui/PneSelect',
    component: PneSelect,
} as Meta<typeof PneSelect>

type Story = StoryObj<typeof PneSelect>

export const Default: Story = {
    render: () => <DefaultSelectStory/>,
}

export const Placeholder: Story = {
    render: () => <PlaceholderSelectStory/>,
}

const DefaultSelectStory = () => {
    const [value, setValue] = useState('UTF-8')

    return <PneSelect
        options={['UTF-8', 'ANSI']}
        value={value}
        onChange={setValue}
    />
}

const PlaceholderSelectStory = () => {
    const [value, setValue] = useState('')

    return <Stack
        spacing={2}
        sx={{
            width: 420,
        }}
    >
        <PneSelect
            options={['Email', 'SFTP']}
            placeholder='Please select'
            value={value}
            onChange={setValue}
        />
        <PneField
            htmlFor='message-server'
            label='Message server'
            required
        >
            <PneSelect
                id='message-server'
                options={['Email', 'SFTP']}
                placeholder='Please select'
                value={value}
                onChange={setValue}
            />
        </PneField>
    </Stack>
}
