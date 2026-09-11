import React, {useState} from 'react'
import {Stack} from '@mui/material'
import {PneField, PneSelect} from '../index'
import {Meta, StoryObj} from '@storybook/react-webpack5'

export default {
    title: 'pne-ui/PneSelect',
    component: PneSelect,
} as Meta<typeof PneSelect>

type Story = StoryObj<typeof PneSelect>

const encodings = ['UTF-8', 'ANSI'] as const
const deliveryServers = ['Email', 'SFTP'] as const
const regions = [
    {code: 'eu', disabled: false, title: 'Europe'},
    {code: 'apac', disabled: true, title: 'Asia Pacific'},
] as const

type Region = (typeof regions)[number]

export const Default: Story = {
    render: () => <DefaultSelectStory/>,
}

export const Placeholder: Story = {
    render: () => <PlaceholderSelectStory/>,
}

export const ObjectOptions: Story = {
    render: () => <ObjectOptionsSelectStory/>,
}

const DefaultSelectStory = () => {
    const [value, setValue] = useState<(typeof encodings)[number]>('UTF-8')

    return <PneSelect
        options={encodings}
        value={value}
        onChange={setValue}
    />
}

const PlaceholderSelectStory = () => {
    const [value, setValue] = useState<(typeof deliveryServers)[number] | null>(null)

    return <Stack
        spacing={2}
        sx={{
            width: 420,
        }}
    >
        <PneSelect
            options={deliveryServers}
            placeholder='Please select'
            value={value}
            onChange={setValue}
        />
        <PneField
            label='Message server'
            required
        >
            <PneSelect
                options={deliveryServers}
                placeholder='Please select'
                value={value}
                onChange={setValue}
            />
        </PneField>
    </Stack>
}

const ObjectOptionsSelectStory = () => {
    const [value, setValue] = useState<Region | null>({...regions[0]})

    return <PneSelect
        options={regions}
        value={value}
        onChange={setValue}
        getOptionKey={option => option.code}
        getOptionLabel={option => option.title}
        getOptionDisabled={option => option.disabled}
        getOptionProps={option => ({'data-region': option.code})}
    />
}
