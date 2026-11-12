import React, {forwardRef, useId, useRef, useState} from 'react'
import {
    FormControl,
    FormControlLabel,
    FormControlLabelProps,
    FormControlProps,
    FormGroup,
    FormGroupProps,
    FormHelperText,
    FormHelperTextProps,
    SxProps,
} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import {useForkRef} from '@mui/material/utils'
import {resolvePneSemanticPalette} from '../createTheme'
import {mergeAriaDescribedBy} from './PneFieldContext'
import {PneCheckbox, PneCheckboxProps, type PneCheckboxSize} from './PneCheckbox'

/** `card` is the UI Kit Frame layout: a card for a few large options, tinted and ringed when picked. */
export type PneLabeledCheckboxVariant = 'plain' | 'card'

export interface PneLabeledCheckboxProps extends PneCheckboxProps {
    label?: React.ReactNode
    /** The description under the label; in error it reads as the error text. */
    helperText?: React.ReactNode
    error?: boolean
    /** `card` takes a click anywhere on it. Default `plain`. */
    variant?: PneLabeledCheckboxVariant
    containerSx?: SxProps
    formControlProps?: Omit<FormControlProps, 'error' | 'sx'>
    formGroupProps?: FormGroupProps
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>
    helperTextProps?: FormHelperTextProps
}

const BOX_SIZE: Record<PneCheckboxSize, number> = {small: 16, medium: 20, large: 24}
// PneCheckbox keeps MUI's hit area around the box.
const HIT_PADDING = 11
const LABEL_LINE = 20
const LABEL_GAP = 8

export const PneLabeledCheckbox = forwardRef<HTMLSpanElement, PneLabeledCheckboxProps>((props, ref) => {
    const {
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': ariaInvalid,
        label,
        helperText,
        error = false,
        variant = 'plain',
        containerSx,
        formControlProps,
        formGroupProps,
        formControlLabelProps,
        helperTextProps,
        inputRef,
        onChange,
        sx,
        ...rest
    } = props
    const generatedId = useId()
    const hasHelperText = helperText !== undefined && helperText !== null
    const helperTextId = hasHelperText
        ? helperTextProps?.id ?? `${generatedId}-helper-text`
        : undefined
    const size = rest.size ?? 'small'
    const isCard = variant === 'card'
    // The card is tinted by the value, which an uncontrolled checkbox keeps to itself.
    const [ownChecked, setOwnChecked] = useState(Boolean(rest.defaultChecked))
    const isOn = (rest.checked ?? ownChecked) || rest.indeterminate === true
    const ownInputRef = useRef<HTMLInputElement>(null)
    const handleInputRef = useForkRef(ownInputRef, inputRef)

    const handleChange: PneCheckboxProps['onChange'] = (event, checked) => {
        setOwnChecked(checked)
        onChange?.(event, checked)
    }

    // A click on the card's padding or on the description goes to the checkbox; the label row takes its own.
    const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
        formControlProps?.onClick?.(event)
        if (!isCard || event.defaultPrevented || (event.target as HTMLElement).closest('label')) return
        ownInputRef.current?.click()
    }

    return (
        <FormControl
            data-pne-checked={isCard && isOn ? true : undefined}
            data-pne-disabled={isCard && rest.disabled ? true : undefined}
            data-pne-error={isCard && error ? true : undefined}
            data-pne-readonly={isCard && rest.readOnly ? true : undefined}
            data-pne-variant={variant}
            error={error}
            {...formControlProps}
            onClick={handleContainerClick}
            sx={[
                labeledCheckboxSx(size, isCard),
                ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
            ] as SxProps<Theme>}
        >
            <FormGroup {...formGroupProps}>
                <FormControlLabel
                    control={
                        <PneCheckbox
                            {...rest}
                            aria-describedby={mergeAriaDescribedBy(ariaDescribedBy, helperTextId)}
                            aria-invalid={error ? true : ariaInvalid}
                            inputRef={handleInputRef}
                            onChange={handleChange}
                            sx={sx}
                            ref={ref}
                        />
                    }
                    label={label}
                    {...formControlLabelProps}
                />
            </FormGroup>
            {hasHelperText && (
                <FormHelperText {...helperTextProps} id={helperTextId}>{helperText}</FormHelperText>
            )}
        </FormControl>
    )
})

PneLabeledCheckbox.displayName = 'PneLabeledCheckbox'

/**
 * UI Kit Checkboxes/Set: the label 14/20 is 8px from the box and on a line with it, the description
 * 12/16 stands under the label. The box keeps its hit area in the plain layout; in the card the
 * whole card is the target, so the box loses it and the card takes 6px of padding.
 */
const labeledCheckboxSx = (size: PneCheckboxSize, isCard: boolean): SxProps<Theme> => theme => {
    const {card, text} = resolvePneSemanticPalette(theme).checkbox
    const box = BOX_SIZE[size]
    const hitArea = box + 2 * HIT_PADDING
    // The label line is centred on the box: by padding around the label, or around the box when it is the smaller.
    const labelInset = isCard ? Math.max(0, (box - LABEL_LINE) / 2) : (hitArea - LABEL_LINE) / 2
    const boxInset = isCard ? Math.max(0, (LABEL_LINE - box) / 2) : 0

    return {
        ...(isCard ? {
            backgroundColor: card.fill,
            borderRadius: '8px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            padding: '6px',
            transition: 'background-color 120ms linear, box-shadow 120ms linear',
            '&:hover, &[data-pne-state="hover"]': {boxShadow: `inset 0 0 0 1px ${card.ringHover}`},
            '&[data-pne-checked]': {backgroundColor: card.fillOn, boxShadow: `inset 0 0 0 1px ${card.ringOn}`},
            '&[data-pne-readonly]': {boxShadow: 'none', cursor: 'default'},
            '&[data-pne-disabled]': {backgroundColor: card.fill, boxShadow: 'none', cursor: 'default'},
            '&[data-pne-error]': {boxShadow: `inset 0 0 0 1px ${card.ringError}`},
            '& .MuiFormControlLabel-root': {
                alignItems: 'flex-start',
                gap: `${LABEL_GAP}px`,
                marginLeft: 0,
                marginRight: 0,
            },
            '& .MuiCheckbox-root': {
                marginTop: `${boxInset}px`,
                padding: 0,
            },
        } : {
            '& .MuiFormControlLabel-root': {
                alignItems: 'flex-start',
            },
        }),
        '& .MuiFormControlLabel-label': {
            color: text.label,
            fontSize: '14px',
            lineHeight: `${LABEL_LINE}px`,
            // The hit area leaves 11px after the box; the label stands 8px from it.
            marginLeft: isCard ? 0 : `${LABEL_GAP - HIT_PADDING}px`,
            paddingBottom: `${labelInset}px`,
            paddingTop: `${labelInset}px`,
        },
        '& .MuiFormControlLabel-label.Mui-disabled': {
            color: text.disabled,
        },
        '& > .MuiFormHelperText-root': {
            color: text.helper,
            fontSize: '12px',
            lineHeight: '16px',
            margin: 0,
            marginLeft: `${box + LABEL_GAP}px`,
            marginTop: isCard ? 0 : `${-labelInset}px`,
        },
        '& > .MuiFormHelperText-root.Mui-error': {
            color: text.error,
        },
        '& > .MuiFormHelperText-root.Mui-disabled': {
            color: text.disabled,
        },
    }
}
