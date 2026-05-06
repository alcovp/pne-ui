import {PneSelect} from "../index";
import {Meta, StoryObj} from "@storybook/react-webpack5";

export default {
    title: "pne-ui/PneSelect",
    component: PneSelect,
} as Meta<typeof PneSelect>;

type Story = StoryObj<typeof PneSelect>;

export const Default: Story = {
    args: {},
};
