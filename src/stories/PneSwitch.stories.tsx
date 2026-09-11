import * as React from 'react'
import {Box, FormControlLabel, Stack, Typography} from '@mui/material'
import {alpha, keyframes} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import {PneSwitch} from '../index'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {userEvent, within} from 'storybook/test'

export default {
    title: 'pne-ui/PneSwitch',
    component: PneSwitch,
} as Meta<typeof PneSwitch>

type Story = StoryObj<typeof PneSwitch>;

type SwitchSize = 'medium' | 'small'
type SwitchState = 'enable' | 'hover' | 'disable' | 'focus' | 'pressed'
type PendingEffectVariant = 'arc' | 'dashed' | 'breathing' | 'wave' | 'ripple'

const pendingEffectDelayMs = 400

const pendingEffectVariants: Array<{
    description: string
    label: string
    variant: PendingEffectVariant
}> = [
    {
        description: 'One bright segment travels around a quiet outline.',
        label: 'Running arc',
        variant: 'arc',
    },
    {
        description: 'Rounded dashes march continuously around the capsule.',
        label: 'Marching ants',
        variant: 'dashed',
    },
    {
        description: 'A soft full outline gently expands and contracts.',
        label: 'Breathing aura',
        variant: 'breathing',
    },
    {
        description: 'Four differently weighted lobes flow around the outline.',
        label: 'Traveling wave',
        variant: 'wave',
    },
    {
        description: 'Capsule-shaped ripples repeatedly expand and fade.',
        label: 'Repeating ripple',
        variant: 'ripple',
    },
]

const revealPendingEffect = keyframes({
    from: {opacity: 0},
    to: {opacity: 1},
})

const travelPendingStroke = keyframes({
    to: {strokeDashoffset: -100},
})

const breathePendingOutline = keyframes({
    from: {
        opacity: 0.14,
        transform: 'scale(0.98)',
    },
    to: {
        opacity: 0.42,
        transform: 'scale(1.08)',
    },
})

const expandPendingRipple = keyframes({
    from: {
        opacity: 0.32,
        transform: 'scale(1)',
    },
    to: {
        opacity: 0,
        transform: 'scale(1.28)',
    },
})

const pendingEffectPreviewSx: SxProps<Theme> = theme => ({
    color: theme.palette.primary.main,
    height: 32,
    position: 'relative',
    width: 58,
    '& > .MuiSwitch-root::before, & > .MuiSwitch-root::after': {
        display: 'none',
    },
    '& .MuiSwitch-thumb::after': {
        display: 'none',
    },
    '& .PneSwitch-pendingEffect': {
        inset: 0,
        opacity: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        position: 'absolute',
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect': {
        animation: `${revealPendingEffect} 160ms ease ${pendingEffectDelayMs}ms forwards`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--arc .PneSwitch-pendingMotion': {
        animation: `${travelPendingStroke} 1100ms linear ${pendingEffectDelayMs}ms infinite`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--dashed .PneSwitch-pendingMotion': {
        animation: `${travelPendingStroke} 900ms linear ${pendingEffectDelayMs}ms infinite`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--breathing .PneSwitch-pendingMotion': {
        animation: `${breathePendingOutline} 1100ms ease-in-out ${pendingEffectDelayMs}ms infinite alternate`,
        transformBox: 'fill-box',
        transformOrigin: 'center',
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--wave .PneSwitch-pendingMotion': {
        animationDuration: '1000ms',
        animationIterationCount: 'infinite',
        animationName: `${travelPendingStroke}`,
        animationTimingFunction: 'linear',
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--wave .PneSwitch-pendingMotion:nth-of-type(1)': {
        animationDelay: `${pendingEffectDelayMs}ms`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--wave .PneSwitch-pendingMotion:nth-of-type(2)': {
        animationDelay: `${pendingEffectDelayMs - 250}ms`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--wave .PneSwitch-pendingMotion:nth-of-type(3)': {
        animationDelay: `${pendingEffectDelayMs - 500}ms`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--wave .PneSwitch-pendingMotion:nth-of-type(4)': {
        animationDelay: `${pendingEffectDelayMs - 750}ms`,
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--ripple .PneSwitch-pendingMotion': {
        animation: `${expandPendingRipple} 1200ms ease-out ${pendingEffectDelayMs}ms infinite`,
        transformBox: 'fill-box',
        transformOrigin: 'center',
    },
    '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect--ripple .PneSwitch-pendingMotion:nth-of-type(2)': {
        animationDelay: `${pendingEffectDelayMs + 600}ms`,
    },
    '@media (prefers-reduced-motion: reduce)': {
        '&:has(input[aria-busy="true"]) .PneSwitch-pendingEffect': {
            animation: `${revealPendingEffect} 1ms linear ${pendingEffectDelayMs}ms forwards`,
        },
        '&:has(input[aria-busy="true"]) .PneSwitch-pendingMotion': {
            animation: 'none',
            opacity: 0.32,
            transform: 'none',
        },
    },
})

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
    aria-label={`${size} ${state} switch, ${checked ? 'on' : 'off'}`}
    checked={checked}
    disabled={state === 'disable'}
    readOnly
    size={size}
    sx={getSwitchPreviewSx(state, size, checked)}
