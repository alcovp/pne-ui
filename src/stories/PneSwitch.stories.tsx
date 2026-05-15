import * as React from 'react'
import {Box, FormControlLabel, Stack, Typography} from '@mui/material'
import {alpha} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import {PneSwitch} from '../index'
import {Meta, StoryObj} from '@storybook/react-webpack5'

export default {
    title: 'pne-ui/PneSwitch',
    component: PneSwitch,
} as Meta<typeof PneSwitch>

type Story = StoryObj<typeof PneSwitch>;

type SwitchSize = 'medium' | 'small'
type SwitchState = 'enable' | 'hover' | 'disable' | 'focus' | 'pressed'

const switchColumns: Array<{
    state: SwitchState
    label: string
    labelLeft: number
    mediumLeft: number
    smallLeft: number
}> = [
    {
        state: 'enable',
        label: 'Enable',
        labelLeft: 28,
        mediumLeft: 16,
        smallLeft: 25,
    },
    {
        state: 'hover',
        label: 'Hover',
        labelLeft: 135,
        mediumLeft: 129,
        smallLeft: 138,
    },
    {
        state: 'disable',
        label: 'Disable',
        labelLeft: 236,
        mediumLeft: 224,
        smallLeft: 233,
    },
    {
        state: 'focus',
        label: 'Focus',
        labelLeft: 346,
        mediumLeft: 338,
        smallLeft: 347,
    },
    {
        state: 'pressed',
        label: 'Pressed',
        labelLeft: 456,
        mediumLeft: 444,
        smallLeft: 453,
    },
]

const switchRows: Array<{
    checked: boolean
    size: SwitchSize
    top: number
}> = [
    {
        checked: true,
        size: 'medium',
        top: 16,
    },
    {
        checked: true,
        size: 'small',
        top: 107,
    },
    {
        checked: false,
        size: 'medium',
        top: 194,
    },
    {
        checked: false,
        size: 'small',
        top: 255,
    },
]

const getPreviewOutlineWidth = (
    state: SwitchState,
    size: SwitchSize,
) => {
    if (state === 'focus') {
        return size === 'medium' ? 4 : 2
    }

    if (state === 'pressed') {
        return size === 'medium' ? 6 : 4
    }

    return 2
}

const getPreviewTrackColor = (
    state: SwitchState,
    checked: boolean,
    theme: Theme,
) => {
    if (state === 'hover' || state === 'pressed') {
        return checked ? theme.palette.primary.dark : '#5E7594'
    }

    return checked ? theme.palette.primary.main : '#809EAE'
}

const getSwitchPreviewSx = (
    state: SwitchState,
    size: SwitchSize,
    checked: boolean,
): SxProps<Theme> | undefined => {
    if (state === 'enable' || state === 'disable') {
        return undefined
    }

    return theme => {
        const feedbackColor = alpha(theme.palette.primary.main, 0.1)
        const outlineWidth = getPreviewOutlineWidth(state, size)
        const trackColor = getPreviewTrackColor(state, checked, theme)

        return {
            pointerEvents: 'none',
            '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                backgroundColor: trackColor,
                opacity: 1,
            },
            '& .MuiSwitch-track::before': {
                boxShadow: `0 0 0 ${outlineWidth}px ${feedbackColor}`,
                opacity: 1,
                transform: 'scale(1)',
            },
        }
    }
}

const renderSwitchPreview = (
    state: SwitchState,
    size: SwitchSize,
    checked: boolean,
) => <PneSwitch
    checked={checked}
    disabled={state === 'disable'}
    readOnly
    size={size}
    sx={getSwitchPreviewSx(state, size, checked)}
/>

export const Default: Story = {
    args: {
        size: 'small',
        disabled: false,
    },
    argTypes: {
        size: {
            control: 'radio',
            options: ['small', 'medium'],
        },
        disabled: {
            control: 'boolean',
        },
    },
    render: (args) => <PneSwitch {...args}/>,
}

export const Sizes: Story = {
    render: () => <Box
        sx={{
            height: 380,
            position: 'relative',
            width: 518,
        }}
    >
        {switchColumns.map(column => <Typography
            key={column.state}
            sx={{
                color: '#000',
                fontSize: 14,
                fontWeight: 400,
                left: column.labelLeft,
                lineHeight: '16px',
                position: 'absolute',
                top: 0,
            }}
        >
            {column.label}
        </Typography>)}
        <Box
            sx={{
                height: 327,
                left: 0,
                position: 'absolute',
                top: 53,
                width: 518,
            }}
        >
            {switchRows.flatMap(row => switchColumns.map(column => <Box
                key={`${row.size}-${row.checked ? 'on' : 'off'}-${column.state}`}
                sx={{
                    left: row.size === 'medium' ? column.mediumLeft : column.smallLeft,
                    position: 'absolute',
                    top: row.top,
                }}
            >
                {renderSwitchPreview(column.state, row.size, row.checked)}
            </Box>))}
        </Box>
    </Box>,
}

export const WithLabel: Story = {
    render: () => <Stack spacing={2}>
        <FormControlLabel
            control={<PneSwitch
                defaultChecked
                size='medium'
            />}
            label='Medium switch'
        />
        <FormControlLabel
            control={<PneSwitch
                defaultChecked
                size='small'
            />}
            label='Small switch'
        />
    </Stack>,
}
