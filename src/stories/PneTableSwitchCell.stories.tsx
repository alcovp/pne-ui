import React, {useState} from 'react'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
    PneTableSwitchCell,
} from '../index'

type StatusRow = {
    id: number
    name: string
    status: boolean
    state: 'interactive' | 'disabled' | 'readOnly'
}

const initialRows: StatusRow[] = [
    {id: 1, name: 'Primary endpoint', status: true, state: 'interactive'},
    {id: 2, name: 'Fallback endpoint', status: false, state: 'disabled'},
    {id: 3, name: 'System endpoint', status: true, state: 'readOnly'},
]

const CompactStatusTable = () => {
    const [rows, setRows] = useState(initialRows)

    return <table aria-label='Endpoint statuses' style={{borderCollapse: 'collapse', width: 520}}>
        <thead>
            <PneTableRow>
                <PneHeaderTableCell>ID</PneHeaderTableCell>
                <PneHeaderTableCell>Name</PneHeaderTableCell>
                <PneHeaderTableCell sx={{padding: 0, textAlign: 'center', width: '40px'}}>
                    Status
                </PneHeaderTableCell>
            </PneTableRow>
        </thead>
        <tbody>
            {rows.map(row => <PneTableRow data-story-row key={row.id}>
                <PneTableCell>{row.id}</PneTableCell>
                <PneTableCell>{row.name}</PneTableCell>
                {row.state === 'readOnly'
                    ? <PneTableSwitchCell
                        aria-label={`${row.name} status`}
                        checked={row.status}
                        readOnly
                    />
                    : <PneTableSwitchCell
                        aria-label={`Enable ${row.name}`}
                        checked={row.status}
                        disabled={row.state === 'disabled'}
                        onChange={checked => setRows(current => current.map(item => (
                            item.id === row.id ? {...item, status: checked} : item
                        )))}
                    />}
            </PneTableRow>)}
        </tbody>
    </table>
}

const meta = {
    title: 'pne-ui/PneTable/Switch Cell',
    component: PneTableSwitchCell,
    parameters: {
        docs: {
            description: {
                component: 'Compact 40px table status cell. It fixes PneSwitch to the small size, '
                    + 'keeps the native input accessibly named, and prevents switch activation from '
                    + 'triggering an interactive row. Cell props are top-level; switch-only props use '
                    + '`switchProps`. `autoTestId` targets the input while top-level `data-*` props in '
                    + '`switchProps` remain on the same DOM anchor as direct PneSwitch usage.',
            },
        },
    },
} satisfies Meta<typeof PneTableSwitchCell>

export default meta
type Story = StoryObj<typeof meta>

export const CompactStatuses: Story = {
    args: {
        'aria-label': 'Endpoint status',
        checked: false,
        onChange: () => undefined,
    },
    render: () => <CompactStatusTable/>,
    play: ({canvasElement}) => {
        const rows = canvasElement.querySelectorAll<HTMLElement>('[data-story-row]')

        rows.forEach(row => {
            // MUI's 20.02px body line-height rounds the normal 8px-padded row
            // to 37px in Chromium. The switch cell must fit that baseline,
            // rather than restoring the previous ~49px regression.
            if (row.getBoundingClientRect().height > 38) {
                throw new Error('A compact status switch must not expand its normal table row')
            }
        })
    },
}
