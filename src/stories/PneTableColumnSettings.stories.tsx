import React, {useMemo, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    PneHeaderTableCell,
    PneTable,
    PneTableCell,
    PneTableColumnSettingsAction,
    PneTableColumnSettingsDialog,
    PneTableRow,
    PneTableToolbar,
    PneTableViewSelector,
    usePneTableColumnSettings,
    type PneTableColumnOption,
    type PneTableColumnSettingsValue,
} from '../index'

type Item = {
    id: number
    name: string
    email: string
    city: string
    status: 'active' | 'paused'
    created: string
    updated: string
}

type ItemColumn = PneTableColumnOption & {
    render: (item: Item) => React.ReactNode
}

const items: Item[] = Array.from({length: 8}, (_, index) => ({
    id: 1000 + index,
    name: `Item ${index + 1}`,
    email: `item${index + 1}@example.com`,
    city: ['Lisbon', 'Tallinn', 'Prague', 'Vienna'][index % 4],
    status: index % 3 === 0 ? 'paused' : 'active',
    created: `2026-01-${String(10 + index).padStart(2, '0')}`,
    updated: `2026-02-${String(10 + index).padStart(2, '0')}`,
}))

const fullColumns: readonly ItemColumn[] = [
    {id: 'id', label: 'ID', render: item => item.id},
    {id: 'name', label: 'Name', render: item => item.name},
    {id: 'email', label: 'Email', render: item => item.email},
    {id: 'city', label: 'City', render: item => item.city, defaultVisible: false},
    {id: 'status', label: 'Status', render: item => item.status},
    {id: 'created', label: 'Created', render: item => item.created},
    {id: 'updated', label: 'Updated', render: item => item.updated, defaultVisible: false},
]

const briefColumns: readonly ItemColumn[] = fullColumns.filter(column => (
    ['id', 'name', 'status'].includes(column.id)
))

/** Stands in for the consumer's storage adapter: any async setter works. */
const useFakeStorage = (delay = 400, fail = false) => {
    const [value, setValue] = useState<PneTableColumnSettingsValue | undefined>(undefined)
    const save = async (next: PneTableColumnSettingsValue) => {
        await new Promise(resolve => setTimeout(resolve, delay))
        if (fail) {
            throw new Error('Storage unavailable')
        }
        setValue(next)
    }
    return {value, save}
}

const ItemsTable = (props: {
    columns: readonly ItemColumn[]
    toolbar: React.ReactNode
}) => <PneTable<Item>
    autoTestId='items'
    data={items}
    toolbar={props.toolbar}
    createTableHeader={() => <PneTableRow>
        {props.columns.map(column => <PneHeaderTableCell key={column.id}>
            {column.label}
        </PneHeaderTableCell>)}
    </PneTableRow>}
    createRow={item => <PneTableRow key={item.id}>
        {props.columns.map(column => <PneTableCell key={column.id}>
            {column.render(item)}
        </PneTableCell>)}
    </PneTableRow>}
/>

const SingleViewStory = (props: {failSave?: boolean}) => {
    const storage = useFakeStorage(400, props.failSave)
    const settings = usePneTableColumnSettings({
        columns: fullColumns,
        onSave: storage.save,
        value: storage.value,
    })

    return <Box sx={{background: '#FFFFFF', p: 2}}>
        <ItemsTable
            columns={settings.visibleColumns}
            toolbar={<PneTableToolbar
                aria-label='Items table controls'
                persistent={<PneTableColumnSettingsAction
                    autoTestId='items'
                    onClick={settings.openDialog}
                    variant='button'
                />}
            />}
        />
        <PneTableColumnSettingsDialog {...settings.dialogProps} autoTestId='items'/>
        <Typography color='text.secondary' sx={{mt: 2}} variant='body2'>
            {'Stored value: '}{JSON.stringify(storage.value ?? null)}
        </Typography>
    </Box>
}

type ViewId = 'brief' | 'full'

const PerViewStory = () => {
    const [viewId, setViewId] = useState<ViewId>('full')
    const briefStorage = useFakeStorage()
    const fullStorage = useFakeStorage()
    const briefSettings = usePneTableColumnSettings({
        columns: briefColumns,
        onSave: briefStorage.save,
        value: briefStorage.value,
    })
    const fullSettings = usePneTableColumnSettings({
        columns: fullColumns,
        onSave: fullStorage.save,
        value: fullStorage.value,
    })
    const active = viewId === 'brief' ? briefSettings : fullSettings
    const views = useMemo(() => [
        {id: 'brief' as const, label: 'Brief'},
        {id: 'full' as const, label: 'Full'},
    ], [])

    return <Box sx={{background: '#FFFFFF', p: 2}}>
        <ItemsTable
            columns={active.visibleColumns}
            toolbar={<PneTableViewSelector<ViewId>
                aria-label='Items view'
                actions={<PneTableColumnSettingsAction
                    autoTestId={viewId}
                    onClick={active.openDialog}
                />}
                autoTestId='items'
                onChange={setViewId}
                value={viewId}
                views={views}
            />}
        />
        <PneTableColumnSettingsDialog {...briefSettings.dialogProps} autoTestId='brief' title='Brief view columns'/>
        <PneTableColumnSettingsDialog {...fullSettings.dialogProps} autoTestId='full' title='Full view columns'/>
    </Box>
}

const meta = {
    title: 'pne-ui/PneTable/Column settings',
    component: PneTableColumnSettingsDialog,
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof PneTableColumnSettingsDialog>

export default meta

type Story = StoryObj<Record<string, never>>

export const SingleView: Story = {
    render: () => <SingleViewStory/>,
}

export const PerView: Story = {
    render: () => <PerViewStory/>,
}

export const SaveFailure: Story = {
    render: () => <SingleViewStory failSave/>,
}
