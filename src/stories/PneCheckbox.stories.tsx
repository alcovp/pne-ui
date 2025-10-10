import * as React from 'react'
import {PneCheckbox} from '../index'
import {Meta, StoryObj} from '@storybook/react'

export default {
    title: 'pne-ui/PneCheckbox',
    component: PneCheckbox,
} as Meta<typeof PneCheckbox>

type Story = StoryObj<typeof PneCheckbox>;

export const Default: StoryObj = {
    args: {
        size: 'small',
        disabled: false,
        checked: false,
    },

    argTypes: {
        size: {
            control: 'radio',
            options: ['small', 'medium'],
        },
        disabled: {
            control: 'boolean',
        },
        checked: {
            control: 'boolean',
        },
    },
    render: (args) => <PneCheckbox {...args}/>,
}
