import * as React from 'react'

import {
    PneTableControlCell,
    PneTableSwitchCell,
    type PneTableSwitchCellProps,
    type PneTableSwitchControlProps,
} from 'pne-ui'

const inputRef = React.createRef<HTMLInputElement>()
const cellRef = React.createRef<HTMLTableCellElement>()
const switchRef = React.createRef<HTMLSpanElement>()
const invalidCellRef = React.createRef<HTMLSpanElement>()
const invalidInputRef = React.createRef<HTMLDivElement>()
const invalidSwitchRef = React.createRef<SVGSVGElement>()

const switchProps: PneTableSwitchControlProps = {
    'data-autotest': 'legacy-status-switch',
    id: 'status-control',
    inputRef,
    name: 'enabled',
    sx: {marginInline: 'auto'},
}

const interactiveProps: PneTableSwitchCellProps = {
    'aria-label': 'Enable gate',
    checked: false,
    onChange: (checked, event) => {
        const nextChecked: boolean = checked
        const input: HTMLInputElement = event.currentTarget
        void nextChecked
        void input
    },
    switchProps,
}
const asyncInteractiveProps: PneTableSwitchCellProps = {
    'aria-label': 'Enable async gate',
    checked: false,
    onChange: async (checked, event) => {
        const nextChecked: boolean = checked
        const input: HTMLInputElement = event.currentTarget
        await Promise.resolve()
        void nextChecked
        void input
    },
}
type TableSwitchChangeResult = ReturnType<NonNullable<PneTableSwitchCellProps['onChange']>>
const asyncTableSwitchResult: TableSwitchChangeResult = Promise.resolve()

const validContracts = <>
    <table>
        <tbody>
            <tr>
                <PneTableControlCell ref={cellRef}>Control</PneTableControlCell>
                <PneTableSwitchCell
                    {...interactiveProps}
                    ref={cellRef}
                    switchRef={switchRef}
                />
                <PneTableSwitchCell {...asyncInteractiveProps}/>
                <PneTableSwitchCell
                    aria-labelledby='status-column'
                    checked
                    readOnly
                    switchProps={{inputRef}}
                    sx={{width: '44px'}}
                />
            </tr>
        </tbody>
    </table>
</>

// @ts-expect-error A switch without a visible label requires an accessible name.
const missingAccessibleName = <PneTableSwitchCell checked={false} onChange={() => undefined}/>

// @ts-expect-error Accessible naming is intentionally exclusive.
const ambiguousAccessibleName = <PneTableSwitchCell
    aria-label='Enable gate'
    aria-labelledby='status-column'
    checked={false}
    onChange={() => undefined}
/>

// @ts-expect-error Interactive controlled switches require a change handler.
const missingInteractiveHandler = <PneTableSwitchCell aria-label='Enable gate' checked={false}/>

// @ts-expect-error A read-only status cannot expose an ineffective change handler.
const readOnlyHandler = <PneTableSwitchCell
    aria-label='Gate status'
    checked
    onChange={() => undefined}
    readOnly
/>

const customSwitchSize = <PneTableSwitchCell
    aria-label='Enable gate'
    checked={false}
    onChange={() => undefined}
    // @ts-expect-error The compact cell owns the switch size.
    switchProps={{size: 'medium'}}
/>

const nestedChecked = <PneTableSwitchCell
    aria-label='Enable gate'
    checked={false}
    onChange={() => undefined}
    // @ts-expect-error Controlled state belongs to the cell, not nested switch props.
    switchProps={{checked: true}}
/>

// @ts-expect-error PneTableControlCell forwards its ref to an HTMLTableCellElement.
const wrongControlCellRef = <PneTableControlCell ref={invalidCellRef}/>

const wrongSwitchCellRef = <PneTableSwitchCell
    {...interactiveProps}
    // @ts-expect-error PneTableSwitchCell forwards its primary ref to the table cell.
    ref={invalidCellRef}
/>

const wrongSwitchRootRef = <PneTableSwitchCell
    {...interactiveProps}
    // @ts-expect-error switchRef points to the PneSwitch HTMLSpanElement root.
    switchRef={invalidSwitchRef}
/>

const wrongSwitchInputRef = <PneTableSwitchCell
    {...interactiveProps}
    // @ts-expect-error switchProps.inputRef points to the native HTMLInputElement.
    switchProps={{inputRef: invalidInputRef}}
/>

void validContracts
void asyncTableSwitchResult
void missingAccessibleName
void ambiguousAccessibleName
void missingInteractiveHandler
void readOnlyHandler
void customSwitchSize
void nestedChecked
void wrongControlCellRef
void wrongSwitchCellRef
void wrongSwitchRootRef
void wrongSwitchInputRef
