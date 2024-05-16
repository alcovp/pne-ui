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
        ...rest
    } = props;

    const _sx: SxProps = [
        {
            height: '40px',
            fontSize: '12px',
            lineHeight: '12px',
            fontWeight: '700',
            textTransform: 'initial'
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <Button sx={_sx} variant={variant} {...rest}>{children}</Button>
}

export default PneButton;