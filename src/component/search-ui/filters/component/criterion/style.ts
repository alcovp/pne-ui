import {SxProps} from '@mui/material'

/** UI Kit Filter row: every value control is 32px high with a radius of 4 and 14/20 text. */
export const SEARCH_UI_VALUE_HEIGHT = '32px'
export const SEARCH_UI_VALUE_RADIUS = '4px'

/** The calendar button of a date field: a 24px icon button with a 16px glyph, inside the 32px box. */
export const pickerToggleSx = {
    '& .MuiInputAdornment-root .MuiIconButton-root': {
        borderRadius: '4px',
        height: '24px',
        margin: 0,
        padding: 0,
        width: '24px',
    },
    '& .MuiInputAdornment-root .MuiIconButton-root .MuiSvgIcon-root': {
        fontSize: '16px',
    },
}

/** A text field of the panel (the Exact search, a date): a 32px box on the inputs fill. */
export const filtersInputSx: SxProps = {
    '& .MuiInputBase-root.MuiFilledInput-root': {
        height: SEARCH_UI_VALUE_HEIGHT,
        borderRadius: SEARCH_UI_VALUE_RADIUS,
    },
    // The text is centred by the input's own height (see the field look): paddings above and below it
    // put it a pixel high at a 125 % screen scale.
    '& .MuiInputBase-input.MuiFilledInput-input': {
        fontSize: '14px',
        lineHeight: '20px',
    },
    '& input.MuiInputBase-input.MuiFilledInput-input': {
        height: SEARCH_UI_VALUE_HEIGHT,
        py: 0,
    },
    // A date field of MUI X is a box of its own kind: the same 32px, no room kept for a floating label.
    '& .MuiPickersInputBase-root.MuiPickersFilledInput-root': {
        borderRadius: SEARCH_UI_VALUE_RADIUS,
        height: SEARCH_UI_VALUE_HEIGHT,
        paddingRight: '4px',
    },
    // One line as high as the box, with no paddings above and below (see the picker field look).
    '& .MuiPickersFilledInput-root .MuiPickersInputBase-sectionsContainer': {
        fontSize: '14px',
        lineHeight: SEARCH_UI_VALUE_HEIGHT,
        padding: '0 0 0 8px',
    },
    '&&& .MuiPickersFilledInput-root .MuiPickersSectionList-section, &&& .MuiPickersFilledInput-root .MuiPickersSectionList-sectionContent':
        {
            lineHeight: SEARCH_UI_VALUE_HEIGHT,
        },
    ...pickerToggleSx,
}
