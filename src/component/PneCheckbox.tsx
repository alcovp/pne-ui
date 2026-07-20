import React, {forwardRef, useCallback, useMemo} from 'react'
import {Checkbox, CheckboxProps, SxProps} from '@mui/material'
import type {CheckboxOwnerState} from '@mui/material/Checkbox'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {useTheme} from '@mui/material/styles'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import {usePneFieldControlProps} from './PneFieldContext'
import {composeToggleInputSlotProps, moveAriaPropsToInput} from './PneToggleInput'

export interface PneCheckboxProps extends CheckboxProps {
    inputRef?: React.Ref<HTMLInputElement>
}

type CheckboxInputSlotProps = NonNullable<NonNullable<CheckboxProps['slotProps']>['input']>

export const PneCheckbox = forwardRef<HTMLSpanElement, PneCheckboxProps>((props, ref) => {
    const propsWithDefaultSize: PneCheckboxProps = props.size === undefined
        ? {...props, size: 'small'}
        : props
    const theme = useTheme()
    const consumerInputSlotProps = props.slotProps?.input
    const defaultInputSlotProps = theme.components?.MuiCheckbox?.defaultProps?.slotProps?.input
    const themedProps = useDefaultProps({
        name: 'MuiCheckbox',
        props: {
            ...propsWithDefaultSize,
            slotProps: {
                ...propsWithDefaultSize.slotProps,
                // Compose the input slot ourselves. MUI otherwise discards a
                // functional slot when a theme object default is present.
                input: {},
            },
        },
    })
    const componentsWithoutCheckboxDefaults = useComponentsWithoutCheckboxDefaults()
    const {
        disabled,
        id,
        indeterminate = false,
        inputRef,
        readOnly = false,
        required,
        sx,
        size = 'small',
        slotProps,
        ...rest
    } = themedProps
    const {inputAriaProps, rootProps} = moveAriaPropsToInput(rest)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy: inputAriaProps['aria-describedby'],
        disabled: props.disabled,
        id: props.id,
        required: props.required,
    })
    const setNativeInput = useCallback((input: HTMLInputElement | null) => {
        if (input) {
            input.indeterminate = indeterminate
        }
    }, [indeterminate])
    const inputSlotProps = composeToggleInputSlotProps<CheckboxOwnerState>(
        [defaultInputSlotProps, consumerInputSlotProps],
        {
            controlId: controlProps.id ?? id,
            describedBy: controlProps.ariaDescribedBy,
            forceDisabled: controlProps.disabled === true || disabled === true,
            forceInvalid: controlProps.error,
            forceRequired: controlProps.ariaRequired,
            inputAriaProps,
            inputRef,
            indeterminate,
            internalInputRef: setNativeInput,
            labelId: controlProps.labelId,
            mergeClassNameAndStyle: theme.components?.mergeClassNameAndStyle,
            readOnly,
        },
    ) as CheckboxInputSlotProps

    const _sx: SxProps = [
        ...(Array.isArray(sx) ? sx : [sx])
    ]
    // MUI still declares Checkbox's forwarded ref as a button even though
    // SwitchBase renders its root as a span. Keep that mismatch inside PNE.
    const muiRootRef = ref as React.Ref<HTMLButtonElement>

    return <DefaultPropsProvider value={componentsWithoutCheckboxDefaults}>
        <Checkbox
            {...rootProps}
            disabled={controlProps.disabled ?? disabled}
            id={controlProps.id ?? id}
            indeterminate={indeterminate}
            readOnly={readOnly}
            ref={muiRootRef}
            required={controlProps.required ?? required}
            size={size}
            slotProps={{
                ...slotProps,
                input: inputSlotProps,
            }}
            sx={_sx}
        />
    </DefaultPropsProvider>
})

PneCheckbox.displayName = 'PneCheckbox'

const useComponentsWithoutCheckboxDefaults = () => {
    const theme = useTheme()

    return useMemo(() => {
        const components = theme.components
        const checkboxConfig = components?.MuiCheckbox

        if (!checkboxConfig?.defaultProps) {
            return components ?? {}
        }

        const checkboxConfigWithoutDefaults = {...checkboxConfig}
        Reflect.deleteProperty(checkboxConfigWithoutDefaults, 'defaultProps')

        return {
            ...components,
            MuiCheckbox: Object.keys(checkboxConfigWithoutDefaults).length > 0
                ? checkboxConfigWithoutDefaults
                : undefined,
        }
    }, [theme.components])
}