/>

export const Default: Story = {
    args: {
        'aria-label': 'Example switch',
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

const PendingEffect = ({variant}: {variant: PendingEffectVariant}) => {
    const commonRectProps = {
        fill: 'none',
        height: 24,
        pathLength: 100,
        rx: 12,
        width: 36,
        x: 11,
        y: 4,
    }

    if (variant === 'arc') {
        return <svg
            aria-hidden='true'
            className='PneSwitch-pendingEffect PneSwitch-pendingEffect--arc'
            focusable='false'
            viewBox='0 0 58 32'
        >
            <rect {...commonRectProps} opacity={0.12} stroke='currentColor' strokeWidth={2}/>
            <rect
                {...commonRectProps}
                className='PneSwitch-pendingMotion'
                stroke='currentColor'
                strokeDasharray='28 72'
                strokeLinecap='round'
                strokeWidth={2.5}
            />
        </svg>
    }

    if (variant === 'dashed') {
        return <svg
            aria-hidden='true'
            className='PneSwitch-pendingEffect PneSwitch-pendingEffect--dashed'
            focusable='false'
            viewBox='0 0 58 32'
        >
            <rect
                {...commonRectProps}
                className='PneSwitch-pendingMotion'
                opacity={0.58}
                stroke='currentColor'
                strokeDasharray='3 7'
                strokeLinecap='round'
                strokeWidth={2.5}
            />
        </svg>
    }

    if (variant === 'breathing') {
        return <svg
            aria-hidden='true'
            className='PneSwitch-pendingEffect PneSwitch-pendingEffect--breathing'
            focusable='false'
            viewBox='0 0 58 32'
        >
            <rect
                {...commonRectProps}
                className='PneSwitch-pendingMotion'
                stroke='currentColor'
                strokeWidth={3}
            />
        </svg>
    }

    if (variant === 'wave') {
        return <svg
            aria-hidden='true'
            className='PneSwitch-pendingEffect PneSwitch-pendingEffect--wave'
            focusable='false'
            viewBox='0 0 58 32'
        >
            {[1.5, 2.5, 4, 2.5].map((strokeWidth, index) => <rect
                {...commonRectProps}
                className='PneSwitch-pendingMotion'
                key={strokeWidth + index}
                opacity={0.22 + index * 0.1}
                stroke='currentColor'
                strokeDasharray='8 92'
                strokeLinecap='round'
                strokeWidth={strokeWidth}
            />)}
        </svg>
    }

    return <svg
        aria-hidden='true'
        className='PneSwitch-pendingEffect PneSwitch-pendingEffect--ripple'
        focusable='false'
        viewBox='0 0 58 32'
    >
        {[0, 1].map(index => <rect
            {...commonRectProps}
            className='PneSwitch-pendingMotion'
            key={index}
            opacity={0}
            stroke='currentColor'
            strokeWidth={2}
        />)}
    </svg>
}

const PendingEffectComparison = () => <Stack spacing={1.5} sx={{maxWidth: '100%', width: 660}}>
    <Typography color='text.secondary' variant='body2'>
        Each real async switch moves optimistically at once. Its pending effect appears after{' '}
        {pendingEffectDelayMs} ms and intentionally keeps running for visual comparison.
    </Typography>
    {pendingEffectVariants.map(({description, label, variant}) => <Stack
        data-pending-effect={variant}
        direction='row'
        key={variant}
        spacing={2}
        sx={{alignItems: 'center', minHeight: 48}}
    >
        <Typography sx={{fontWeight: 500, width: 132}} variant='body2'>
            {label}
        </Typography>
        <Box sx={pendingEffectPreviewSx}>
            <PneSwitch
                aria-label={`${label} pending effect`}
                onChange={() => new Promise<never>(() => undefined)}
                size='medium'
            />
            <PendingEffect variant={variant}/>
        </Box>
        <Typography color='text.secondary' sx={{flex: 1}} variant='body2'>
            {description}
        </Typography>
    </Stack>)}
</Stack>

export const PendingEffectVariants: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Five Storybook-only medium-size pending-effect studies shown in isolation. '
                    + `Every effect waits ${pendingEffectDelayMs} ms before appearing; the production `
                    + 'ripple is suppressed inside this comparison.',
            },
        },
    },
    render: () => <PendingEffectComparison/>,
    play: async ({canvasElement}) => {
        const switches = within(canvasElement).getAllByRole('switch')

        for (const switchInput of switches) {
            await userEvent.click(switchInput)
        }

        const activeElement = canvasElement.ownerDocument.activeElement

        if (activeElement instanceof HTMLElement) {
            activeElement.blur()
        }
    },
}
