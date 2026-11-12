import {createContext} from 'react'

/**
 * Which header a table draws (UI Kit Cell/Header and Cell/Header-island). `main`: the table is the
 * main block of its page - a full 40px row, 14/20 SemiBold over a hairline. `island`: one of several
 * tables on a page, or a table that shares its block with a heading and other content - a 24px
 * strip on the sunken fill, 12/16 Medium, with no line under it.
 */
export type PneTableHeaderVariant = 'main' | 'island'

/** The table tells its header cells which header to draw. */
export const PneTableHeaderVariantContext = createContext<PneTableHeaderVariant>('main')
