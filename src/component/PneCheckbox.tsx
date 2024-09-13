import React, {forwardRef, Ref} from 'react';
import {Checkbox, CheckboxProps, SxProps} from '@mui/material';

const PneCheckbox = forwardRef((
    props: CheckboxProps,
    ref: Ref<HTMLButtonElement>
) => {
    const {
        sx,
        size = 'small',
        ...rest
    } = props

    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <Checkbox sx={_sx} size={size} {...rest} ref={ref}/>
});

export default PneCheckbox
