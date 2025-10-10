import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { PneLabeledCheckbox } from '../index'

export default {
    title: 'pne-ui/PneLabeledCheckbox',
    component: PneLabeledCheckbox,
} as Meta<typeof PneLabeledCheckbox>

type Story = StoryObj<typeof PneLabeledCheckbox>

const ControlledLabeledCheckbox: React.FC<React.ComponentProps<typeof PneLabeledCheckbox>> = (args) => {
    const [checked, setChecked] = React.useState(args.checked ?? false)

    React.useEffect(() => {
        setChecked(args.checked ?? false)
    }, [args.checked])

    return (
        <PneLabeledCheckbox
            {...args}
            checked={checked}
            onChange={(event, newChecked) => {
                setChecked(newChecked)
                args.onChange?.(event, newChecked)
            }}
        />
    )
}

export const Default: Story = {
    args: {
        label: 'Label',
        helperText: 'Helper text',
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
    render: (args) => <ControlledLabeledCheckbox {...args}/>,
}
