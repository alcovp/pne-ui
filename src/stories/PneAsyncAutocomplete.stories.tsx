import { PneAsyncAutocomplete } from "../index";
import { Meta, StoryObj } from "@storybook/react";

export default {
  title: "pne-ui/PneAsyncAutocomplete",
  component: PneAsyncAutocomplete,
} as Meta<typeof PneAsyncAutocomplete>;

type Story = StoryObj<typeof PneAsyncAutocomplete>;

export const Default: Story = {
  args: {},
};
