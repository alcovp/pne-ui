import React, {ReactNode} from 'react'
import {Box} from '@mui/material'

export const ERROR_CODE_IDENTIFIER_SEPARATOR = ' · '

/**
 * The description of an error code choice is the search string of the database routine
 * (`ui_choices_errors`): `<type>:<id> <message> <external code>`, the message being the display
 * name. The list shows the identifiers only, "EXTERNAL · 25323 · 700.300.400", so the message is
 * not read twice. A description of another shape is shown as it is; an empty one is not shown.
 */
export const formatErrorCodeIdentifiers = (
    description: string | null | undefined,
    displayName: string,
): string | null => {
    const text = description?.trim()
    if (!text) {
        return null
    }

    const colon = text.indexOf(':')
    if (colon <= 0) {
        return text
    }

    const type = text.slice(0, colon).trim()
    const rest = text.slice(colon + 1).trim()
    const space = rest.search(/\s/)
    const id = space < 0 ? rest : rest.slice(0, space)
    let tail = space < 0 ? '' : rest.slice(space + 1).trim()
    const name = displayName.trim()
    if (name && tail.startsWith(name)) {
        tail = tail.slice(name.length).trim()
    }

    return [type, id, tail].filter(part => part !== '').join(ERROR_CODE_IDENTIFIER_SEPARATOR)
}

const markSx = {
    backgroundColor: 'transparent',
    color: 'inherit',
    fontWeight: 600,
}

/** The typed query in bold inside the option name, every occurrence, case-insensitively. */
export const highlightQuery = (text: string, query: string): ReactNode => {
    const needle = query.trim().toLowerCase()
    const haystack = text.toLowerCase()
    if (!needle || haystack.length !== text.length) {
        return text
    }

    const parts: ReactNode[] = []
    let from = 0
    let index = haystack.indexOf(needle, from)
    while (index >= 0) {
        if (index > from) {
            parts.push(text.slice(from, index))
        }
        parts.push(<Box component={'mark'} key={`${index}`} sx={markSx}>{text.slice(index, index + needle.length)}</Box>)
        from = index + needle.length
        index = haystack.indexOf(needle, from)
    }
    if (parts.length === 0) {
        return text
    }
    if (from < text.length) {
        parts.push(text.slice(from))
    }

    return parts
}
