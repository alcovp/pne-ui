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
    const handleChange = (option: string | {displayName: string}) => setValue(
        typeof option === 'string' ? option : option.displayName,
    )

    return <PneSelect
        options={['UTF-8', 'ANSI']}
        value={value}
        onChange={handleChange}
    />
}

const PlaceholderSelectStory = () => {
    const [value, setValue] = useState('')
    const handleChange = (option: string | {displayName: string}) => setValue(
        typeof option === 'string' ? option : option.displayName,
    )

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
            onChange={handleChange}
        />
        <PneField
            label='Message server'
            required
        >
            <PneSelect
                options={['Email', 'SFTP']}
                placeholder='Please select'
                value={value}
                onChange={handleChange}
            />
        </PneField>
    </Stack>
}
