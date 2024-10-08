import {WritableDraft} from 'immer/src/internal';

export const exhaustiveCheck = (value: never | never[]) => {
    return value
}

export const ensure = <T>(argument: T | undefined | null, message = 'This value was promised to be there.'): T => {
    if (argument === undefined || argument === null) {
        throw new TypeError(message)
    }

    return argument
}

export const isObject = (value: unknown): value is object => {
    return typeof value === 'object' && value !== null;
}

export function assertObject(value: unknown): asserts value is object {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Not an object: ' + value);
    }
}

export type SelectOption = {
    value: number | string
    label: string
}

export type Order = 'asc' | 'desc'

export type ZustandStoreSet<STORE> = (
    partial: (STORE | Partial<STORE> | ((state: STORE) => (STORE | Partial<STORE>))),
    replace?: boolean
) => void

export type ZustandStoreImmerSet<STORE> = (
    nextStateOrUpdater: (STORE | Partial<STORE> | ((state: WritableDraft<STORE>) => void)),
    shouldReplace?: boolean
) => void

export type ZustandStoreGet<STORE> = () => Readonly<STORE>