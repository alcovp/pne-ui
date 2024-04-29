import {z} from 'zod';
import {AbstractEntitySchema, AutoCompleteChoiceSchema} from "./schema";

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

export type AbstractEntity = z.infer<typeof AbstractEntitySchema>

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

export type AutoCompleteChoice = z.infer<typeof AutoCompleteChoiceSchema>

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

export type SelectOption = {
    value: number | string
    label: string
}