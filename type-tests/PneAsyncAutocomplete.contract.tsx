import * as React from 'react'

import {
    PneAsyncAutocomplete,
    type PneAsyncAutocompleteLoadContext,
    type PneAsyncAutocompleteLoadErrorContext,
    type PneAsyncAutocompleteLoadReason,
    type PneAsyncAutocompleteProps,
    type PneLoadOptions,
} from 'pne-ui'

type Region = {
    code: string
    title: string
}

type RegionWithStatus = Region & {
    status: 'active' | 'disabled'
}

type Choice = {
    choiceId: number
    displayName: string
}

type ChoiceWithStatus = Choice & {
    status: 'active' | 'disabled'
}

const regions = [
    {code: 'eu', title: 'Europe'},
    {code: 'apac', title: 'Asia Pacific'},
] as const satisfies readonly Region[]
const regionsWithStatus: readonly RegionWithStatus[] = [
    {code: 'eu', status: 'active', title: 'Europe'},
]
const baseRegion: Region = {code: 'eu', title: 'Rehydrated Europe'}
const entities = [
    {id: 'gateway-1', displayName: 'Primary'},
    {id: 'gateway-2', displayName: 'Backup'},
] as const
const choicesWithStatus: readonly ChoiceWithStatus[] = [
    {choiceId: 1, displayName: 'Active', status: 'active'},
]

const regionLoader: PneLoadOptions<Region> = async (query, context) => {
    const reason: PneAsyncAutocompleteLoadReason = context.reason
    const signal: AbortSignal = context.signal
    void reason
    void signal

    return regions.filter(region => region.title.toLowerCase().includes(query.toLowerCase()))
}

const loadContext: PneAsyncAutocompleteLoadContext = {
    reason: 'reload',
    signal: new AbortController().signal,
}
const loadErrorContext: PneAsyncAutocompleteLoadErrorContext = {
    ...loadContext,
    query: 'eu',
}

const inferredEntity = <PneAsyncAutocomplete
    helperText={<span>Choose a gateway</span>}
    loadOptions={async () => entities}
    onChange={(_event, value) => {
        const id: string | undefined = value?.id
        void id
    }}
    value={entities[0]}
/>

const inferredChoice = <PneAsyncAutocomplete
    loadOptions={async () => choicesWithStatus}
    onChange={(_event, value) => {
        const choice: Choice | null = value
        void choice
    }}
    value={null as Choice | null}
/>

const customObject = <PneAsyncAutocomplete
    getOptionKey={region => region.code}
    getOptionLabel={region => region.title}
    loadOptions={regionLoader}
    onLoadError={(error, context) => {
        const unknownError: unknown = error
        const query: string = context.query
        const reason: PneAsyncAutocompleteLoadReason = context.reason
        void unknownError
        void query
        void reason
    }}
    value={regions[0]}
/>

const inferredCustomObject = <PneAsyncAutocomplete
    getOptionKey={region => region.code}
    getOptionLabel={region => region.title}
    loadOptions={async () => regions}
    value={null}
/>

const richCustomResultsWithBaseValue = <PneAsyncAutocomplete
    getOptionKey={region => region.code}
    getOptionLabel={region => region.title}
    loadOptions={async () => regionsWithStatus}
    onChange={(_event, value) => {
        const region: Region | null = value
        void region
    }}
    value={baseRegion}
/>

const inferredCustomFreeSolo = <PneAsyncAutocomplete
    freeSolo
    getOptionKey={option => typeof option === 'string' ? option : option.code}
    getOptionLabel={option => typeof option === 'string' ? option : option.title}
    loadOptions={async () => regions}
    onChange={(_event, value) => {
        const regionOrText: Region | string | null = value
        void regionOrText
    }}
    value={null}
/>

const explicitCustomFreeSolo = <PneAsyncAutocomplete<Region, false, false, true>
    freeSolo
    getOptionKey={option => typeof option === 'string' ? option : option.code}
    getOptionLabel={option => typeof option === 'string' ? option : option.title}
    loadOptions={regionLoader}
    value={null}
/>

const fourGenericParameters: PneAsyncAutocompleteProps<string, true, false, true> = {
    freeSolo: true,
    loadOptions: async query => [query],
    multiple: true,
    onChange: () => undefined,
    value: ['email', 'manual'],
}

const fiveGenericParameters: PneAsyncAutocompleteProps<string, false, false, false, 'span'> = {
    loadOptions: async () => ['email', 'sftp'],
    onChange: () => undefined,
    slotProps: {chip: {component: 'span'}},
    value: 'email',
}

// @ts-expect-error Arbitrary objects require an explicit key adapter.
const missingCustomKey: PneAsyncAutocompleteProps<Region> = {
    getOptionLabel: region => region.title,
    loadOptions: regionLoader,
    value: regions[0],
}

// @ts-expect-error Arbitrary objects require an explicit label adapter.
const missingCustomLabel: PneAsyncAutocompleteProps<Region> = {
    getOptionKey: region => region.code,
    loadOptions: regionLoader,
    value: regions[0],
}

const managedOptions = <PneAsyncAutocomplete
    loadOptions={async () => entities}
    // @ts-expect-error Remote options are owned by PneAsyncAutocomplete.
    options={entities}
/>

const managedLoading = <PneAsyncAutocomplete
    loadOptions={async () => entities}
    // @ts-expect-error Loading state is owned by PneAsyncAutocomplete.
    loading
/>

const managedFiltering = <PneAsyncAutocomplete
    // @ts-expect-error Client-side filtering is disabled for remote results.
    filterOptions={options => options}
    loadOptions={async () => entities}
/>

// @ts-expect-error The legacy searchChoices API was removed.
const legacyLoader = <PneAsyncAutocomplete searchChoices={async () => entities}/>

// @ts-expect-error Debouncing is intentionally outside the component contract.
const componentDebounce = <PneAsyncAutocomplete debounceMs={300} loadOptions={async () => entities}/>

void regionLoader
void loadContext
void loadErrorContext
void inferredEntity
void inferredChoice
void customObject
void inferredCustomObject
void richCustomResultsWithBaseValue
void inferredCustomFreeSolo
void explicitCustomFreeSolo
void fourGenericParameters
void fiveGenericParameters
void missingCustomKey
void missingCustomLabel
void managedOptions
void managedLoading
void managedFiltering
void legacyLoader
void componentDebounce
