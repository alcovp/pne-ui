import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { Box, Stack, Typography } from '@mui/material'
import { PneHighContrastLabeledCheckbox } from '../index'

export default {
    title: 'pne-ui/PneHighContrastLabeledCheckbox',
    component: PneHighContrastLabeledCheckbox,
} as Meta<typeof PneHighContrastLabeledCheckbox>

type Story = StoryObj<typeof PneHighContrastLabeledCheckbox>

const ControlledHighContrastCheckbox: React.FC<React.ComponentProps<typeof PneHighContrastLabeledCheckbox>> = (args) => {
    const [checked, setChecked] = React.useState(args.checked ?? false)

    React.useEffect(() => {
        setChecked(args.checked ?? false)
    }, [args.checked])

    return (
        <PneHighContrastLabeledCheckbox
            {...args}
            checked={checked}
            onChange={(event, newChecked) => {
                setChecked(newChecked)
                args.onChange?.(event, newChecked)
            }}
        />
    )
}

const BACKGROUNDS: Array<{ label: string; color: string; labelColor: string }> = [
    { label: 'White', color: '#FFFFFF', labelColor: '#1F2937' },
    { label: 'Sky', color: '#083a6f', labelColor: '#1F2937' },
    { label: 'Mint', color: '#E6FFE9', labelColor: '#1F2937' },
    { label: 'Peach', color: '#eac9ac', labelColor: '#1F2937' },
    { label: 'Lavender', color: '#F1E5FF', labelColor: '#1F2937' },
    { label: 'Deep Night', color: '#0F172A', labelColor: '#FFFFFF' },
]

export const Default: Story = {
    args: {
        label: 'Label',
        // helperText: 'Helper text',
        error: false,
        disabled: false,
        checked: false,
        size: 'small',
    },
    argTypes: {
        label: {
            control: 'text',
        },
        helperText: {
            control: 'text',
        },
        error: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
        checked: {
            control: 'boolean',
        },
        size: {
            control: 'radio',
            options: ['small', 'medium'],
        },
    },
    render: (args) => <ControlledHighContrastCheckbox {...args}/>,
}

export const Backgrounds: Story = {
    args: {
        ...Default.args,
    },
    render: (args) => (
        <Stack spacing={2}>
            {BACKGROUNDS.map((background) => (
                <Box
                    key={background.label}
                    sx={{
                        backgroundColor: background.color,
                        borderRadius: 1,
                        padding: 2,
                    }}
                >
                    <ControlledHighContrastCheckbox {...args}/>
                </Box>
            ))}
        </Stack>
    ),
}
