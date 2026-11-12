import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../createTheme'
import type {PneFieldStateColors} from '../fieldPalette'

const stateColors = (colors: PneFieldStateColors): Record<string, string> => ({
    '--pne-field-fill': colors.fill,
    '--pne-field-ring': colors.ring,
})

// The second class outranks MUI's own state rules on the box (one class plus a state).
const OUTLINED = '.MuiOutlinedInput-root.MuiInputBase-root'
const FILLED = '.MuiFilledInput-root.MuiInputBase-root'
// Hover changes nothing on a focused, invalid or disabled box.
const HOVER = ':hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error)'

/**
 * The UI Kit field look on MUI's outlined and filled inputs under the root it is set on (PneTextField,
 * PneSelect): colours only, the MUI geometry and the floating label stay. Each state sets the box's
 * fill and ring as custom properties; later states win (hover, focus, error, disabled), as in the
 * UI Kit. `data-pne-state` on the root pins hover or focus for specimens.
 */
export const pneFieldBoxSx: SxProps<Theme> = theme => {
    const field = resolvePneSemanticPalette(theme).field
    return {
        [`& ${OUTLINED}`]: {
            ...stateColors(field.outlined.default),
            backgroundColor: 'var(--pne-field-fill)',
        },
        [`& ${OUTLINED}${HOVER}, &[data-pne-state="hover"] ${OUTLINED}`]: stateColors(field.outlined.hover),
        [`& ${OUTLINED}.Mui-focused, &[data-pne-state="focus"] ${OUTLINED}`]: stateColors(field.outlined.focus),
        [`& ${OUTLINED}.Mui-error`]: stateColors(field.outlined.error),
        [`& ${OUTLINED}.Mui-disabled`]: stateColors(field.outlined.disabled),
        [`& ${OUTLINED} .MuiOutlinedInput-notchedOutline`]: {
            borderColor: 'var(--pne-field-ring)',
            borderWidth: '1px',
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
        [`& ${FILLED}.Mui-focused, &[data-pne-state="focus"] ${FILLED}`]: stateColors(field.fill.focus),
        [`& ${FILLED}.Mui-error`]: stateColors(field.fill.error),
        [`& ${FILLED}.Mui-disabled`]: stateColors(field.fill.disabled),
        [`& ${OUTLINED} .MuiInputBase-input, & ${FILLED} .MuiInputBase-input`]: {
            color: field.text.value,
        },
        [`& ${OUTLINED} .MuiInputBase-input::placeholder, & ${FILLED} .MuiInputBase-input::placeholder`]: {
            color: field.text.placeholder,
            opacity: 1,
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
        '& .MuiFormHelperText-root': {
            color: field.helper.text,
        },
        '& .MuiFormHelperText-root.Mui-error': {
            color: field.helper.error,
        },
        '& .MuiFormHelperText-root.Mui-disabled': {
            color: field.text.disabled,
        },
    }
}
