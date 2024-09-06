import {Button, ButtonProps, SxProps} from '@mui/material';
import * as React from "react";

// https://mui.com/material-ui/guides/typescript/#complications-with-the-component-prop
const PneButton = <C extends React.ElementType>(
    props: ButtonProps<C, { component?: C }>
) => {
    const {
        sx,
        children,
        variant = 'contained',
        size = 'large',
        ...rest
    } = props;

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

    return <Button sx={_sx} variant={variant} size={size} {...rest}>{children}</Button>
}

export default PneButton;