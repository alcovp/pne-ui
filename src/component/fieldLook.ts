import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../createTheme'
import type {PneFieldPalette, PneFieldStateColors} from '../fieldPalette'
import {PNE_FIELD_SIZE, PNE_FIELD_SIZES, type PneFieldSize} from './fieldSize'

const stateColors = (colors: PneFieldStateColors): Record<string, string> => ({
    '--pne-field-fill': colors.fill,
    '--pne-field-ring': colors.ring,
})

// The second class outranks MUI's own state rules on the box (one class plus a state).
const OUTLINED = '.MuiOutlinedInput-root.MuiInputBase-root'
const FILLED = '.MuiFilledInput-root.MuiInputBase-root'
// Hover changes nothing on a focused, invalid or disabled box.
const HOVER = ':hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error)'

// UI Kit IcStatusWarning before the error text of a field.
const WARNING_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E'
    + '%3Cpath d=\'M12 4.5 3.5 19h17L12 4.5ZM12 10v4.5M12 17v.2\' fill=\'none\' stroke=\'%23000\' '
    + 'stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\'/%3E%3C/svg%3E")'

type Rules = Record<string, SystemStyleObject<Theme>>

// The box, its text and its paddings by size (UI Kit Fields); `data-pne-size` on the root picks one.
const sizeRules = (size: PneFieldSize): Rules => {
    const config = PNE_FIELD_SIZE[size]
    const root = `&[data-pne-size="${size}"]`
    const paddingBlock = (config.height - config.lineHeight) / 2
    const text = {fontSize: `${config.fontSize}px`, lineHeight: `${config.lineHeight}px`}
    // The chevron of a select stands in the middle of its icon button, `paddingEnd` from the edge.
    const chevronInset = config.paddingEnd + (config.iconButton - CHEVRON_SIZE) / 2
    return {
        [`${root} .MuiInputBase-root`]: {
            ...text,
            minHeight: `${config.height}px`,
            padding: 0,
        },
        [`${root} .MuiInputBase-input`]: {
            ...text,
            boxSizing: 'content-box',
            height: `${config.lineHeight}px`,
            minHeight: 0,
            padding: `${paddingBlock}px ${config.paddingInline}px`,
        },
        [`${root} .MuiInputBase-adornedStart`]: {paddingLeft: `${config.paddingInline}px`},
        [`${root} .MuiInputBase-adornedEnd`]: {paddingRight: `${config.paddingEnd}px`},
        [`${root} .MuiInputBase-input.MuiInputBase-inputAdornedStart`]: {paddingLeft: 0},
        [`${root} .MuiInputBase-input.MuiInputBase-inputAdornedEnd`]: {paddingRight: 0},
        [`${root} .MuiInputAdornment-positionStart`]: {marginRight: `${config.gap}px`, marginTop: 0},
        [`${root} .MuiInputAdornment-positionEnd`]: {marginLeft: `${config.gap}px`},
        [`${root} .MuiInputAdornment-root, ${root} .MuiInputAdornment-root .MuiTypography-root`]: text,
        // UI Kit Field/Textarea: the same paddings at every size, the text of the size.
        [`${root} .MuiInputBase-multiline`]: {
            alignItems: 'flex-start',
            padding: MULTILINE_PADDING,
        },
        [`${root} .MuiInputBase-multiline .MuiInputBase-input`]: {
            height: 'auto',
            minHeight: `${config.lineHeight}px`,
            padding: 0,
        },
        // A box of fixed rows: the user drags its corner. One that grows with its text has no corner to drag.
        [`${root}[data-pne-resize] .MuiInputBase-multiline .MuiInputBase-input`]: {
            resize: 'vertical',
        },
        // Rows the consumer did not set: the UI Kit box, 88px high.
        [`${root}[data-pne-resize="default"] .MuiInputBase-multiline .MuiInputBase-input`]: {
            height: `${MULTILINE_DEFAULT_HEIGHT}px`,
        },
        [`${root} .MuiSelect-select.MuiInputBase-input`]: {
            alignItems: 'center',
            display: 'flex',
            minHeight: `${config.lineHeight}px`,
            paddingRight: `${config.paddingEnd + config.iconButton + config.gap}px`,
        },
        [`${root} .MuiSelect-icon.PneSelect-chevron`]: {
            right: `${chevronInset}px`,
        },
    }
}

const CHEVRON_SIZE = 14
const MULTILINE_PADDING = '6px 4px 4px 8px'
// 88px of the box less its paddings.
const MULTILINE_DEFAULT_HEIGHT = 78

/**
 * The UI Kit field look on MUI's outlined and filled inputs under the root it is set on (PneTextField,
 * PneSelect). Colours: each state sets the box's fill and ring as custom properties; later states
 * win (hover, a value, focus, error, disabled), as in the UI Kit. A box that holds a value keeps a
 * darker ring out of focus (UI Kit Active; `data-pne-filled` on the root). Geometry: the box is 24, 32 or 40px high by
 * `data-pne-size`, the text 12/16 or 14/20; the label stands over the box, 12/16 Medium, and never
 * floats; the helper text is 12/16 under the box with a warning sign in error. `data-pne-state` on
 * the root pins hover or focus for specimens.
 */
