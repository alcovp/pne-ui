import {PneSelect} from "../index";
import {Meta, StoryObj} from "@storybook/react";

export default {
    title: "pne-ui/PneSelect",
    component: PneSelect,
} as Meta<typeof PneSelect>;

type Story = StoryObj<typeof PneSelect>;

export const Default: Story = {
    args: {},
};
