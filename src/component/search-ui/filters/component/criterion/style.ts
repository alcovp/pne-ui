import {SxProps} from '@mui/material'

/** UI Kit Filter row: every value control is 32px high with a radius of 4 and 14/20 text. */
export const SEARCH_UI_VALUE_HEIGHT = '32px'
export const SEARCH_UI_VALUE_RADIUS = '4px'

/** A text field of the panel (the Exact search, a date): a 32px box on the inputs fill. */
export const filtersInputSx: SxProps = {
    '& .MuiInputBase-root.MuiFilledInput-root': {
        height: SEARCH_UI_VALUE_HEIGHT,
        borderRadius: SEARCH_UI_VALUE_RADIUS,
    },
    '& .MuiInputBase-input.MuiFilledInput-input': {
        py: '6px',
        fontSize: '14px',
        lineHeight: '20px',
    },
}
