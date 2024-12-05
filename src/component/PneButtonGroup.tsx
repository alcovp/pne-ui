import {ButtonGroup, ButtonGroupProps, SxProps} from '@mui/material';
import React from 'react';

export const PneButtonGroup = (props: React.PropsWithChildren<ButtonGroupProps>) => {
    const {
        sx,
        children,
        ...rest
    } = props

    const _sx: SxProps = [
        {
            '& > *:not(:last-child)': {
                mr: '2px'
            }
        },
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <ButtonGroup sx={_sx} {...rest}>{children}</ButtonGroup>
}