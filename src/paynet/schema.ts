import {z} from 'zod';

export const AbstractEntitySchema = z.object({
    id: z.number(),
    displayName: z.string(),
})

export const AutoCompleteChoiceSchema = z.object({
    choiceId: z.number(),
    displayName: z.string(),
    description: z.string().optional(),
})