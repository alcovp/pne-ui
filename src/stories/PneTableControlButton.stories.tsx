import React, {useState} from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    PneTableControlButton,
    PneTableSelectionControls,
    PneTableToolbar,
    PneTableViewSelector,
} from '../index'

const meta = {
    title: 'pne-ui/PneTable/Control button',
    component: PneTableControlButton,
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof PneTableControlButton>

export default meta

type Story = StoryObj<Record<string, never>>

const Band = (props: {selected: number}) => {
    const [selected, setSelected] = useState(props.selected)
    const [view, setView] = useState<'brief' | 'detailed'>('brief')

    return <PneTableToolbar
        aria-label='Gates table controls'
        contextual={<PneTableSelectionControls
            summary={selected > 0 ? `Selected: ${selected}` : undefined}
            actions={<>
                {selected > 0 ? <PneTableControlButton onClick={() => setSelected(0)}>Clear</PneTableControlButton> : null}
                <PneTableControlButton onClick={() => setSelected(50)}>Select all</PneTableControlButton>
                <PneTableControlButton aria-haspopup='menu' disabled={selected === 0} emphasis='strong' menu>
                    Actions
                </PneTableControlButton>
            </>}
        />}
        persistent={<PneTableViewSelector
            aria-label='Gates view'
            onChange={setView}
            value={view}
            views={[{id: 'brief', label: 'Brief'}, {id: 'detailed', label: 'Detailed (0)'}]}
        />}
    />
}

/** The selection of a band next to its views: the same height, greys and spacing, no skin colours. */
export const SelectionBand: Story = {
    render: () => <Stack spacing={3} sx={{maxWidth: 900}}>
        <Box>
            <Typography variant='caption'>Nothing selected</Typography>
            <Band selected={0}/>
        </Box>
        <Box>
            <Typography variant='caption'>Three rows selected</Typography>
            <Band selected={3}/>
        </Box>
        <Box sx={{maxWidth: 328}}>
            <Typography variant='caption'>360px screen</Typography>
            <Band selected={3}/>
        </Box>
    </Stack>,
}
