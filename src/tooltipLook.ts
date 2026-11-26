import type {Components, CSSObject, Theme} from '@mui/material/styles'
import {PNE_NEUTRAL_RAMP} from './themeColors'

/**
 * The look of the MUI `Tooltip` under the PNE UI theme (UI Kit Tooltip). The library has no tooltip
 * of its own: the theme draws the stock one. Body: Neutral/900 with white text (Neutral/100 with
 * Neutral/950 text on a dark page), radius 4, padding 4/8, 12/16 regular, up to 240 wide. A 10×6
 * arrow points at the trigger and fills the 6px between them; `arrow={false}` takes it away.
 * The delays and the behaviour are MUI's own.
 */
export const PNE_TOOLTIP_GAP = 6
const ARROW_BASE = 10

type TooltipColors = {fill: string; text: string}

export const resolvePneTooltipColors = (theme: Theme): TooltipColors =>
    theme.palette.mode === 'dark'
        ? {fill: PNE_NEUTRAL_RAMP[100], text: PNE_NEUTRAL_RAMP[950]}
        : {fill: PNE_NEUTRAL_RAMP[900], text: PNE_NEUTRAL_RAMP[0]}

const ARROW = '.MuiTooltip-arrow'
const placed = (placement: string, scope: string) => `&[data-popper-placement*="${placement}"] ${scope}`
const placedTooltip = (placement: string) => `.MuiTooltip-popper[data-popper-placement*="${placement}"] &`

// The arrow is a triangle cut from the box MUI places at the edge of the body, not MUI's turned square.
const arrowBox = (box: CSSObject, triangle: string): CSSObject => ({
    ...box,
    '&::before': {clipPath: `polygon(${triangle})`},
})

const across = {height: PNE_TOOLTIP_GAP, width: ARROW_BASE}
const along = {height: ARROW_BASE, width: PNE_TOOLTIP_GAP}

export const createPneTooltipOverrides = (): NonNullable<Components<Theme>['MuiTooltip']> => ({
    defaultProps: {
        arrow: true,
    },
    styleOverrides: {
        popper: {
            [placed('bottom', ARROW)]: arrowBox({...across, marginTop: -PNE_TOOLTIP_GAP}, '50% 0, 0 100%, 100% 100%'),
            [placed('top', ARROW)]: arrowBox({...across, marginBottom: -PNE_TOOLTIP_GAP}, '0 0, 100% 0, 50% 100%'),
            [placed('right', ARROW)]: arrowBox(
                {...along, marginInlineStart: -PNE_TOOLTIP_GAP},
                '100% 0, 0 50%, 100% 100%',
            ),
            [placed('left', ARROW)]: arrowBox({...along, marginInlineEnd: -PNE_TOOLTIP_GAP}, '0 0, 100% 50%, 0 100%'),
        },
        tooltip: ({theme}) => {
            const colors = resolvePneTooltipColors(theme)
            return {
                backgroundColor: colors.fill,
                borderRadius: '4px',
                color: colors.text,
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '16px',
                margin: 0,
                maxWidth: 240,
                padding: '4px 8px',
                [placedTooltip('bottom')]: {marginTop: PNE_TOOLTIP_GAP},
                [placedTooltip('top')]: {marginBottom: PNE_TOOLTIP_GAP},
                [placedTooltip('right')]: {marginInlineStart: PNE_TOOLTIP_GAP},
                [placedTooltip('left')]: {marginInlineEnd: PNE_TOOLTIP_GAP},
            }
        },
        arrow: ({theme}) => ({
            color: resolvePneTooltipColors(theme).fill,
            '&::before': {transform: 'none'},
        }),
    },
})
