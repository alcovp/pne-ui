import { PneModal } from "../index";
import { Meta, StoryObj } from "@storybook/react";

export default {
  title: "pne-ui/PneModal",
  component: PneModal,
} as Meta<typeof PneModal>;

type Story = StoryObj<typeof PneModal>;

export const Default: Story = {
  args: {
    children: "content",
    open: true,
  },
};
