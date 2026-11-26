import type {Components, Theme} from '@mui/material/styles'

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

// Typography's own tags for the variants that render a heading.
const HEADING_VARIANT_TAGS: Readonly<Record<string, string>> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'h6',
    subtitle2: 'h6',
}

type TypographyTagProps = {
    color?: unknown
    component?: unknown
    variant?: string
    variantMapping?: Partial<Record<string, string>>
}

const getTypographyTag = ({component, variant = 'body1', variantMapping}: TypographyTagProps) => {
    if (component !== undefined) return typeof component === 'string' ? component : undefined
    return variantMapping?.[variant] ?? HEADING_VARIANT_TAGS[variant]
}

/**
 * Headings of a page that lives under the Paynet skin. The skin's main.css styles every h1-h6 of the
 * document. Its colour belongs to the skin and stays in the light theme; in the dark one it stood 1.5:1
 * on the page, so there a heading without a colour of its own takes the text around it. Its spacing
 * belongs to no skin: h2's padding-top of 1.3em put titles 23px low, so a heading drops it in both
 * themes. A padding or a colour the page gives the heading itself (`sx`, `color`) still wins.
 */
export const createPneTypographyOverrides = (): NonNullable<Components<Theme>['MuiTypography']> => ({
    styleOverrides: {
        root: ({ownerState, theme}) => {
            const props = ownerState as TypographyTagProps
            const tag = getTypographyTag(props)
            if (!tag || !HEADING_TAGS.has(tag)) return {}
            return {
                padding: 0,
                ...(theme.palette.mode === 'dark' && props.color === undefined ? {color: 'inherit'} : {}),
            }
        },
    },
})
