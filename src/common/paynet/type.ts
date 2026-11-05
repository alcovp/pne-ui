import {isObject, Order} from "../pne";

export type AbstractEntity = {
    id: number
    displayName: string
}

export const isAbstractEntity = (value: unknown): value is AbstractEntity => {
    if (!isObject(value)) {
        return false;
    }

    return 'id' in value && typeof value.id === 'number' &&
        'displayName' in value && typeof value.displayName === 'string';
}

export function assertAbstractEntity(value: unknown): asserts value is AbstractEntity {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Not an object: ' + value);
    }

    if (!('id' in value) || typeof value.id !== 'number') {
        throw new Error('id is not a number');
    }

    if (!('displayName' in value) || typeof value.displayName !== 'string') {
        throw new Error('displayName is not a string');
    }
}

export type AutoCompleteChoice = {
    choiceId: number
    displayName: string
    description?: string | undefined
}

export const isIAutoCompleteChoice = (value: unknown): value is AutoCompleteChoice => {
    if (!isObject(value)) {
        return false;
    }

    return 'choiceId' in value && typeof value.choiceId === 'number' &&
        'displayName' in value && typeof value.displayName === 'string';
}

export function assertIAutoCompleteChoice(value: unknown): asserts value is AutoCompleteChoice {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Not an object: ' + value);
    }

    if (!('choiceId' in value) || typeof value.choiceId !== 'number') {
        throw new Error('choiceId is not a number');
    }

    if (!('displayName' in value) || typeof value.displayName !== 'string') {
        throw new Error('displayName is not a string');
    }
}

export type AutoCompleteChoiceWithStatus = AutoCompleteChoice & {
    status: Status
}

export type Status = 'E' | 'D' | 'I'

export type GetPagedListRequest = {
    search?: string
    startNum: number
    rowCount: number
}

export type GetPagedOrderedSortedListRequest = GetPagedListRequest & {
    orderBy: number
    sortOrder?: Order
}

export type AllableCollection<T> = {
    entities?: T[]
    all: boolean
}

export type AbstractEntityAllableCollection = AllableCollection<AbstractEntity>
export type AutoCompleteChoiceAllableCollection = AllableCollection<AutoCompleteChoice>


export type Country = {
    id: number
    displayName: string
    theCode: string
    theCode3: string
}

/** For states, there is only one iso code in the DB table. */
export type State = {
    id: number
    displayName: string
    theCode: string
}

export interface IMappedAbstractEntity {
    id: number
    name: string
    mappingStatus?: 'Mapped' | 'Unmapped'
}

export const isMappedAbstractEntity = (value: unknown): value is IMappedAbstractEntity => {
    if (!isObject(value)) {
        return false
    }

    return 'id' in value && typeof value.id === 'number' &&
        'name' in value && typeof value.name === 'string'
}