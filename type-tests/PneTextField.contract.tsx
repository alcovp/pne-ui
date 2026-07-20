import * as React from 'react'

import {
    PneTextField,
    type PneTextFieldProps,
} from 'pne-ui'

const rootRef = React.createRef<HTMLDivElement>()
const inputRef = React.createRef<HTMLInputElement>()
const invalidRootRef = React.createRef<SVGSVGElement>()

const props: PneTextFieldProps = {
    fullWidth: true,
    helperText: 'Required',
    label: 'Report name',
    margin: 'dense',
    size: 'medium',
    sx: {width: 320},
    variant: 'outlined',
}

const validCreateElement = React.createElement(PneTextField, {
    ...props,
    inputRef,
    ref: rootRef,
})

const validContracts = <>
    <PneTextField
        {...props}
        aria-invalid='grammar'
        aria-labelledby='report-context'
        inputRef={inputRef}
        onChange={event => {
            const value: string = event.target.value
            void value
        }}
        ref={rootRef}
        slotProps={{
            htmlInput: ownerState => ({
                'aria-invalid': ownerState.error ? true : 'spelling',
                'aria-label': String(ownerState.label),
                'aria-labelledby': 'functional-input-context',
                inputMode: 'text',
            }),
        }}
    />
    <PneTextField
        helperText='Notes helper'
        label='Notes'
        minRows={2}
        multiline
    />
    <PneTextField
        select
        slotProps={{
            select: ownerState => ({
                SelectDisplayProps: {
                    'aria-describedby': ownerState.helperText ? 'select-help' : undefined,
                    title: 'Select display',
                },
            }),
        }}
        value='email'
        onChange={() => undefined}
    >
        <option value='email'>Email</option>
    </PneTextField>
    <PneTextField variant='filled'/>
    <PneTextField variant='standard'/>
</>

// @ts-expect-error PneTextField's forwarded root ref points to the MUI TextField div.
const wrongRootRef = <PneTextField ref={invalidRootRef}/>

// @ts-expect-error Only MUI TextField sizes are accepted.
const invalidSize = <PneTextField size='extra-large'/>

// @ts-expect-error Only MUI TextField variants are accepted.
const invalidVariant = <PneTextField variant='glass'/>

// @ts-expect-error Unknown props must not be accepted.
const unknownProp = <PneTextField inventedProp/>

void validCreateElement
void validContracts
void wrongRootRef
void invalidSize
void invalidVariant
void unknownProp
