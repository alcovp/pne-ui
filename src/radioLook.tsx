import type {Components, Theme} from '@mui/material/styles'
import * as React from 'react'
import type {PneCheckboxPalette, PneCheckboxState} from './checkboxPalette'

/**
 * The look of the MUI `Radio` under the PNE UI theme (UI Kit Radio: the matrix of the checkbox without
 * the indeterminate value). The library has no radio of its own: the theme draws the stock one.
 * `size='medium'` (MUI's default) is the 20px circle of forms, `size='small'` the 16px one of rows
 * and dense lists. Off: the canvas fill in a 1.5px ring. On: a thick brand ring around the canvas
 * centre. Hover and press recolour the circle itself, there is no halo; keyboard focus adds the 2px
 * ring. The colours are those of the checkbox (`palette.pne.checkbox`).
 */
type RadioSize = 'small' | 'medium'

type DotGeometry = {
    box: number
    /** The width of the brand ring of a picked circle. */
    on: number
}

const DOT_GEOMETRY: Record<RadioSize, DotGeometry> = {
    small: {box: 16, on: 4.5},
    medium: {box: 20, on: 5.5},
}

const RING_WIDTH = 1.5

/**
 * The circle MUI renders as `icon` or `checkedIcon`. MUI hands it the radio size as `fontSize`; the
 * colours come from the root's rules.
 */
export const PneRadioDot = ({fontSize, value}: {fontSize?: string; value: 'off' | 'on'}) => {
    const geometry = DOT_GEOMETRY[fontSize as RadioSize] ?? DOT_GEOMETRY.medium
    const centre = geometry.box / 2
    // The circle sits 1px inside the box; a ring is drawn on its inner edge.
    const radius = centre - 1
    const ring = (
        <circle
            className={value === 'off' ? 'PneRadio-ring' : 'PneRadio-edge'}
            cx={centre}
            cy={centre}
            r={radius - RING_WIDTH / 2}
            strokeWidth={RING_WIDTH}
        />
    )

    return (
        <svg
            aria-hidden
            className={`PneRadio-dot PneRadio-${value}`}
            height={geometry.box}
            viewBox={`0 0 ${geometry.box} ${geometry.box}`}
            width={geometry.box}
        >
            {value === 'on' ? (
                <circle
                    className='PneRadio-thick'
                    cx={centre}
                    cy={centre}
                    r={radius - geometry.on / 2}
                    strokeWidth={geometry.on}
                />
            ) : null}
            {ring}
        </svg>
    )
}

type RadioPaletteSource = {checkbox: PneCheckboxPalette; focusRing: string}

/**
 * Colours of one state as custom properties on the root; the circle rules read them. The root colour
 * is the ring of an off circle and the brand ring of a picked one, so a `color` override recolours
 * the circle as it did MUI's icons.
 */
const stateColors = (palette: PneCheckboxPalette, state: PneCheckboxState): Record<string, string> => {
    const off = palette.off[state]
    const on = palette.on[state]
    return {
        '--pne-radio-off-fill': off.fill,
        '--pne-radio-off-ring': off.ring,
        '--pne-radio-on': on.fill,
        // A brand fill that does not read on a dark page gets an edge that does.
        '--pne-radio-on-edge': on.ring === 'transparent' ? 'currentColor' : on.ring,
        '--pne-radio-centre': on.mark,
    }
}

const INTERACTIVE_ROOT = '&:not(.Mui-disabled)'

export const createPneRadioOverrides = (
    resolvePalette: (theme: Theme) => RadioPaletteSource,
): NonNullable<Components<Theme>['MuiRadio']> => ({
    defaultProps: {
        checkedIcon: <PneRadioDot value='on' />,
        // The circle shows hover, press and focus itself (UI Kit); an explicit false brings MUI's back.
        disableRipple: true,
        icon: <PneRadioDot value='off' />,
    },
    styleOverrides: {
        root: ({theme}) => {
            const pne = resolvePalette(theme)
            const colors = pne.checkbox
            const focusRing = `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`

            return {
                // MUI's hit area stays: 38 around the small circle, 42 around the medium one.
                padding: '11px',
                transition: 'color 120ms linear',
                color: 'var(--pne-radio-off-ring)',
                // Later states win: default, hover, pressed, disabled.
                ...stateColors(colors, 'default'),
                [`${INTERACTIVE_ROOT}:hover`]: {...stateColors(colors, 'hover'), backgroundColor: 'transparent'},
                '&[data-pne-state="hover"]': stateColors(colors, 'hover'),
                [`${INTERACTIVE_ROOT}:active`]: stateColors(colors, 'pressed'),
                '&[data-pne-state="pressed"]': stateColors(colors, 'pressed'),
                // MUI greys a disabled root; the variables take over, and the on colour below still wins.
                '&.Mui-disabled': {...stateColors(colors, 'disabled'), color: 'var(--pne-radio-off-ring)'},
                '&.Mui-checked': {color: 'var(--pne-radio-on)'},
                '& .PneRadio-dot': {
                    borderRadius: '50%',
                    display: 'block',
                    flexShrink: 0,
                },
                '& .PneRadio-dot circle': {
                    transition: 'fill 120ms linear, stroke 120ms linear',
                },
                '& .PneRadio-ring': {
                    fill: 'var(--pne-radio-off-fill)',
                    stroke: 'currentColor',
                },
                '& .PneRadio-thick': {
                    fill: 'var(--pne-radio-centre)',
                    stroke: 'currentColor',
                },
                '& .PneRadio-edge': {
                    fill: 'none',
                    stroke: 'var(--pne-radio-on-edge)',
                },
                '&.Mui-focusVisible .PneRadio-dot, &[data-pne-state="focus"] .PneRadio-dot': {
                    boxShadow: focusRing,
                },
                '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '& .PneRadio-dot circle': {
                        transition: 'none',
                    },
                },
            }
        },
    },
})
