import React, {useState} from 'react'
import {Meta, StoryObj} from '@storybook/react-webpack5'

import {PneAutocomplete} from '../index'

type Gateway = {
    id: string
    displayName: string
}

const gateways: readonly Gateway[] = [
    {id: 'primary', displayName: 'Primary gateway'},
    {id: 'backup', displayName: 'Backup gateway'},
]

const BuiltInExample = ({disabled = false}: {disabled?: boolean}) => {
    const [value, setValue] = useState<Gateway | null>(gateways[0])

    return <PneAutocomplete
        disabled={disabled}
        helperText='The selected value is compared by id, not object reference.'
        label='Gateway'
        onChange={(_event, nextValue) => setValue(nextValue)}
        options={gateways}
        value={value}
    />
}

const meta = {
    title: 'pne-ui/PneAutocomplete',
    component: BuiltInExample,
    args: {
        disabled: false,
    },
} satisfies Meta<typeof BuiltInExample>

export default meta

type Story = StoryObj<typeof meta>

export const BuiltInObject: Story = {}

export const Disabled: Story = {
    args: {
        disabled: true,
    },
}

type Region = {
    code: string
    title: string
}

const regions: readonly Region[] = [
    {code: 'eu', title: 'Shared display label'},
    {code: 'apac', title: 'Shared display label'},
]

const CustomObjectExample = () => {
    const [value, setValue] = useState<Region | null>({...regions[1]})

    return <PneAutocomplete<Region>
        getOptionKey={option => option.code}
        getOptionLabel={option => option.title}
        helperText='Duplicate labels remain distinct because keys are explicit.'
        label='Region'
        onChange={(_event, nextValue) => setValue(nextValue)}
        options={regions}
        value={value}
    />
}

export const CustomObjectWithDuplicateLabels: Story = {
    render: () => <CustomObjectExample/>,
}

const MultipleFreeSoloExample = () => {
    const [value, setValue] = useState<readonly string[]>(['Known option'])

    return <PneAutocomplete<string, true, false, true>
        freeSolo
        label='Tags'
        multiple
        onChange={(_event, nextValue) => setValue(nextValue)}
        options={['Known option', 'Another option']}
        value={[...value]}
    />
}

export const MultipleFreeSolo: Story = {
    render: () => <MultipleFreeSoloExample/>,
}
