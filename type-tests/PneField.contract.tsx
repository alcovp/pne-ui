import {ToggleButton, ToggleButtonGroup} from '@mui/material'
import * as React from 'react'

import {
    PneField,
    type PneFieldControlAdapter,
    type PneFieldControlDomProps,
    type PneFieldProps,
    PneTextField,
    usePneFieldControl,
} from 'pne-ui'

const divRef = React.createRef<HTMLDivElement>()
const fieldsetRef = React.createRef<HTMLFieldSetElement>()
const invalidRootRef = React.createRef<SVGSVGElement>()

const fieldProps: PneFieldProps = {
    children: <PneTextField/>,
    controlId: 'account-control',
    helperText: 'Use a unique value',
    id: 'account-field',
    label: 'Account',
    required: true,
    slotProps: {
        helperText: {
            'data-contract': 'helper',
            id: 'account-helper',
            ref: React.createRef<HTMLParagraphElement>(),
        },
        label: {
            'data-contract': 'label',
            id: 'account-label',
            ref: React.createRef<HTMLLabelElement>(),
        },
    },
}

const renderControl = (field: PneFieldControlAdapter) => {
    const controlProps = field.getControlProps({
        'aria-describedby': 'account-format',
        'aria-label': 'Account type',
        'data-contract': 'control',
    })
    const controlId: string = controlProps.id
    const disabled: boolean = controlProps.disabled
    const ariaDisabled: React.AriaAttributes['aria-disabled'] = controlProps['aria-disabled']
    const dataContract: string | undefined = controlProps['data-contract']

    void controlId
    void disabled
    void ariaDisabled
    void dataContract

    return <ToggleButtonGroup {...controlProps} exclusive value='business'>
        <ToggleButton value='personal'>Personal</ToggleButton>
        <ToggleButton value='business'>Business</ToggleButton>
    </ToggleButtonGroup>
}

const HookAdaptedControl = () => {
    const field = usePneFieldControl()

    if (!field) {
        return null
    }

    return <ToggleButtonGroup
        {...field.getControlProps<PneFieldControlDomProps>({
            'aria-describedby': 'hook-control-format',
        })}
        exclusive
        value='enabled'
    >
        <ToggleButton value='enabled'>Enabled</ToggleButton>
        <ToggleButton value='disabled'>Disabled</ToggleButton>
    </ToggleButtonGroup>
}

const validContracts = <>
    <PneField {...fieldProps} ref={divRef}/>
    <PneField
        component='fieldset'
        controlId='schedule-control'
        label='Schedule'
        ref={fieldsetRef}
    >
        {renderControl}
    </PneField>
    <PneField htmlFor='legacy-control' label='Legacy alias'>
        {field => <input {...field.getControlProps()}/>}
    </PneField>
    <PneField label='Hook adapter'>
        <HookAdaptedControl/>
    </PneField>
</>

// @ts-expect-error The default PneField root ref points to an HTMLDivElement.
const wrongRootRef = <PneField label='Invalid ref' ref={invalidRootRef}><input/></PneField>

// @ts-expect-error Split FormControl appearance state is not part of the PneField API.
const invalidColor = <PneField color='primary'><input/></PneField>

// @ts-expect-error Split FormControl focus state is not part of the PneField API.
const invalidFocused = <PneField focused><input/></PneField>

// @ts-expect-error Split FormControl hidden-label state is not part of the PneField API.
const invalidHiddenLabel = <PneField hiddenLabel><input/></PneField>

// @ts-expect-error Control size belongs on the child control, not PneField.
const invalidSize = <PneField size='small'><input/></PneField>

// @ts-expect-error Control variant belongs on the child control, not PneField.
const invalidVariant = <PneField variant='outlined'><input/></PneField>

// @ts-expect-error PneField accepts exactly one logical control or one render function.
const multipleControls = <PneField label='Invalid children'>
    <input/>
    <input/>
</PneField>

void validContracts
void wrongRootRef
void invalidColor
void invalidFocused
void invalidHiddenLabel
void invalidSize
void invalidVariant
void multipleControls
