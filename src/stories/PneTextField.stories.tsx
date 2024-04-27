import {PneTextField} from '../index';
import {ComponentMeta, StoryObj} from '@storybook/react';

export default {
    title: 'pne-ui/PneTextField',
    component: PneTextField,
} as ComponentMeta<typeof PneTextField>;

type Story = StoryObj<typeof PneTextField>;

export const Default: Story = {
    args: {
    },
};