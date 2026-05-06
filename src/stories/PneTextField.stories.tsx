import {PneTextField} from "../index";
import {Meta, StoryObj} from "@storybook/react-webpack5";

export default {
    title: "pne-ui/PneTextField",
    component: PneTextField,
} as Meta<typeof PneTextField>;

type Story = StoryObj<typeof PneTextField>;

export const Default: Story = {
    args: {},
};
