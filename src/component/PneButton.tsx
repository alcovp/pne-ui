import {Button, ButtonProps, SxProps} from '@mui/material';
import * as React from "react";

export type PneButtonStyle = 'contained' | 'outlined' | 'error' | 'text' | 'pneContained'

// https://mui.com/material-ui/guides/typescript/#complications-with-the-component-prop
const PneButton = <C extends React.ElementType>(
    props: ButtonProps<C, { component?: C }> & {pneStyle?: PneButtonStyle}
) => {
    const {
        sx,
        children,
        variant,
        color,
        size = 'large',
        pneStyle,
        ...rest
    } = props;

    let finalVariant: ButtonProps['variant'] = 'contained'
    let finalColor: ButtonProps['color'] = 'primary'

    if (pneStyle) {
        switch (pneStyle) {
            case 'contained':
                finalVariant = 'contained'
                finalColor = 'primary'
                break
            case 'outlined':
                finalVariant = 'outlined'
                finalColor = 'primary'
                break
            case 'error':
                finalVariant = 'outlined'
                finalColor = 'error'
                break
            case 'text':
                finalVariant = 'text'
                finalColor = 'primary'
                break
            case 'pneContained':
                finalVariant = 'contained'
                finalColor = 'pnePrimary'
                break
            default:
                console.warn(`Unknown pneStyle: ${pneStyle}`)
        }
    } else {
        finalVariant = variant || finalVariant
        finalColor = color || finalColor
    }

    const _sx: SxProps = [
        {
            height: size ==='large' ? '40px' : 'inherit',
            fontSize: '12px',
            lineHeight: '22px',
            fontWeight: '400',
            textTransform: 'initial'
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <Button sx={_sx} variant={finalVariant} color={finalColor} size={size} {...rest}>{children}</Button>
}

export default PneButton;