import * as React from 'react'

import {
    PneAutocomplete,
    type PneAutocompleteHtmlInputProps,
    type PneAutocompleteProps,
} from 'pne-ui'

type Region = {
    code: string
    title: string
}

type RegionWithStatus = Region & {
    status: 'active' | 'disabled'
}

type PermissionedRegion = Region & {
    disabled: boolean
}

type Channel = 'email' | 'sftp'

const regions = [
    {code: 'eu', title: 'Europe'},
    {code: 'apac', title: 'Asia Pacific'},
] as const satisfies readonly Region[]
const regionsWithStatus: readonly RegionWithStatus[] = [
    {code: 'eu', status: 'active', title: 'Europe'},
]
const baseRegion: Region = {code: 'eu', title: 'Rehydrated Europe'}
const permissionedRegions: readonly PermissionedRegion[] = [
    {code: 'eu', disabled: false, title: 'Europe'},
    {code: 'apac', disabled: true, title: 'Asia Pacific'},
]
const entities = [
    {id: 'gateway-1', displayName: 'Primary'},
    {id: 'gateway-2', displayName: 'Backup'},
] as const
const choices = [
    {choiceId: 1, displayName: 'First'},
    {choiceId: 2, displayName: 'Second'},
] as const
const rootRef = React.createRef<HTMLDivElement>()
const wrongRootRef = React.createRef<HTMLSpanElement>()
const inputRef = React.createRef<HTMLInputElement>()
const wrongInputRef = React.createRef<HTMLDivElement>()
const safeInputProps: PneAutocompleteHtmlInputProps = {
    'aria-describedby': 'region-help',
    'aria-label': 'Region',
    'data-autotest': 'region',
    autoComplete: 'address-level1',
    inputMode: 'search',
    name: 'region',
}

const primitiveAutocomplete = <PneAutocomplete
    htmlInputProps={{'aria-label': 'Retries'}}
    onChange={(_event, value) => {
        const retryCount: number | null = value
        void retryCount
    }}
    options={[1, 2, 3]}
    value={2}
/>

const literalAutocomplete = <PneAutocomplete
    onChange={(_event, value) => {
        const channel: Channel | null = value
        void channel
    }}
    options={['email', 'sftp'] as const}
    value="email"
/>

const entityAutocomplete = <PneAutocomplete
    helperText={<span>Choose a gateway</span>}
    inputRef={inputRef}
    onChange={(_event, value) => {
        const id: string | undefined = value?.id
        void id
    }}
    options={entities}
    ref={rootRef}
    value={entities[0]}
/>

const choiceAutocomplete = <PneAutocomplete
    multiple
    onChange={(_event, value) => {
        const ids: readonly number[] = value.map(choice => choice.choiceId)
        void ids
    }}
    options={choices}
    value={[choices[0]]}
/>

const customAutocomplete = <PneAutocomplete
    getOptionKey={region => region.code}
    getOptionLabel={region => region.title}
    htmlInputProps={safeInputProps}
    onChange={(_event, value) => {
        const code: string | undefined = value?.code
        void code
    }}
    options={regions}
    value={regions[0]}
/>

const freeSoloAutocomplete = <PneAutocomplete
    freeSolo
    getOptionKey={option => typeof option === 'string' ? option : option.code}
    getOptionLabel={option => typeof option === 'string' ? option : option.title}
    onChange={(_event, value) => {
        const regionOrText: Region | string | null = value
        void regionOrText
    }}
    options={regions}
    value={null}
/>

const explicitCustomFreeSolo = <PneAutocomplete<Region, false, false, true>
    freeSolo
    getOptionKey={option => typeof option === 'string' ? option : option.code}
    getOptionLabel={option => typeof option === 'string' ? option : option.title}
    onChange={(_event, value) => {
        const regionOrText: Region | string | null = value
        void regionOrText
    }}
    options={regions}
    value={null}
/>

const richOptionsWithBaseValue = <PneAutocomplete
    getOptionKey={option => option.code}
    getOptionLabel={option => option.title}
    onChange={(_event, value) => {
        const region: Region | null = value
        void region
    }}
    options={regionsWithStatus}
    value={baseRegion}
/>

