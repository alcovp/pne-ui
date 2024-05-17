import React, {forwardRef} from 'react';
import {SxProps, TextField, TextFieldProps} from '@mui/material';

const PneTextField = forwardRef((
    props: TextFieldProps,
    ref: React.Ref<HTMLDivElement>
) => {
    const {
        sx,
        size = 'small',
        ...rest
    } = props;

    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx])
    ]

    return <TextField size={size} sx={_sx} ref={ref} {...rest}/>
});

export default PneTextField;
