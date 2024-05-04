import * as React from "react";
import { PneButton } from "../index";
import { Meta, StoryObj } from "@storybook/react";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";

export default {
  title: "pne-ui/PneButton",
  component: PneButton,
} as Meta<typeof PneButton>;

type Story = StoryObj<typeof PneButton>;

const BUTTON_TEXT = "Push me!";
const BUTTON_ALERT_TEXT = "Click!";

export const Default: Story = {
  args: {
    onClick: () => alert(BUTTON_ALERT_TEXT),
    children: BUTTON_TEXT,
  },
};

export const Primary: Story = {
  args: {
    ...Default.args,
    color: "pnePrimary",
  },
};

export const Neutral: Story = {
  args: {
    ...Default.args,
    color: "pneNeutral",
  },
};

export const White: Story = {
  args: {
    ...Default.args,
    color: "pneWhite",
  },
};

export const Text: Story = {
  args: {
    ...Default.args,
    color: "pneText",
  },
};

export const PrimaryLight: Story = {
  args: {
    ...Default.args,
    color: "pnePrimaryLight",
  },
};

export const WarningLight: Story = {
  args: {
    ...Default.args,
    color: "pneWarningLight",
  },
};

export const StartIcon: Story = {
  args: {
    ...Primary.args,
    startIcon: <DirectionsRunIcon />,
  },
};

export const EndIcon: Story = {
  args: {
    ...Primary.args,
    endIcon: <DirectionsRunIcon />,
  },
};
