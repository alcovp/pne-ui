import * as React from "react";
import {PneButton} from "../index";
import {Meta, StoryObj} from "@storybook/react";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import {Box, Divider, SvgIcon} from "@mui/material";
import CustomIconWrapper from "../component/CustomIconWrapper";

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

export const Medium: Story = {
    args: {
        ...Default.args,
        size: 'medium',
    },
};

export const Small: Story = {
    args: {
        ...Default.args,
        size: 'small',
    },
};

export const Primary: Story = {
    args: {
        ...Default.args,
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
        startIcon: <DirectionsRunIcon/>,
    },
};

export const EndIcon: Story = {
    args: {
        ...Primary.args,
        endIcon: <DirectionsRunIcon/>,
    },
};

const BrokenFillIcon = () => {
    return <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M10.4941 11.6663H11.5008C13.5141 11.6663 15.1675 10.0197 15.1675 7.99967C15.1675 5.98634 13.5208 4.33301 11.5008 4.33301H10.4941"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M6.50065 4.33301H5.50065C3.48065 4.33301 1.83398 5.97967 1.83398 7.99967C1.83398 10.013 3.48065 11.6663 5.50065 11.6663H6.50065"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M5.83398 8H11.1673" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
}

const RepairedFillIcon = () => {
    return <CustomIconWrapper height={16} width={17}>
        <path
            d="M10.4941 11.6663H11.5008C13.5141 11.6663 15.1675 10.0197 15.1675 7.99967C15.1675 5.98634 13.5208 4.33301 11.5008 4.33301H10.4941"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M6.50065 4.33301H5.50065C3.48065 4.33301 1.83398 5.97967 1.83398 7.99967C1.83398 10.013 3.48065 11.6663 5.50065 11.6663H6.50065"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
            d="M5.83398 8H11.1673" strokeWidth="1.5" strokeLinecap="round"
            strokeLinejoin="round"
        />
    </CustomIconWrapper>
}

export const Analysis: StoryObj = {
    args: {
        children: 'Click me!',

        pneStyle: 'contained',
        // variant: 'contained',
        // color: 'primary',
        size: 'large',

        disabled: false,
        startIcon: false,
        endIcon: false,
    },

    argTypes: {
        children: {
            name: 'Button text',
            control: 'text',
        },
        pneStyle: {
            control: 'select',
            options: ['outlined', 'contained', 'text', 'error'],
        },
        // variant: {
        //     control: 'select',
        //     options: ['outlined', 'contained', 'text'],
        // },
        // color: {
        //     control: 'select',
        //     options: ['pnePrimaryLight', 'pneNeutral', 'pneWhite', 'pneWarningLight'],
        // },
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
        },
        disabled: {
            control: 'boolean',
        },
        startIcon: {
            control: 'boolean',
            mapping: {
                true: <BrokenFillIcon/>,
                false: undefined,
            },
        },
        endIcon: {
            control: 'boolean',
            mapping: {
                true: <DirectionsRunIcon/>,
                false: undefined,
            },
        },
    },
    name: 'PneStyle prop research',
    render: (args) => <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            width: '150px',
        }}
    >
        <PneButton {...args} pneStyle={'contained'}>contained</PneButton>
        <PneButton {...args} pneStyle={'outlined'}>outlined</PneButton>
        <PneButton {...args} pneStyle={'text'}>text</PneButton>
        <PneButton {...args} pneStyle={'error'}>error</PneButton>
        <Divider/>
        <PneButton {...args} pneStyle={'contained'} startIcon={<RepairedFillIcon/>}>RepairedIcon</PneButton>
        <Divider/>
        <PneButton {...args} pneStyle={undefined} color={'pneNeutral'}>pneNeutral</PneButton>
    </Box>,
}