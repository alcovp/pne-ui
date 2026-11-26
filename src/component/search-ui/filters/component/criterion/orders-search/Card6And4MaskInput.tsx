import React from 'react'
import {IMaskInput} from 'react-imask'
import {InputBaseComponentProps} from '@mui/material/InputBase'

type MaskProps = Omit<InputBaseComponentProps, 'onChange'> & {
    name: string
    onChange: (event: {target: {name: string; value: string}}) => void
}

export const Card6And4MaskInput = function AmountMaskInput({
    ref,
    ...props
}: React.PropsWithoutRef<MaskProps> & {ref?: React.Ref<HTMLInputElement>}) {
    const {onChange, ...other} = props
    return (
        <IMaskInput
            {...other}
            inputRef={ref}
            mask='0000 00XX XXXX 0000'
            definitions={{
                '0': /[0-9]/,
            }}
            onAccept={(value: string) => onChange({target: {name: props.name, value}})}
        />
    )
}