export const pneFieldBoxSx: SxProps<Theme> = theme => {
    const field = resolvePneSemanticPalette(theme).field
    const rules: Rules = {
        [`& ${OUTLINED}`]: {
            ...stateColors(field.outlined.default),
            backgroundColor: 'var(--pne-field-fill)',
            borderRadius: '4px',
        },
        [`& ${OUTLINED}${HOVER}, &[data-pne-state="hover"] ${OUTLINED}`]: stateColors(field.outlined.hover),
        [`&[data-pne-filled] ${OUTLINED}`]: {'--pne-field-ring': field.outlined.active.ring},
        [`& ${OUTLINED}.Mui-focused, &[data-pne-state="focus"] ${OUTLINED}`]: stateColors(field.outlined.focus),
        [`& ${OUTLINED}.Mui-error`]: stateColors(field.outlined.error),
        [`& ${OUTLINED}.Mui-disabled`]: stateColors(field.outlined.disabled),
        [`& ${OUTLINED} .MuiOutlinedInput-notchedOutline`]: {
            borderColor: 'var(--pne-field-ring)',
            borderWidth: '1px',
            // The label stands over the box, so the ring has no notch for it.
            top: 0,
        },
        [`& ${OUTLINED} .MuiOutlinedInput-notchedOutline legend`]: {
            display: 'none',
        },
        [`& ${FILLED}`]: {
            ...stateColors(field.fill.default),
            backgroundColor: 'var(--pne-field-fill)',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 0 1px var(--pne-field-ring)',
            '&::before, &::after': {
                display: 'none',
            },
        },
        [`& ${FILLED}${HOVER}, &[data-pne-state="hover"] ${FILLED}`]: stateColors(field.fill.hover),
        [`&[data-pne-filled] ${FILLED}`]: {'--pne-field-ring': field.fill.active.ring},
        [`& ${FILLED}.Mui-focused, &[data-pne-state="focus"] ${FILLED}`]: stateColors(field.fill.focus),
        [`& ${FILLED}.Mui-error`]: stateColors(field.fill.error),
        [`& ${FILLED}.Mui-disabled`]: stateColors(field.fill.disabled),
        [`& ${OUTLINED} .MuiInputBase-input, & ${FILLED} .MuiInputBase-input`]: {
            color: field.text.value,
        },
        [`& ${OUTLINED} .MuiInputBase-input::placeholder, & ${FILLED} .MuiInputBase-input::placeholder`]: {
            color: field.text.placeholder,
            // MUI hides the placeholder under a label that floats in the box; this label stands over it.
            opacity: '1 !important',
        },
        [`& ${OUTLINED} .MuiInputBase-input.Mui-disabled, & ${FILLED} .MuiInputBase-input.Mui-disabled`]: {
            color: field.text.disabled,
            WebkitTextFillColor: field.text.disabled,
        },
        // A label inside the box (UI Kit Mark): an adornment that reads as the value does.
        '& .MuiInputAdornment-root, & .MuiInputAdornment-root .MuiTypography-root': {
            color: field.text.mark,
        },
        '& .Mui-disabled > .MuiInputAdornment-root, & .Mui-disabled > .MuiInputAdornment-root .MuiTypography-root': {
            color: field.text.disabled,
        },
        // The label of the field itself: over the box, as the label of PneField.
        '& > .MuiInputLabel-root': {
            color: field.text.label,
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '16px',
            marginBottom: '4px',
            maxWidth: '100%',
            pointerEvents: 'auto',
            position: 'static',
            transform: 'none',
            transition: 'none',
            whiteSpace: 'normal',
        },
        '& > .MuiInputLabel-root.Mui-focused, & > .MuiInputLabel-root.Mui-error': {
            color: field.text.label,
        },
        '& > .MuiInputLabel-root.Mui-disabled': {
            color: field.text.disabled,
        },
        '& .MuiFormHelperText-root': pneHelperTextStyle(field, '4px'),
    }
    return Object.assign(rules, ...PNE_FIELD_SIZES.map(sizeRules))
}

/**
 * The UI Kit helper text, for the helper element itself: 12/16 under the control with no indent; in
 * error it turns red behind a warning sign. PneField sets it on its own helper text.
 */
export const pneHelperTextStyle = (field: PneFieldPalette, marginTop: string): SystemStyleObject<Theme> => ({
    color: field.helper.text,
    fontSize: '12px',
    lineHeight: '16px',
    // Each side on its own: MUI indents the helper text by `margin-left` and `margin-right`.
    marginBottom: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginTop,
    // The sign stands in the padding, out of the flow: the theme clamps a long error to five lines, and
    // that needs the display of the text itself.
    '&.Mui-error': {
        color: field.helper.error,
        paddingLeft: '20px',
        position: 'relative',
    },
    '&.Mui-error::before': {
        backgroundColor: 'currentColor',
        content: '""',
        height: '16px',
        left: 0,
        mask: `${WARNING_MASK} center / 16px 16px no-repeat`,
        WebkitMask: `${WARNING_MASK} center / 16px 16px no-repeat`,
        position: 'absolute',
        top: 0,
        width: '16px',
    },
    '&.Mui-disabled': {
        color: field.text.disabled,
    },
})
