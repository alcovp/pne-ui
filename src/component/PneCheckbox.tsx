import React, {forwardRef, useCallback, useMemo} from 'react'
import {Checkbox, CheckboxProps} from '@mui/material'
import type {CheckboxOwnerState} from '@mui/material/Checkbox'
import {useDefaultProps} from '@mui/material/DefaultPropsProvider'
import {useTheme} from '@mui/material/styles'
import type {SxProps, Theme} from '@mui/material/styles'
import DefaultPropsProvider from '@mui/system/DefaultPropsProvider'
import type {PneCheckboxPalette, PneCheckboxState} from '../checkboxPalette'
import {resolvePneSemanticPalette} from '../createTheme'
import {usePneLegacyLook} from './legacy/legacyLook'
import {usePneFieldControlProps} from './PneFieldContext'
import {composeToggleInputSlotProps, moveAriaPropsToInput} from './PneToggleInput'

export type PneCheckboxSize = NonNullable<CheckboxProps['size']>

export interface PneCheckboxProps extends CheckboxProps {
    inputRef?: React.Ref<HTMLInputElement>
    /** A state pinned for specimens; product code never sets it. */
    'data-pne-state'?: 'hover' | 'pressed' | 'focus'
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
        checkedIcon,
        'data-pne-state': pinnedState,
        disabled,
        disableRipple,
        icon,
        id,
        indeterminate = false,
        indeterminateIcon,
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
    // Inside a composite that keeps its 4.x look the checkbox stays the plain MUI one.
    const legacy = usePneLegacyLook()
    // The error look follows the field error and an explicit aria-invalid alike.
    const invalid = controlProps.error === true || isAriaInvalid(inputAriaProps['aria-invalid'])

    const _sx: SxProps<Theme> = [
        legacy ? undefined : checkboxSx,
        ...(Array.isArray(sx) ? sx : [sx]),
    ]
    // MUI still declares Checkbox's forwarded ref as a button even though
    // SwitchBase renders its root as a span. Keep that mismatch inside PNE.
    const muiRootRef = ref as React.Ref<HTMLButtonElement>

    return <DefaultPropsProvider value={componentsWithoutCheckboxDefaults}>
        <Checkbox
            {...rootProps}
            checkedIcon={checkedIcon ?? (legacy ? undefined : <PneCheckboxBox value='on'/>)}
            data-pne-error={invalid || undefined}
            data-pne-readonly={readOnly || undefined}
            data-pne-state={pinnedState}
            // The box shows hover, press and focus itself (UI Kit); an explicit false brings MUI's back.
            disableRipple={disableRipple ?? !legacy}
            disabled={controlProps.disabled ?? disabled}
            icon={icon ?? (legacy ? undefined : <PneCheckboxBox value='off'/>)}
            id={controlProps.id ?? id}
            indeterminate={indeterminate}
            indeterminateIcon={indeterminateIcon ?? (legacy ? undefined : <PneCheckboxBox value='indeterminate'/>)}
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

const isAriaInvalid = (value: React.AriaAttributes['aria-invalid']): boolean => value === true || value === 'true'

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

type CheckboxBoxValue = 'off' | 'on' | 'indeterminate'

type CheckboxBoxGeometry = {
    size: number
    /** Radius of the ring's centre line: the square's outer radius minus half the ring. */
    radius: number
    check: string
    checkWidth: number
    bar: string
    barWidth: number
}

const RING_WIDTH = 1.5
// The square sits 1px inside the box and the ring is drawn on its inner edge.
const RING_INSET = 1 + RING_WIDTH / 2

// UI Kit Checkbox: sm 16, md 20 and, as in the Figma matrix, lg 24; the check and the bar are
// the UI Kit glyphs placed in the box.
const BOX_GEOMETRY: Record<PneCheckboxSize, CheckboxBoxGeometry> = {
    small: {size: 16, radius: 2.25, check: 'M4.2 8.2 L6.6 10.6 L11.8 5.4', checkWidth: 1.5, bar: 'M4.75 8 H11.25', barWidth: 1.5},
    medium: {size: 20, radius: 2.25, check: 'M5 10.2 L8.2 13.4 L15 6.6', checkWidth: 1.5, bar: 'M6 10 H14', barWidth: 2},
    large: {size: 24, radius: 3.25, check: 'M5.9 12.2 L9.8 16.1 L18.1 7.8', checkWidth: 2, bar: 'M7.25 12 H16.75', barWidth: 2.5},
}

/**
 * The box MUI renders as `icon`, `checkedIcon` or `indeterminateIcon`. MUI hands it the checkbox
 * size as `fontSize`; the colours come from the root's rules.
 */
const PneCheckboxBox = ({fontSize, value}: {fontSize?: string, value: CheckboxBoxValue}) => {
    const geometry = BOX_GEOMETRY[fontSize as PneCheckboxSize] ?? BOX_GEOMETRY.medium
    const square = geometry.size - 2 * RING_INSET

    return <svg
        aria-hidden
        className={`PneCheckbox-box PneCheckbox-${value === 'off' ? 'off' : 'on'}`}
        height={geometry.size}
        viewBox={`0 0 ${geometry.size} ${geometry.size}`}
        width={geometry.size}
    >
        <rect
            className='PneCheckbox-square'
            height={square}
            rx={geometry.radius}
            strokeWidth={RING_WIDTH}
            width={square}
            x={RING_INSET}
            y={RING_INSET}
        />
        {value === 'off' ? null : <path
            className='PneCheckbox-mark'
            d={value === 'on' ? geometry.check : geometry.bar}
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={value === 'on' ? geometry.checkWidth : geometry.barWidth}
        />}
    </svg>
}

/**
 * Colours of one state as custom properties on the root; the box rules read them. The root colour
 * is the ring of an off box and the fill of an on one, so a `color` override recolours the box as
 * it did MUI's icons.
 */
const stateColors = (palette: PneCheckboxPalette, state: PneCheckboxState): Record<string, string> => {
    const off = palette.off[state]
    const on = palette.on[state]
    return {
        '--pne-checkbox-off-fill': off.fill,
        '--pne-checkbox-off-ring': off.ring,
        '--pne-checkbox-on-fill': on.fill,
        '--pne-checkbox-on-ring': on.ring === 'transparent' ? 'currentColor' : on.ring,
        '--pne-checkbox-mark': on.mark,
    }
}

// Hover and press change nothing on an inert or invalid box: the error look stays (UI Kit).
const INTERACTIVE_ROOT = '&:not(.Mui-disabled):not([data-pne-readonly]):not([data-pne-error])'

// Geometry lives in the box itself (it gets the size from MUI); the rules here are colours only.
// One rule per state keeps the style small: tables render a checkbox in every row.
const checkboxSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const colors = pne.checkbox
    const focusRing = `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${pne.focusRing}`

