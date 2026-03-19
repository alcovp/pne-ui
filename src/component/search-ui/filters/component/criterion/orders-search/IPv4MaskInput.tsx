import React from "react";
import {IMaskInput} from "react-imask";
import {InputBaseComponentProps} from "@mui/material/InputBase";

type MaskProps = Omit<InputBaseComponentProps, 'onChange'> & {
    name: string
    onChange: (event: { target: { name: string; value: string } }) => void
}

export const IPv4MaskInput = React.forwardRef<HTMLInputElement, MaskProps>(
    function IPv4MaskInput(props, ref) {
        const {
            onChange,
            ...other
        } = props
        return <IMaskInput
            {...other}
            inputRef={ref}
            mask="num.num.num.num"
            blocks={{
                num: {
                    mask: Number,
                    min: 0,
                    max: 255,
                    scale: 0,
                }
            }}
            onAccept={(value: string) =>
                onChange({target: {name: props.name, value}})
            }
        />
    }
)