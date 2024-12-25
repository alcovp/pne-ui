import {Theme, useTheme} from '@mui/material/styles';

export const usePneTheme = (): Theme => {
    return useTheme<Theme>()
}
