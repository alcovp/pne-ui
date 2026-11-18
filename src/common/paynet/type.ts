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

export type AutoCompleteChoice = {
    choiceId: number
    displayName: string
    description?: string | undefined
}

export type AutoCompleteChoiceWithStatus = AutoCompleteChoice & {
    status: Status
}

export type Status = 'E' | 'D' | 'I'

export type GetPagedOrderedSortedListRequest = {
    search?: string
    startNum: number
    rowCount: number
    orderBy: number
    sortOrder?: Order
}

export type AllableCollection<T> = {
    entities?: T[]
    all: boolean
}

export type AbstractEntityAllableCollection = AllableCollection<AbstractEntity>


export type Country = {
    id: number
    displayName: string
    theCode: string
    theCode3: string
}

export interface IMappedAbstractEntity {
    id: number
    name: string
    mappingStatus?: 'Mapped' | 'Unmapped'
}