    return {
        // MUI's hit area stays: 38 around the small box, 42 around the medium one (large: 46).
        padding: '11px',
        transition: 'color 120ms linear',
        color: 'var(--pne-checkbox-off-ring)',
        // Later states win: default, hover, pressed, error, read-only, disabled.
        ...stateColors(colors, 'default'),
        [`${INTERACTIVE_ROOT}:hover`]: stateColors(colors, 'hover'),
        '&[data-pne-state="hover"]': stateColors(colors, 'hover'),
        [`${INTERACTIVE_ROOT}:active`]: stateColors(colors, 'pressed'),
        '&[data-pne-state="pressed"]': stateColors(colors, 'pressed'),
        '&[data-pne-error]': stateColors(colors, 'error'),
        '&[data-pne-readonly]': {...stateColors(colors, 'readOnly'), cursor: 'default'},
        // MUI greys a disabled root; the variables take over, and the on colour below still wins.
        '&.Mui-disabled': {...stateColors(colors, 'disabled'), color: 'var(--pne-checkbox-off-ring)'},
        '&.Mui-checked, &.MuiCheckbox-indeterminate': {color: 'var(--pne-checkbox-on-fill)'},
        '& .PneCheckbox-box': {
            borderRadius: '4px',
            display: 'block',
            flexShrink: 0,
        },
        '& .PneCheckbox-square': {
            transition: 'fill 120ms linear, stroke 120ms linear',
        },
        '& .PneCheckbox-off .PneCheckbox-square': {
            fill: 'var(--pne-checkbox-off-fill)',
            stroke: 'currentColor',
        },
        '& .PneCheckbox-on .PneCheckbox-square': {
            fill: 'currentColor',
            stroke: 'var(--pne-checkbox-on-ring)',
        },
        '& .PneCheckbox-on .PneCheckbox-mark': {
            stroke: 'var(--pne-checkbox-mark)',
        },
        '&.Mui-focusVisible .PneCheckbox-box, &[data-pne-state="focus"] .PneCheckbox-box': {
            boxShadow: focusRing,
        },
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '& .PneCheckbox-square': {
                transition: 'none',
            },
        },
    }
}
