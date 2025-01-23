import React from "react";
import {IMaskInput} from "react-imask";

type MaskProps = {
    name: string
    onChange: (event: { target: { name: string; value: string } }) => void
}

export const IPv4MaskInput = React.forwardRef<HTMLInputElement, MaskProps>(
    function AmountMaskInput(props, ref) {
        const {
            onChange,
            ...other
        } = props
        return <IMaskInput
            {...other}
            inputRef={ref}
            mask="000.000.000.000"
            definitions={{
                '0': /[0-9]/,
            }}
            onAccept={(value: string) =>
                onChange({target: {name: props.name, value}})
            }
        />
    }
)