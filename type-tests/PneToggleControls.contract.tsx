import * as React from 'react'

import {
    PneCheckbox,
    type PneCheckboxProps,
    PneLabeledCheckbox,
    type PneLabeledCheckboxProps,
    PneSwitch,
    type PneSwitchProps,
} from 'pne-ui'

const rootRef = React.createRef<HTMLSpanElement>()
const inputRef = React.createRef<HTMLInputElement>()
const invalidRootRef = React.createRef<SVGSVGElement>()
const invalidInputRef = React.createRef<HTMLDivElement>()

const checkboxProps: PneCheckboxProps = {
    'aria-label': 'Select report',
    defaultChecked: true,
    inputRef,
    name: 'report',
    readOnly: true,
    required: true,
    value: 'selected',
}
const switchProps: PneSwitchProps = {
    'aria-label': 'Live updates',
    defaultChecked: false,
    inputRef,
    name: 'updates',
}
const labeledProps: PneLabeledCheckboxProps = {
    helperText: 'Selection help',
    label: 'Select all',
}

const validCreateElements = [
    React.createElement(PneCheckbox, {...checkboxProps, ref: rootRef}),
    React.createElement(PneSwitch, {...switchProps, ref: rootRef}),
    React.createElement(PneLabeledCheckbox, {...labeledProps, ref: rootRef}),
]

const validContracts = <>
    <PneCheckbox
        {...checkboxProps}
        onChange={(event, checked) => {
            const input: HTMLInputElement = event.currentTarget
            const nextChecked: boolean = checked
            void input
            void nextChecked
        }}
        ref={rootRef}
        slotProps={{
            input: ownerState => ({
                'aria-label': ownerState.indeterminate ? 'Mixed selection' : 'Selection',
                inputMode: 'none',
                ref: inputRef,
            }),
        }}
    />
    <PneSwitch
        {...switchProps}
        ref={rootRef}
        slotProps={{
            input: ownerState => ({
                'aria-label': String(ownerState.name),
                ref: inputRef,
            }),
        }}
    />
    <PneLabeledCheckbox
        {...labeledProps}
        helperTextProps={{id: 'selection-help'}}
        inputRef={inputRef}
        ref={rootRef}
    />
</>

// @ts-expect-error The primary toggle ref points to the MUI span root.
const wrongCheckboxRootRef = <PneCheckbox ref={invalidRootRef}/>

// @ts-expect-error The primary switch ref points to the MUI span root.
const wrongSwitchRootRef = <PneSwitch ref={invalidRootRef}/>

// @ts-expect-error The labeled checkbox ref points to its checkbox span root.
const wrongLabeledRootRef = <PneLabeledCheckbox ref={invalidRootRef}/>

// @ts-expect-error inputRef points to the native HTMLInputElement.
const wrongInputRef = <PneCheckbox inputRef={invalidInputRef}/>

// @ts-expect-error Unknown props must not be accepted.
const unknownCheckboxProp = <PneCheckbox inventedProp/>

// @ts-expect-error Unknown props must not be accepted.
const unknownSwitchProp = <PneSwitch inventedProp/>

void validCreateElements
void validContracts
void wrongCheckboxRootRef
void wrongSwitchRootRef
void wrongLabeledRootRef
void wrongInputRef
void unknownCheckboxProp
void unknownSwitchProp
