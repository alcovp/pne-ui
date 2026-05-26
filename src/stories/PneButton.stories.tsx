import * as React from "react";
import {PneButton} from "../index";
import {Meta, StoryObj} from "@storybook/react-webpack5";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import {Box, Divider, Typography} from "@mui/material";
import {alpha} from "@mui/material/styles";
import type {SxProps, Theme} from "@mui/material/styles";
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

type ButtonMatrixVariant = 'contained' | 'outlined' | 'text'
type ButtonMatrixSize = 'small' | 'medium' | 'large'
type ButtonMatrixState = 'enable' | 'disabled' | 'hover' | 'pressed'
type ButtonMatrixIcon = 'none' | 'start' | 'end' | 'only'

const matrixColumns: Array<{
    key: string
    label: string
    size: ButtonMatrixSize
    variant: ButtonMatrixVariant
}> = [
    {key: 'contained-small', label: 'Contained Small', size: 'small', variant: 'contained'},
    {key: 'contained-medium', label: 'Contained Medium', size: 'medium', variant: 'contained'},
    {key: 'contained-large', label: 'Contained Large', size: 'large', variant: 'contained'},
    {key: 'outlined-small', label: 'Outlined Small', size: 'small', variant: 'outlined'},
    {key: 'outlined-medium', label: 'Outlined Medium', size: 'medium', variant: 'outlined'},
    {key: 'outlined-large', label: 'Outlined Large', size: 'large', variant: 'outlined'},
    {key: 'text-small', label: 'Text Small', size: 'small', variant: 'text'},
    {key: 'text-medium', label: 'Text Medium', size: 'medium', variant: 'text'},
    {key: 'text-large', label: 'Text Large', size: 'large', variant: 'text'},
]

const matrixRows: Array<{
    key: string
    label: string
    state: ButtonMatrixState
    icon: ButtonMatrixIcon
}> = [
    {key: 'enable', label: 'Enable', state: 'enable', icon: 'none'},
    {key: 'disabled', label: 'Disabled', state: 'disabled', icon: 'none'},
    {key: 'hover', label: 'Hover', state: 'hover', icon: 'none'},
    {key: 'pressed', label: 'Pressed', state: 'pressed', icon: 'none'},
    {key: 'start-icon', label: 'Start icon', state: 'enable', icon: 'start'},
    {key: 'end-icon', label: 'End icon', state: 'enable', icon: 'end'},
    {key: 'icon-only', label: 'Icon only', state: 'enable', icon: 'only'},
]

const getButtonPreviewSx = (
    state: ButtonMatrixState,
    variant: ButtonMatrixVariant,
): SxProps<Theme> | undefined => {
    if (state === 'enable' || state === 'disabled') {
        return undefined
    }

    return theme => {
        const feedbackBackgroundColor = alpha(theme.palette.primary.main, 0.1)

        if (variant === 'contained') {
            return {
                backgroundColor: theme.palette.primary.dark,
                pointerEvents: 'none',
            }
        }

        if (variant === 'outlined') {
            return {
                backgroundColor: feedbackBackgroundColor,
                borderColor: theme.palette.primary.dark,
                color: theme.palette.primary.dark,
                pointerEvents: 'none',
            }
        }

        return {
            backgroundColor: feedbackBackgroundColor,
            color: theme.palette.primary.dark,
            pointerEvents: 'none',
        }
    }
}

const renderMatrixButton = (
    row: typeof matrixRows[number],
    column: typeof matrixColumns[number],
) => {
    const commonProps = {
        disabled: row.state === 'disabled',
        pneStyle: column.variant,
        size: column.size,
        sx: getButtonPreviewSx(row.state, column.variant),
    }

    if (row.icon === 'start') {
        return <PneButton {...commonProps} startIcon={<ArrowBackIcon/>}>Button</PneButton>
    }

    if (row.icon === 'end') {
        return <PneButton {...commonProps} endIcon={<ArrowForwardIcon/>}>Button</PneButton>
    }

    if (row.icon === 'only') {
        return <PneButton {...commonProps} startIcon={<ArrowForwardIcon/>} aria-label='Button'/>
    }

    return <PneButton {...commonProps}>Button</PneButton>
}

export const DesignMatrix: Story = {
    parameters: {
        layout: 'fullscreen',
    },
    render: () => <Box
        sx={{
            backgroundColor: '#fff',
            color: '#4E5D78',
            overflowX: 'auto',
            p: 4,
        }}
    >
        <Box
            sx={{
                alignItems: 'center',
                columnGap: 4,
                display: 'grid',
                gridTemplateColumns: `140px repeat(${matrixColumns.length}, 160px)`,
                minWidth: 1620,
                rowGap: 5,
            }}
        >
            <Box/>
            {matrixColumns.map(column => <Typography
                key={column.key}
                sx={{
                    color: '#4E5D78',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: '20px',
                }}
            >
                {column.label}
            </Typography>)}
            {matrixRows.flatMap(row => [
                <Box key={`${row.key}-label`}>
                    <Typography
                        sx={{
                            color: '#4E5D78',
                            fontFamily: 'Arial, sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: '20px',
                        }}
                    >
                        {row.label}
                    </Typography>
                </Box>,
                ...matrixColumns.map(column => <Box
                    key={`${row.key}-${column.key}`}
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        minHeight: 40,
                    }}
                >
                    {renderMatrixButton(row, column)}
                </Box>),
            ])}
        </Box>
    </Box>,
}

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
