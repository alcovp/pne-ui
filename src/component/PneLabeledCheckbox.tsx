import React, {useId} from 'react'
import {FormControl, FormControlLabel, FormControlLabelProps, FormGroup, FormHelperText, SxProps} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../createTheme'
import {mergeAriaIds} from './PneFieldContext'
import {PneCheckbox, PneCheckboxProps, type PneCheckboxSize} from './PneCheckbox'

export interface PneLabeledCheckboxProps extends PneCheckboxProps {
    label?: React.ReactNode
    /** The description under the label; in error it reads as the error text. */
    helperText?: React.ReactNode
    error?: boolean
    containerSx?: SxProps
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>
}

const BOX_SIZE: Record<PneCheckboxSize, number> = {small: 16, medium: 20, large: 24}
// PneCheckbox keeps MUI's hit area around the box.
const HIT_PADDING = 11
const LABEL_LINE = 20
const LABEL_GAP = 8

export const PneLabeledCheckbox = ({
    ref,
    ...props
}: React.PropsWithoutRef<PneLabeledCheckboxProps> & {ref?: React.Ref<HTMLSpanElement>}) => {
    const {
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': ariaInvalid,
        label,
        helperText,
        error = false,
        containerSx,
        formControlLabelProps,
        sx,
        ...rest
    } = props
    const generatedId = useId()
    const hasHelperText = helperText !== undefined && helperText !== null
    const helperTextId = hasHelperText ? `${generatedId}-helper-text` : undefined
    const size = rest.size ?? 'small'

    return (
        <FormControl
            error={error}
            sx={
                [
                    labeledCheckboxSx(size),
                    ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
                ] as SxProps<Theme>
            }
        >
            <FormGroup>
                <FormControlLabel
                    control={
                        <PneCheckbox
                            {...rest}
                            aria-describedby={mergeAriaIds(ariaDescribedBy, helperTextId)}
                            aria-invalid={error ? true : ariaInvalid}
                            sx={sx}
                            ref={ref}
                        />
                    }
                    label={label}
                    {...formControlLabelProps}
                />
            </FormGroup>
            {hasHelperText && <FormHelperText id={helperTextId}>{helperText}</FormHelperText>}
        </FormControl>
    )
}

PneLabeledCheckbox.displayName = 'PneLabeledCheckbox'

/**
 * UI Kit Checkboxes/Set: the label 14/20 is 8px from the box and on a line with it, the description
 * 12/16 stands under the label. The box keeps its hit area.
 */
const labeledCheckboxSx =
    (size: PneCheckboxSize): SxProps<Theme> =>
    theme => {
        const {text} = resolvePneSemanticPalette(theme).checkbox
        const box = BOX_SIZE[size]
        const hitArea = box + 2 * HIT_PADDING
        // The label line is centred on the box by padding around the label.
        const labelInset = (hitArea - LABEL_LINE) / 2

        return {
            '& .MuiFormControlLabel-root': {
                alignItems: 'flex-start',
            },
            '& .MuiFormControlLabel-label': {
                color: text.label,
                fontSize: '14px',
                lineHeight: `${LABEL_LINE}px`,
                // The hit area leaves 11px after the box; the label stands 8px from it.
                marginLeft: `${LABEL_GAP - HIT_PADDING}px`,
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
                marginTop: `${-labelInset}px`,
            },
            '& > .MuiFormHelperText-root.Mui-error': {
                color: text.error,
            },
            '& > .MuiFormHelperText-root.Mui-disabled': {
                color: text.disabled,
            },
        }
    }
