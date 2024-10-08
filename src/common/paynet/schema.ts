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

/**
 * For states, there is only one iso code in DB table
 */
export const StateSchema = AbstractEntitySchema.extend({
    theCode: z.string(),
})

export const CountrySchema = AbstractEntitySchema.extend({
    theCode: z.string(),
    theCode3: z.string(),
})