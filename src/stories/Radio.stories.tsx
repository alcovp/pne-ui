import * as React from 'react'
import {Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography} from '@mui/material'
import type {RadioProps} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'

// The library has no radio of its own: these are the stories of the MUI `Radio` as the theme of
// pne-ui draws it (UI Kit Radio).
export default {
    title: 'pne-ui/Radio',
    component: Radio,
    args: {
        size: 'medium',
        disabled: false,
    },
    argTypes: {
        size: {control: 'inline-radio', options: ['small', 'medium']},
    },
} as Meta<typeof Radio>

type Story = StoryObj<typeof Radio>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

type PinnedRadioProps = RadioProps & {'data-pne-state'?: 'hover' | 'pressed' | 'focus'}

const MATRIX_COLUMNS: Array<{label: string; props: PinnedRadioProps}> = [
    {label: 'Default', props: {}},
    {label: 'Hover', props: {'data-pne-state': 'hover'}},
    {label: 'Pressed', props: {'data-pne-state': 'pressed'}},
    {label: 'Focus', props: {'data-pne-state': 'focus'}},
    {label: 'Disabled', props: {disabled: true}},
]

const MATRIX_ROWS: Array<{label: string; props: PinnedRadioProps}> = [
    {label: 'off · medium', props: {checked: false}},
    {label: 'on · medium', props: {checked: true}},
    {label: 'off · small', props: {checked: false, size: 'small'}},
    {label: 'on · small', props: {checked: true, size: 'small'}},
]

/** UI Kit Radio: the 20px circle of forms and the 16px one of rows, off and on, by state. */
export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2, maxWidth: 760}}>
                Off is the canvas fill in a 1.5px ring; on is a thick brand ring around the canvas centre. Hover and
                press recolour the circle, there is no halo. Hover, Pressed and Focus are pinned with{' '}
                <code>data-pne-state</code>; product code never sets it.
            </Typography>
            <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 4px', ml: -2}}>
                <thead>
                    <tr>
                        <th />
                        {MATRIX_COLUMNS.map(column => (
                            <Box component='th' key={column.label} sx={{...CAPTION_SX, fontWeight: 400}}>
                                {column.label}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MATRIX_ROWS.map(row => (
                        <tr key={row.label}>
                            <Box component='td' sx={CAPTION_SX}>
                                {row.label}
                            </Box>
                            {MATRIX_COLUMNS.map(column => (
                                <Box component='td' key={column.label} sx={{textAlign: 'center'}}>
                                    <Radio
                                        {...row.props}
                                        {...column.props}
                                        slotProps={{input: {'aria-label': `${row.label}, ${column.label}`}}}
                                    />
                                </Box>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    ),
}

const OPTIONS = ['Black', 'White', 'Loyal']

const Group = ({row, size}: {row?: boolean; size: 'small' | 'medium'}) => {
    const [value, setValue] = React.useState('Black')
    return (
        <FormControl>
            <FormLabel sx={CAPTION_SX}>
                {size}
                {row ? ' · row' : ''}
            </FormLabel>
            <RadioGroup onChange={(_event, next) => setValue(next)} row={row} value={value}>
                {OPTIONS.map(option => (
                    <FormControlLabel control={<Radio size={size} />} key={option} label={option} value={option} />
                ))}
                <FormControlLabel control={<Radio size={size} />} disabled label='Disabled' value='Disabled' />
            </RadioGroup>
        </FormControl>
    )
}

/** A group with labels, as pages build it from `RadioGroup` and `FormControlLabel`. */
export const Groups: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={3} sx={{p: 3}}>
            <Group row size='medium' />
            <Group row size='small' />
            <Stack direction='row' spacing={6}>
                <Group size='medium' />
                <Group size='small' />
            </Stack>
        </Stack>
    ),
}

const PlaygroundRadio = (props: RadioProps) => {
    const [checked, setChecked] = React.useState(false)
    return (
        <Box sx={{p: 3}}>
            <Radio
                {...props}
                checked={checked}
                onClick={() => setChecked(value => !value)}
                slotProps={{input: {'aria-label': 'Radio'}}}
            />
        </Box>
    )
}

export const Playground: Story = {
    render: args => <PlaygroundRadio {...args} />,
}
