import type {Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {searchUIFocusRingSx} from '../../styled'

/** The corner radius of a small chip: the overlay's focus ring follows the chip under it. */
const CHIP_RADIUS = '16px'

/**
 * A transparent select stretched over a chip: the chip is for show, the select takes the pointer
 * and the keyboard. MUI tints a focused select grey; here the keyboard focus draws the panel's ring
 * around the chip instead, and a click shows nothing, as it opens the menu at once.
 */
export const selectUnderChipSx: SystemStyleObject<Theme> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    '& .MuiSvgIcon-root.MuiSelect-icon': {
        display: 'none',
    },
    '& .MuiSelect-select': {
        height: '100%',
        paddingY: 0,
        borderRadius: CHIP_RADIUS,
    },
    '& .MuiSelect-select:focus': {
        backgroundColor: 'transparent',
        borderRadius: CHIP_RADIUS,
    },
    '& .MuiSelect-select:focus-visible': searchUIFocusRingSx,
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent !important',
    },
    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
        height: '100%',
        fontSize: '0',
    },
}

/**
 * The one chevron of the panel's dropdowns, on a chip: the 16px of the buttons' end icon, in the
 * chip's text colour. MUI paints a chip's delete icon translucent and darker under the pointer;
 * a dropdown chevron is no delete icon.
 */
export const chipChevronSx: SystemStyleObject<Theme> = {
    '&.MuiChip-deleteIcon.MuiSvgIcon-root, &.MuiChip-deleteIcon.MuiSvgIcon-root:hover': {
        color: 'inherit',
        fontSize: '16px',
    },
}
