import * as React from 'react'

import {
    AbstractEntitySelector,
    type AbstractEntitySelectorProp,
    type IAbstractEntityOptions,
} from 'pne-ui'

// An application passes its own objects. The selector reads `id` and the name (`name` or `displayName`);
// the other fields ride along and come back in `onChange`.
type NamedItem = {
    id: number
    name: string
    mapped: boolean
}

const namedOptions: IAbstractEntityOptions<NamedItem> = {
    list: [{id: 1, name: 'First', mapped: false}],
    selected: [],
    onChange: (added, available) => {
        const first: NamedItem | undefined = added[0] ?? available[0]
        void first
    },
}

const namedItems = <AbstractEntitySelector {...namedOptions}/>
const texts = <AbstractEntitySelector list={['First']} selected={[]} onChange={() => undefined}/>
const entities = <AbstractEntitySelector
    list={[{id: 1, displayName: 'First'}]}
    selected={[]}
    onChange={() => undefined}
/>

// @ts-expect-error An item needs a name to show: `name` or `displayName`.
const nameless: AbstractEntitySelectorProp = {id: 1}

void namedItems
void texts
void entities
void nameless
