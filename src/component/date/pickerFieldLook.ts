import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../../createTheme'
import type {PneFieldStateColors} from '../../fieldPalette'
import {pneFieldCaptionRules} from '../fieldLook'
import {PNE_FIELD_SIZE, PNE_FIELD_SIZES, type PneFieldSize} from '../fieldSize'

type Rules = Record<string, SystemStyleObject<Theme>>

const stateColors = (colors: PneFieldStateColors): Record<string, string> => ({
    '--pne-field-fill': colors.fill,
    '--pne-field-ring': colors.ring,
})

// The box of a MUI X picker field. The second class outranks MUI's own state rules on it.
const BOX = '.MuiPickersOutlinedInput-root.MuiPickersInputBase-root'
// Hover changes nothing on a focused, invalid or disabled box.
const HOVER = ':hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error)'
const SECTIONS = '.MuiPickersInputBase-sectionsContainer'
const BUTTON = '.MuiInputAdornment-root .MuiIconButton-root'

// The box, the typed date and the buttons at its end by size (UI Kit Fields); `data-pne-size` picks one.
const sizeRules = (size: PneFieldSize): Rules => {
    const config = PNE_FIELD_SIZE[size]
    const root = `&[data-pne-size="${size}"]`
    const paddingBlock = (config.height - config.lineHeight) / 2
    const text = {fontSize: `${config.fontSize}px`, lineHeight: `${config.lineHeight}px`}
    return {
        [`${root} ${BOX}`]: {
            ...text,
            minHeight: `${config.height}px`,
            padding: `0 ${config.paddingEnd}px 0 ${config.paddingInline}px`,
        },
        [`${root} ${BOX} ${SECTIONS}`]: {
            ...text,
            padding: `${paddingBlock}px 0`,
        },
        [`${root} ${BOX} .MuiPickersSectionList-section, ${root} ${BOX} .MuiPickersSectionList-sectionContent`]: {
            lineHeight: `${config.lineHeight}px`,
        },
        [`${root} ${BOX} .MuiInputAdornment-root`]: {
            gap: '4px',
            height: 'auto',
            marginLeft: `${config.gap}px`,
            marginRight: 0,
            maxHeight: 'none',
        },
        [`${root} ${BOX} ${BUTTON}`]: {
            height: `${config.iconButton}px`,
            width: `${config.iconButton}px`,
        },
        [`${root} ${BOX} ${BUTTON} .MuiSvgIcon-root`]: {
            fontSize: `${config.icon}px`,
        },
    }
}

/**
 * The UI Kit field look on the field of a MUI X picker (`PickersTextField`), set on its root: the same
 * box as PneTextField draws. Colours: each state sets the fill and the ring of the box as custom
 * properties; later states win (hover, a value, focus, error, disabled). A box that holds a date keeps
 * a darker ring out of focus (`data-pne-filled` on the root). An empty box out of focus shows its
 * format in the placeholder colour (`data-pne-empty`). Geometry: 24, 32 or 40px high by
 * `data-pne-size`, the text 12/16 or 14/20; the label stands over the box and never floats; the buttons
 * at the end (the calendar or the clock, the clear cross) are the icon buttons of the library's fields.
 * `data-pne-state` on the root pins hover or focus for specimens.
 */
export const pnePickerFieldSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const field = pne.field
    const chevron = pne.dropdown.chevron
    const rules: Rules = {
        [`& ${BOX}`]: {
            ...stateColors(field.outlined.default),
            backgroundColor: 'var(--pne-field-fill)',
            borderRadius: '4px',
            color: field.text.value,
        },
        [`& ${BOX}${HOVER}, &[data-pne-state="hover"] ${BOX}`]: stateColors(field.outlined.hover),
        [`&[data-pne-filled] ${BOX}`]: {'--pne-field-ring': field.outlined.active.ring},
        [`& ${BOX}.Mui-focused, &[data-pne-state="focus"] ${BOX}`]: stateColors(field.outlined.focus),
        [`& ${BOX}.Mui-error`]: stateColors(field.outlined.error),
        [`& ${BOX}.Mui-disabled`]: stateColors(field.outlined.disabled),
        [`& ${BOX} .MuiPickersOutlinedInput-notchedOutline`]: {
            borderColor: 'var(--pne-field-ring)',
            borderWidth: '1px',
            // The label stands over the box, so the ring has no notch for it.
            top: 0,
        },
        [`& ${BOX} .MuiPickersOutlinedInput-notchedOutline legend`]: {
            display: 'none',
        },
        // MUI hides the format of an empty field under a label that floats in the box; this label stands
        // over it, so the format is always shown.
        [`& ${BOX} ${SECTIONS}`]: {
            color: field.text.value,
            opacity: 1,
        },
        [`&[data-pne-empty] ${BOX}:not(.Mui-focused) ${SECTIONS}`]: {
            color: field.text.placeholder,
        },
        [`& ${BOX}.Mui-disabled ${SECTIONS}, & ${BOX}.Mui-disabled ${SECTIONS} *`]: {
            color: field.text.disabled,
            WebkitTextFillColor: field.text.disabled,
        },
        [`& ${BOX} ${BUTTON}`]: {
            borderRadius: '4px',
            color: chevron.default,
            margin: 0,
            padding: 0,
        },
        [`& ${BOX} ${BUTTON}.Mui-disabled`]: {
            color: chevron.disabled,
        },
    }
    return Object.assign(rules, pneFieldCaptionRules(field), ...PNE_FIELD_SIZES.map(sizeRules))
}
