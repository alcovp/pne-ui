import React, {forwardRef, Ref} from 'react'
import {Switch, SwitchProps, SxProps} from '@mui/material'

export const PneSwitch = forwardRef((
    props: SwitchProps,
    ref: Ref<HTMLButtonElement>,
) => {
    const {
        sx,
        size = 'small',
        ...rest
    } = props

    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    return <Switch sx={_sx} size={size} {...rest} ref={ref}/>
})