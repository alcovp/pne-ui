import {PneAutocomplete} from "../index";
import {Meta, StoryObj} from "@storybook/react-webpack5";

export default {
    title: "pne-ui/PneAutocomplete",
    component: PneAutocomplete,
} as Meta<typeof PneAutocomplete>;

type Story = StoryObj<typeof PneAutocomplete>;

export const Default: Story = {
    args: {},
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        disabled: true
    },
};
