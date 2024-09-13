import {SxProps} from "@mui/material";

export const selectUnderChipSx: SxProps = {
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
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent !important',
    },
    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
        height: '100%',
        fontSize: '0',
    },
}
