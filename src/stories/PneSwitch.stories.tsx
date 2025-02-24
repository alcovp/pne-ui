import * as React from 'react'
import {PneSwitch} from '../index'
import {Meta, StoryObj} from '@storybook/react'

export default {
    title: 'pne-ui/PneSwitch',
    component: PneSwitch,
} as Meta<typeof PneSwitch>

type Story = StoryObj<typeof PneSwitch>;

export const Default: StoryObj = {
    args: {
        size: 'small',

        disabled: false,
    },

    argTypes: {
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
        },
        disabled: {
            control: 'boolean',
        },
    },
    render: (args) => <PneSwitch/>,
}