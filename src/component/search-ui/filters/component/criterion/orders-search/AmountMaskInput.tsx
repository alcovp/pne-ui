import React from "react";
import {IMaskInput} from "react-imask";

type MaskProps = {
    name: string
    onChange: (event: { target: { name: string; value: string } }) => void
}

export const AmountMaskInput = React.forwardRef<HTMLInputElement, MaskProps>(
    function AmountMaskInput(props, ref) {
        const {
            onChange,
            ...other
        } = props
        return <IMaskInput
            {...other}
            mask={Number}
            scale={2}                // Количество знаков после запятой (копейки)
            // signed={false}           // Запрещаем отрицательные значения
            thousandsSeparator=" "    // Разделитель тысяч (пробел)
            radix="."                // Разделитель целой и дробной части (.)
            mapToRadix={[","]}       // Чтобы и запятая тоже воспринималась
            // unmask:
            //  - false => сохраняется форматированная строка (например, "12 345.67")
            //  - true => сохраняется "сырой" формат ("12345.67")
            //  - "typed" => число как число (напр. 12345.67)
            unmask={true}
            onAccept={(value) => onChange({target: {name: props.name, value}})}
            inputRef={ref}
        />
    }
)