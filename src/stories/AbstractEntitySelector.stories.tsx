import * as React from 'react'
import {Box, Typography} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import {userEvent, within} from 'storybook/test'
import {AbstractEntitySelectModal, PneButton} from '../index'

const allColumns = ['ID', 'Name', 'E-Mail', 'Status', 'Login', 'Managers', 'Payment group', 'Navigation bar']

const FullViewColumnsExample = () => {
    const [columns, setColumns] = React.useState(allColumns.slice(0, 5))
    const [open, setOpen] = React.useState(false)

    return <Box sx={{p: 2}}>
        <PneButton onClick={() => setOpen(true)}>Configure Full view</PneButton>
        <Typography role='status' sx={{mt: 2}}>
            Saved order: {columns.join(' → ')}
        </Typography>
        {open && <AbstractEntitySelectModal<string>
            handleSave={({mapped}) => {
                setColumns(mapped)
                setOpen(false)
            }}
            mappedList={columns}
            onClose={() => setOpen(false)}
            open
            title='Full view columns'
            unMappedList={allColumns.filter(column => !columns.includes(column))}
            virtualized={false}
            dragHandle='button'
        />}
    </Box>
}

const meta = {
    title: 'pne-ui/AbstractEntitySelector',
    component: FullViewColumnsExample,
    parameters: {
        docs: {
            description: {
                component: 'Drag the grip beside a column to reorder it, then save and reopen. Touch dragging starts on movement with no long press. Swipe over the column label to scroll; tap the label to move it between lists. Keyboard dragging uses the grip with Space, arrow keys and Space; Escape cancels the drag. The dragHandle="button" mode keeps the original touch target mounted throughout the gesture.',
            },
        },
    },
} satisfies Meta<typeof FullViewColumnsExample>

export default meta
type Story = StoryObj<typeof meta>

export const FullViewColumns: Story = {
    play: async ({canvasElement}) => {
        await userEvent.click(within(canvasElement).getByRole('button', {name: 'Configure Full view'}))
    },
}