const arbitraryDisabledField = <PneAutocomplete
    getOptionDisabled={option => option.disabled}
    getOptionKey={option => option.code}
    getOptionLabel={option => option.title}
    onChange={() => undefined}
    options={permissionedRegions}
    value={null}
/>

const fourGenericParameters: PneAutocompleteProps<string, true, false, true> = {
    freeSolo: true,
    multiple: true,
    onChange: () => undefined,
    options: ['email', 'sftp'],
    value: ['email', 'manual'],
}

const fiveGenericParameters: PneAutocompleteProps<string, false, false, false, 'span'> = {
    onChange: () => undefined,
    options: ['email', 'sftp'],
    slotProps: {chip: {component: 'span'}},
    value: 'email',
}

// @ts-expect-error Arbitrary objects require an explicit key adapter.
const missingCustomKey: PneAutocompleteProps<Region> = {
    getOptionLabel: region => region.title,
    onChange: () => undefined,
    options: regions,
    value: regions[0],
}

// @ts-expect-error Arbitrary objects require an explicit label adapter.
const missingCustomLabel: PneAutocompleteProps<Region> = {
    getOptionKey: region => region.code,
    onChange: () => undefined,
    options: regions,
    value: regions[0],
}

// @ts-expect-error The root ref always targets the MUI root div.
const invalidRootRef = <PneAutocomplete options={entities} value={null} onChange={() => undefined} ref={wrongRootRef}/>

// @ts-expect-error inputRef targets the native text input, not the root.
const invalidInputRef = <PneAutocomplete options={entities} value={null} onChange={() => undefined} inputRef={wrongInputRef}/>

// @ts-expect-error Replacing the root slot would invalidate the public root ref contract.
const replacementRoot = <PneAutocomplete options={entities} value={null} onChange={() => undefined} slots={{root: 'span'}}/>

// @ts-expect-error Root slot props are not exposed because the root element is fixed.
const replacementRootProps = <PneAutocomplete options={entities} value={null} onChange={() => undefined} slotProps={{root: {component: 'span'}}}/>

// @ts-expect-error The MUI root element cannot be replaced through a top-level component prop.
const replacementRootComponent = <PneAutocomplete options={entities} value={null} onChange={() => undefined} component='span'/>

// @ts-expect-error Emotion's structural `as` prop cannot replace the root div.
const replacementRootAs = <PneAutocomplete options={entities} value={null} onChange={() => undefined} as='span'/>

// @ts-expect-error Native change events are owned by MUI Autocomplete.
const unsafeInputChange: PneAutocompleteHtmlInputProps = {onChange: () => undefined}

// @ts-expect-error The native input id is owned by MUI Autocomplete.
const unsafeInputId: PneAutocompleteHtmlInputProps = {id: 'replacement'}

// @ts-expect-error The native input value is owned by MUI Autocomplete.
const unsafeInputValue: PneAutocompleteHtmlInputProps = {value: 'replacement'}

// @ts-expect-error Native disabled state is controlled by the component prop.
const unsafeInputDisabled: PneAutocompleteHtmlInputProps = {disabled: true}

// @ts-expect-error Native readonly state is controlled by the component prop.
const unsafeInputReadOnly: PneAutocompleteHtmlInputProps = {readOnly: true}

// @ts-expect-error The native combobox role is owned by MUI Autocomplete.
const unsafeInputRole: PneAutocompleteHtmlInputProps = {role: 'presentation'}

// @ts-expect-error null cannot be an autocomplete option type.
const nullOptionProps: PneAutocompleteProps<null> = {} as never

void primitiveAutocomplete
void literalAutocomplete
void entityAutocomplete
void choiceAutocomplete
void customAutocomplete
void freeSoloAutocomplete
void explicitCustomFreeSolo
void richOptionsWithBaseValue
void arbitraryDisabledField
void fourGenericParameters
void fiveGenericParameters
void missingCustomKey
void missingCustomLabel
void invalidRootRef
void invalidInputRef
void replacementRoot
void replacementRootProps
void replacementRootComponent
void replacementRootAs
void unsafeInputChange
void unsafeInputId
void unsafeInputValue
void unsafeInputDisabled
void unsafeInputReadOnly
void unsafeInputRole
void nullOptionProps
