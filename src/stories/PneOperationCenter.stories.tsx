import * as React from 'react'
import {Box, Typography} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    OverlayHost,
    PneOperationCenter,
    type PneOperationCenterItem,
    overlayActions,
} from '../index'

const initialOperations: readonly PneOperationCenterItem[] = [
    {
        actions: [{id: 'cancel', label: 'Cancel'}],
        context: 'Order #8861110',
        detail: 'The report continues while you navigate through Paynet.',
        id: 'report:8861110',
        progress: {kind: 'determinate', value: 64},
        status: 'running',
        title: 'Generating transaction report',
    },
    {
        context: 'Order #8861110 · Capture',
        id: 'action:8861110:capture',
        progress: {kind: 'indeterminate', label: 'Waiting for processor'},
        status: 'queued',
        title: 'Processing order action',
    },
    {
        actions: [{id: 'retry-monitoring', label: 'Reconnect'}],
        context: 'Order #7712042 · Refund',
        detail: 'The operation may still be running. Reconnect to retrieve its current status.',
        id: 'action:7712042:refund',
        status: 'monitoring-error',
        title: 'Monitoring interrupted',
    },
    {
        actions: [{id: 'download', label: 'Download'}],
        context: 'Order #5530188',
        id: 'report:5530188',
        status: 'succeeded',
        title: 'Settlement report',
    },
]

type OperationCenterDemoProps = {
    defaultExpanded?: boolean
    showSnackbar?: boolean
}

const OperationCenterDemo = ({
    defaultExpanded = true,
    showSnackbar = false,
}: OperationCenterDemoProps) => {
    const [operations, setOperations] = React.useState(initialOperations)

    React.useEffect(() => {
        if (!showSnackbar) return undefined

        const id = 'operation-center-layout-demo'
        overlayActions.showInfo({
            autoHideMs: undefined,
            id,
            message: 'Background report has been queued',
        })
        return () => overlayActions.removeSnackbar(id)
    }, [showSnackbar])

    const removeOperations = (ids: readonly string[]) => {
        const removed = new Set(ids)
        setOperations(current => current.filter(operation => !removed.has(operation.id)))
    }

    const handleAction = (operationId: string, actionId: string) => {
        if (actionId === 'download') {
            overlayActions.showSuccess({message: 'Report download started'})
            return
        }

        setOperations(current => current.map(operation => {
            if (operation.id !== operationId) return operation
            if (actionId === 'cancel') return {...operation, actions: [], progress: undefined, status: 'cancelled'}
            if (actionId === 'retry-monitoring') return {
                ...operation,
                actions: [],
                detail: 'Connection restored.',
                progress: {kind: 'indeterminate'},
                status: 'running',
            }
            return operation
        }))
    }

    return (
        <Box sx={{bgcolor: 'background.default', minHeight: '100vh', p: 3}}>
            <Typography component='h1' sx={{fontSize: 20, fontWeight: 700}}>
                Host-owned background work
            </Typography>
            <Typography color='text.secondary' sx={{fontSize: 14, mt: 0.5}}>
                Navigate freely: the host keeps these operations alive and passes only their view model to pne-ui.
            </Typography>
            <OverlayHost
                operationCenter={(
                    <PneOperationCenter
                        defaultExpanded={defaultExpanded}
                        onAction={handleAction}
                        onClearTerminal={removeOperations}
                        onDismiss={operationId => removeOperations([operationId])}
                        operations={operations}
                    />
                )}
            />
        </Box>
    )
}

const meta = {
    title: 'pne-ui/OverlayHost/Operation center',
    component: OperationCenterDemo,
    parameters: {layout: 'fullscreen'},
    tags: ['autodocs'],
} satisfies Meta<typeof OperationCenterDemo>

export default meta

type Story = StoryObj<typeof meta>

export const MixedLifecycle: Story = {
    args: {defaultExpanded: true},
}

export const CollapsedSummary: Story = {
    args: {defaultExpanded: false},
}

export const Mobile360: Story = {
    args: {defaultExpanded: true},
    globals: {viewport: {value: 'mobile360', isRotated: false}},
}

export const DesktopWithSnackbar: Story = {
    args: {defaultExpanded: false, showSnackbar: true},
}

export const MobileWithSnackbar: Story = {
    args: {defaultExpanded: true, showSnackbar: true},
    globals: {viewport: {value: 'mobile360', isRotated: false}},
}

export const DarkExpanded: Story = {
    args: {defaultExpanded: true},
    globals: {colorMode: 'dark'},
}

export const DarkCollapsed: Story = {
    args: {defaultExpanded: false},
    globals: {colorMode: 'dark'},
}
