import React, {forwardRef, Ref} from 'react'
import {SxProps, ToggleButtonGroup, ToggleButtonGroupProps} from '@mui/material'

export const PneToggleButtonGroup = forwardRef((
    props: ToggleButtonGroupProps,
    ref: Ref<HTMLButtonElement>,
) => {
    const {
        sx,
        size = 'small',
        color = 'pneAccentuated',
        ...rest
    } = props

    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    return <ToggleButtonGroup sx={_sx} size={size} {...rest} ref={ref}/>
})