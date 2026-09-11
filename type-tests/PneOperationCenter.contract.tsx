import * as React from 'react'

import {
    OverlayHost,
    PneOperationCenter,
    type PneOperationCenterItem,
    type PneOperationCenterProps,
    type PneOperationCenterStatus,
} from 'pne-ui'

const status: PneOperationCenterStatus = 'running'
const operations = [{
    actions: [{accessibleLabel: 'Cancel', id: 'cancel', label: <span>Cancel</span>}],
    context: 'Order #8861110',
    id: 'report:8861110',
    progress: {kind: 'determinate', value: 40},
    status,
    title: 'Generating report',
}] as const satisfies readonly PneOperationCenterItem[]

const props: PneOperationCenterProps = {
    onAction: (operationId, actionId) => void `${operationId}:${actionId}`,
    operations,
}

const validContracts = <>
    <PneOperationCenter {...props}/>
    <OverlayHost operationCenter={<PneOperationCenter {...props}/>}/>
</>

// @ts-expect-error Operation status must be one of the explicit lifecycle states.
const invalidStatus: PneOperationCenterItem = {id: 'broken', status: 'pending', title: 'Broken'}

const missingProgress: PneOperationCenterItem = {
    id: 'broken-progress',
    // @ts-expect-error Determinate progress requires a numeric value.
    progress: {kind: 'determinate'},
    status: 'running',
    title: 'Broken progress',
}

void validContracts
void invalidStatus
void missingProgress
