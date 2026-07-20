import React from 'react'
import {Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {expect, within} from 'storybook/test'
import {PneAutocomplete, PneField, PneSelect, PneTextField} from '../index'

export default {
    title: 'pne-ui/PneField',
    component: PneField,
    parameters: {
        docs: {
            description: {
                component: 'PneField владеет control ID и связями label/helper text. PNE inputs читают field context автоматически; произвольные controls подключаются через публичный render-prop adapter или hook usePneFieldControl. Field-level required семантический (aria-required) и не включает native constraint validation.',
            },
        },
    },
} as Meta<typeof PneField>

type Story = StoryObj<typeof PneField>

const deliveryServers = ['Please select', 'Email', 'SFTP']
const toggleGroupSx = {
    height: 40,
    width: '100%',
    '& .MuiToggleButton-root': {
        flex: 1,
        textTransform: 'none',
    },
}

export const Base: Story = {
    render: () => <Stack
        sx={{
            width: 420,
        }}
    >
        <PneField
            label='Report file name'
        >
            <PneTextField
                defaultValue='Cashflow_10_12_2024'
            />
        </PneField>
    </Stack>,
}

export const Controls: Story = {
    render: () => <Stack
        spacing={2}
        sx={{
            width: 420,
        }}
    >
        <PneField
            label='Report file name'
        >
            <PneTextField
                defaultValue='Cashflow_10_12_2024'
            />
        </PneField>
        <PneField
            label='Message server'
            required
        >
            <PneSelect
                options={deliveryServers.slice(1)}
                placeholder='Please select'
                value={null}
                onChange={() => undefined}
            />
        </PneField>
        <PneField label='Delivery server'>
            <PneAutocomplete
                options={deliveryServers.slice(1)}
                placeholder='Please select'
                sx={{
                    width: '100%',
                }}
            />
        </PneField>
    </Stack>,
}

export const SegmentedControl: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Произвольный control подключается к field contract через getControlProps. Существующие ARIA-ссылки объединяются с ID label/helper text; control не может ослабить field-level disabled, error и required semantics.',
            },
        },
    },
    play: ({canvasElement}) => {
        const canvas = within(canvasElement)
        const group = canvas.getByRole('group')
        const label = canvasElement.querySelector('label[for="period-control"]')
        const helperText = canvasElement.querySelector('#period-helper')
        const root = canvasElement.querySelector('#period-field')
        const labelledBy = group.getAttribute('aria-labelledby')?.split(/\s+/) ?? []
        const describedBy = group.getAttribute('aria-describedby')?.split(/\s+/) ?? []

        expect(root).not.toBeNull()
        expect(root).not.toBe(group)
        expect(label).toHaveAttribute('id', 'period-label')
        expect(label).toHaveAttribute('data-story-slot', 'label')
        expect(helperText).toHaveAttribute('data-story-slot', 'helper-text')
        expect(group).toHaveAttribute('id', 'period-control')
        expect(group).toHaveAttribute('aria-invalid', 'true')
        expect(group).toHaveAttribute('aria-required', 'true')
        expect(group).not.toHaveAttribute('required')
        expect(labelledBy).toEqual(expect.arrayContaining(['period-label', 'period-context']))
        expect(describedBy).toEqual(expect.arrayContaining(['period-format', 'period-helper']))

        canvas.getAllByRole('button').forEach(button => {
            expect(button).toBeDisabled()
            expect(button).not.toHaveAttribute('required')
        })
    },
    render: () => <Stack
        spacing={1}
        sx={{
            width: 420,
        }}
    >
        <Typography id='period-context' variant='caption'>Reporting period</Typography>
        <PneField
            controlId='period-control'
            disabled
            error
            helperText='Choose a supported period'
            id='period-field'
            label='Period'
            required
            slotProps={{
                helperText: {
                    'data-story-slot': 'helper-text',
                    id: 'period-helper',
                },
                label: {
                    'data-story-slot': 'label',
                    id: 'period-label',
                },
            }}
        >
            {({getControlProps}) => <ToggleButtonGroup
                {...getControlProps({
                    'aria-describedby': 'period-format',
                    'aria-invalid': false,
                    'aria-labelledby': 'period-context',
                    'aria-required': false,
                    disabled: false,
                })}
                exclusive
                size='medium'
                sx={toggleGroupSx}
                value='weeks'
            >
                <ToggleButton value='days'>Days</ToggleButton>
                <ToggleButton value='weeks'>Weeks</ToggleButton>
                <ToggleButton value='months'>Months</ToggleButton>
            </ToggleButtonGroup>}
        </PneField>
        <Typography id='period-format' variant='caption'>Calendar unit</Typography>
    </Stack>,
}
