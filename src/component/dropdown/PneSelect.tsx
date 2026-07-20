import React, {ReactNode, useId} from 'react'
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    type MenuListProps,
    type MenuOwnerState,
    type MenuProps,
    type PaperProps,
    Select,
    SelectChangeEvent,
    SelectProps,
    SelectVariants,
} from '@mui/material'
import {mergeAriaDescribedBy, usePneFieldControlProps} from '../PneFieldContext'

export type PneSelectKey = string | number

type PneDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

type PneDomEventProp = Extract<
    keyof React.DOMAttributes<HTMLElement>,
    `on${string}`
>

type PneDomCaptureEventProp = Extract<PneDomEventProp, `${string}Capture`>

type ManagedSelectRootProp =
    | PneDomCaptureEventProp
    | 'aria-hidden'
    | 'as'
    | 'children'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'hidden'
    | 'inert'
    | 'popover'

type ManagedOptionProp =
    | PneDomEventProp
    | 'aria-disabled'
    | 'aria-hidden'
    | 'aria-selected'
    | 'autoFocus'
    | 'as'
    | 'children'
    | 'component'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'dense'
    | 'disabled'
    | 'disableGutters'
    | 'divider'
    | 'draggable'
    | 'focusVisibleClassName'
    | 'hidden'
    | 'inert'
    | 'key'
    | 'ref'
    | 'role'
    | 'popover'
    | 'selected'
    | 'tabIndex'
    | 'value'

export type PneSelectOptionProps = Omit<
    React.HTMLAttributes<HTMLLIElement>,
    ManagedOptionProp
> & PneDataAttributes & Partial<Record<ManagedOptionProp, never>>

type ManagedSelectDisplayProp =
    | PneDomEventProp
    | 'aria-hidden'
    | 'aria-controls'
    | 'aria-expanded'
    | 'aria-haspopup'
    | 'as'
    | 'children'
    | 'component'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'hidden'
    | 'inert'
    | 'popover'
    | 'role'
    | 'tabIndex'

export type PneSelectDisplayProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    ManagedSelectDisplayProp
> & PneDataAttributes & Partial<Record<ManagedSelectDisplayProp, never>>

type ManagedMenuListProp =
    | PneDomEventProp
    | 'aria-hidden'
    | 'aria-labelledby'
    | 'aria-multiselectable'
    | 'autoFocus'
    | 'autoFocusItem'
    | 'as'
    | 'children'
    | 'component'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'disabledItemsFocusable'
    | 'disableListWrap'
    | 'hidden'
    | 'id'
    | 'inert'
    | 'popover'
    | 'ref'
    | 'role'
    | 'subheader'
    | 'tabIndex'
    | 'variant'

export type PneSelectMenuListProps = Omit<MenuListProps, ManagedMenuListProp>
    & PneDataAttributes
    & Partial<Record<ManagedMenuListProp, never>>

type PneSelectMenuListSlotProps = PneSelectMenuListProps
    | ((ownerState: MenuOwnerState) => PneSelectMenuListProps)

export type PneSelectMenuPaperProps = Omit<
    PaperProps,
    ManagedMenuPaperProp
> & PneDataAttributes & Partial<Record<ManagedMenuPaperProp, never>>

type ManagedMenuPaperProp =
    | PneDomEventProp
    | 'aria-hidden'
    | 'as'
    | 'children'
    | 'component'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'hidden'
    | 'inert'
    | 'popover'
    | 'ref'
    | 'role'
    | 'tabIndex'

type PneSelectMenuPaperSlotProps = PneSelectMenuPaperProps
    | ((ownerState: MenuOwnerState) => PneSelectMenuPaperProps)

type MuiMenuSlotProps = NonNullable<MenuProps['slotProps']>

type PneSelectMenuSlotProps = {
    backdrop?: never
    list?: PneSelectMenuListSlotProps
    paper?: PneSelectMenuPaperSlotProps
    root?: never
    transition?: never
}

type ManagedMenuProp =
    | PneDomEventProp
    | 'anchorEl'
    | 'anchorPosition'
    | 'anchorReference'
    | 'aria-hidden'
    | 'autoFocus'
    | 'as'
    | 'BackdropComponent'
    | 'BackdropProps'
    | 'children'
    | 'closeAfterTransition'
    | 'component'
    | 'container'
    | 'contentEditable'
    | 'dangerouslySetInnerHTML'
    | 'disableAutoFocus'
    | 'disableAutoFocusItem'
    | 'disableEnforceFocus'
    | 'disablePortal'
    | 'disableRestoreFocus'
    | 'hideBackdrop'
    | 'hidden'
    | 'id'
    | 'inert'
    | 'keepMounted'
    | 'MenuListProps'
    | 'onClose'
    | 'onTransitionEnter'
    | 'onTransitionExited'
    | 'open'
    | 'PaperProps'
    | 'popover'
    | 'ref'
    | 'role'
    | 'slotProps'
    | 'slots'
    | 'tabIndex'
    | 'TransitionComponent'
    | 'TransitionProps'
    | 'variant'

export type PneSelectMenuProps = Omit<Partial<MenuProps>, ManagedMenuProp>
    & Partial<Record<Exclude<ManagedMenuProp, 'slotProps'>, never>>
    & {
        slotProps?: PneSelectMenuSlotProps
    }

type PneSelectOptionValue = NonNullable<unknown>

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type MuiSelectProps = DistributiveOmit<
    SelectProps<string>,
    | ManagedSelectRootProp
    | 'children'
    | 'defaultValue'
    | 'fullWidth'
    | 'input'
    | 'inputComponent'
    | 'inputProps'
    | 'inputRef'
    | 'maxRows'
    | 'MenuProps'
    | 'minRows'
    | 'multiline'
    | 'multiple'
    | 'native'
    | 'onChange'
    | 'placeholder'
    | 'renderValue'
    | 'rows'
    | 'SelectDisplayProps'
    | 'slotProps'
    | 'slots'
    | 'type'
    | 'value'
>

type PneSelectBaseProps<T extends PneSelectOptionValue, K extends PneSelectKey> = MuiSelectProps
    & Partial<Record<ManagedSelectRootProp, never>>
    & {
        /** Controlled domain value. `null` represents no selected option. */
        value: NoInfer<T> | null
        /** Receives the original option, never the internal serialized MUI value. */
        onChange: (option: NoInfer<T>) => void
        options: readonly T[]
        getOptionDisabled?: (option: T) => boolean
        getOptionProps?: (option: T) => PneSelectOptionProps
        placeholder?: ReactNode
        renderOption?: (option: T) => ReactNode
        renderValue?: (value: T | null) => ReactNode
        MenuProps?: PneSelectMenuProps
        SelectDisplayProps?: PneSelectDisplayProps
        fullWidth?: boolean
        ref?: React.Ref<HTMLDivElement>
        /** PneSelect intentionally has a controlled-only contract. */
        defaultValue?: never
        /** PneSelect is intentionally non-native. */
        native?: never
        /** PneSelect is intentionally single-select. */
        multiple?: never
        /** A custom MUI input could invalidate the public root-ref contract. */
        input?: never
        inputComponent?: never
        inputProps?: never
        inputRef?: never
        multiline?: never
        rows?: never
        maxRows?: never
        minRows?: never
        slots?: never
        slotProps?: never
        type?: never
        children?: never
        variant?: SelectVariants
        getOptionKey: (option: T) => K
        getOptionLabel: (option: T) => string
    }

export type PneSelectPrimitiveProps<
    T extends PneSelectKey,
    K extends PneSelectKey = T,
> = DistributiveOmit<
    PneSelectBaseProps<T, K>,
    'getOptionKey' | 'getOptionLabel'
> & {
    getOptionKey?: (option: T) => K
    getOptionLabel?: (option: T) => string
}

export type PneSelectObjectProps<
    T extends PneSelectOptionValue,
    K extends PneSelectKey,
> = PneSelectBaseProps<T, K>

export type PneSelectProps<
    T extends PneSelectOptionValue,
    K extends PneSelectKey = [T] extends [PneSelectKey]
        ? Extract<T, PneSelectKey>
        : PneSelectKey,
> = [T] extends [PneSelectKey]
    ? PneSelectPrimitiveProps<Extract<T, PneSelectKey>, K>
    : PneSelectObjectProps<T, K>

type PneSelectImplementationProps<T extends PneSelectOptionValue, K extends PneSelectKey> = DistributiveOmit<
    PneSelectBaseProps<T, K>,
    'getOptionKey' | 'getOptionLabel'
> & {
    getOptionKey?: (option: T) => K
    getOptionLabel?: (option: T) => string
}

type PneSelectComponent = {
    <T extends PneSelectOptionValue, K extends PneSelectKey>(
        props: PneSelectObjectProps<T, K>,
    ): React.JSX.Element
    <T extends PneSelectKey, K extends PneSelectKey = T>(
        props: PneSelectPrimitiveProps<T, K>,
    ): React.JSX.Element
    displayName?: string
}

type ResolvedOption<T> = {
    key: string
    option: T
}

const PneSelectImplementation = <T extends PneSelectOptionValue, K extends PneSelectKey>(
    props: PneSelectImplementationProps<T, K>,
) => {
    const {
        'aria-describedby': ariaDescribedBy,
        children: _children,
        defaultValue: _defaultValue,
        disabled,
        displayEmpty,
        error,
        fullWidth,
        getOptionDisabled,
        getOptionKey,
        getOptionLabel,
        getOptionProps,
        id,
        input: _input,
        inputComponent: _inputComponent,
        inputProps: _inputProps,
        inputRef: _inputRef,
        label,
        labelId: labelIdProp,
        maxRows: _maxRows,
        MenuProps,
        minRows: _minRows,
        multiline: _multiline,
        multiple: _multiple,
        native: _native,
        onChange,
        options,
        placeholder,
        ref,
        renderOption,
        renderValue,
        required,
        rows: _rows,
        SelectDisplayProps,
        size = 'small',
        slotProps: _slotProps,
        slots: _slots,
        sx,
        type: _type,
        value,
        variant = 'outlined',
        ...rest
    } = props
    const safeRest = sanitizeSelectRootProps(rest)

    const generatedLabelId = useId()
    const hasLabel = label !== undefined && label !== null && label !== ''
    const resolveOptionKey = getOptionKey ?? getPrimitiveOptionKey
    const resolveOptionLabel = getOptionLabel ?? getPrimitiveOptionLabel
    const resolvedOptions = resolveOptions(options, resolveOptionKey)
    const optionsByKey = new Map(resolvedOptions.map(option => [option.key, option.option]))
    const selectedKey = resolveSelectedKey(value, resolveOptionKey, optionsByKey)
    const controlProps = usePneFieldControlProps({
        ariaDescribedBy,
        disabled,
        error,
        fullWidth,
        id,
        required,
    })
    const internalLabelId = labelIdProp ?? generatedLabelId
    const resolvedLabelId = hasLabel ? internalLabelId : labelIdProp ?? controlProps.labelId
    const mergedAriaDescribedBy = mergeAriaDescribedBy(
        controlProps.ariaDescribedBy,
        SelectDisplayProps?.['aria-describedby'],
    )
    const {
        'aria-controls': _displayAriaControls,
        'aria-describedby': _displayAriaDescribedBy,
        'aria-disabled': displayAriaDisabled,
        'aria-expanded': _displayAriaExpanded,
        'aria-haspopup': _displayAriaHasPopup,
        'aria-invalid': displayAriaInvalid,
        'aria-labelledby': displayAriaLabelledBy,
        'aria-required': displayAriaRequired,
        children: _displayChildren,
        dangerouslySetInnerHTML: _displayDangerouslySetInnerHtml,
        id: displayIdProp,
        onBlur: _displayOnBlur,
        onBlurCapture: _displayOnBlurCapture,
        onFocus: _displayOnFocus,
        onFocusCapture: _displayOnFocusCapture,
        onKeyDown: _displayOnKeyDown,
        onKeyDownCapture: _displayOnKeyDownCapture,
        onMouseDown: _displayOnMouseDown,
        onMouseDownCapture: _displayOnMouseDownCapture,
        role: _displayRole,
        tabIndex: _displayTabIndex,
        ...selectDisplayProps
    } = SelectDisplayProps ?? {}
    const displayId = controlProps.id ?? displayIdProp
    const mergedAriaLabelledBy = mergeAriaDescribedBy(
        resolvedLabelId,
        displayId,
        displayAriaLabelledBy,
    )
    const safeSelectDisplayProps = sanitizeManagedProps(
        selectDisplayProps,
        managedSelectDisplayProps,
    )
    const resolvedSelectDisplayProps = {
        ...safeSelectDisplayProps,
        ...(displayId ? {id: displayId} : {}),
        ...(mergedAriaDescribedBy
            ? {'aria-describedby': mergedAriaDescribedBy}
            : {}),
        ...(mergedAriaLabelledBy
            ? {'aria-labelledby': mergedAriaLabelledBy}
            : {}),
        ...(displayAriaDisabled !== undefined || controlProps.disabled !== undefined
            ? {'aria-disabled': controlProps.disabled === true ? true : displayAriaDisabled}
            : {}),
        ...(displayAriaInvalid !== undefined || controlProps.error !== undefined
            ? {'aria-invalid': controlProps.error === true ? true : displayAriaInvalid}
            : {}),
        ...(displayAriaRequired !== undefined
            || controlProps.required !== undefined
            || controlProps.ariaRequired !== undefined
            ? {
                'aria-required': controlProps.required === true || controlProps.ariaRequired === true
                    ? true
                    : displayAriaRequired,
            }
            : {}),
    }
    const resolvedMenuProps = sanitizeMenuProps(MenuProps)

    const handleChange = (event: SelectChangeEvent<string>) => {
        const key = event.target.value

        if (!optionsByKey.has(key)) {
            console.warn(`PneSelect ignored an unknown option key: ${key}`)
            return
        }

        onChange(optionsByKey.get(key) as T)
    }

    const shouldRenderValue = renderValue !== undefined || placeholder !== undefined && placeholder !== null
    const renderSelectedValue = (key: string): ReactNode => {
        const selectedOption = key === '' ? null : optionsByKey.get(key) ?? null

        if (renderValue) {
            return renderValue(selectedOption)
        }

        if (selectedOption === null) {
            return <Box
                component='span'
                sx={{color: 'text.secondary'}}
            >
                {placeholder}
            </Box>
        }

        return resolveOptionLabel(selectedOption)
    }

    return <FormControl
        size={size}
        variant={variant}
        disabled={controlProps.disabled}
        error={controlProps.error}
        required={controlProps.required}
        sx={sx}
        fullWidth={controlProps.fullWidth ?? true}
    >
        {hasLabel ? <InputLabel id={internalLabelId}>{label}</InputLabel> : null}
        <Select<string>
            ref={ref}
            aria-describedby={mergedAriaDescribedBy}
            displayEmpty={displayEmpty ?? shouldRenderValue}
            id={controlProps.id}
            labelId={resolvedLabelId}
            onChange={handleChange}
            size={size}
            variant={variant}
            label={hasLabel ? label : undefined}
            renderValue={shouldRenderValue ? renderSelectedValue : undefined}
            MenuProps={resolvedMenuProps}
            SelectDisplayProps={resolvedSelectDisplayProps}
            value={selectedKey}
            {...safeRest}
        >
            {resolvedOptions.map(({key, option}) => {
                const optionLabel = resolveOptionLabel(option)
                const optionProps = sanitizeOptionProps(getOptionProps?.(option))

                return <MenuItem
                    aria-label={renderOption ? optionLabel : undefined}
                    {...optionProps}
                    disabled={getOptionDisabled?.(option) ?? false}
                    key={key}
                    value={key}
                >
                    {renderOption ? renderOption(option) : optionLabel}
                </MenuItem>
            })}
        </Select>
    </FormControl>
}

const PneSelect = PneSelectImplementation as PneSelectComponent
PneSelect.displayName = 'PneSelect'

export default PneSelect

const sanitizeMenuProps = (menuProps: PneSelectMenuProps | undefined): Partial<MenuProps> | undefined => {
    if (!menuProps) {
        return undefined
    }

    const {
        slotProps,
        ...menuPropsWithoutSlots
    } = menuProps
    const safeMenuProps = sanitizeManagedProps(menuPropsWithoutSlots, managedMenuProps)
    const {
        list,
        paper,
        backdrop: _backdrop,
        root: _root,
        transition: _transition,
    } = slotProps ?? {}
    const safeListProps = sanitizeMenuListSlotProps(list)
    const safePaperProps = sanitizeMenuPaperSlotProps(paper)

    return {
        ...safeMenuProps,
        ...(slotProps
            ? {
                slotProps: {
                    ...(safeListProps ? {list: safeListProps} : {}),
                    ...(safePaperProps ? {paper: safePaperProps} : {}),
                },
            }
            : {}),
    }
}

const sanitizeMenuListSlotProps = (
    slotProps: PneSelectMenuListSlotProps | undefined,
): NonNullable<MuiMenuSlotProps['list']> | undefined => {
    if (typeof slotProps === 'function') {
        return ownerState => sanitizeMenuListProps(slotProps(ownerState))
    }

    return slotProps ? sanitizeMenuListProps(slotProps) : undefined
}

const sanitizeMenuListProps = (props: PneSelectMenuListProps): PneSelectMenuListProps => {
    return sanitizeManagedProps(props, managedMenuListProps)
}

const sanitizeMenuPaperSlotProps = (
    slotProps: PneSelectMenuPaperSlotProps | undefined,
): NonNullable<MuiMenuSlotProps['paper']> | undefined => {
    if (typeof slotProps === 'function') {
        return ownerState => sanitizeMenuPaperProps(slotProps(ownerState))
    }

    return slotProps ? sanitizeMenuPaperProps(slotProps) : undefined
}

const sanitizeMenuPaperProps = (props: PneSelectMenuPaperProps): PneSelectMenuPaperProps => {
    return sanitizeManagedProps(props, managedMenuPaperProps)
}

const sanitizeOptionProps = (
    props: PneSelectOptionProps | undefined,
): PneSelectOptionProps | undefined => {
    if (!props) {
        return undefined
    }

    return sanitizeManagedProps(props, managedOptionProps)
}

const sanitizeManagedProps = <T extends object>(
    props: T,
    managedProps: ReadonlySet<string>,
): T => Object.fromEntries(
    Object.entries(props).filter(([prop]) => (
        !prop.startsWith('on') && !managedProps.has(prop)
    )),
) as T

const sanitizeSelectRootProps = <T extends object>(props: T): T => Object.fromEntries(
    Object.entries(props).filter(([prop]) => (
        (!prop.startsWith('on') || !prop.endsWith('Capture'))
        && !managedSelectRootProps.has(prop)
    )),
) as T

const managedSelectRootProps = new Set<string>([
    'aria-hidden',
    'as',
    'children',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'hidden',
    'inert',
    'popover',
])

const managedSelectDisplayProps = new Set<string>([
    'aria-controls',
    'aria-expanded',
    'aria-haspopup',
    'aria-hidden',
    'as',
    'children',
    'component',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'hidden',
    'inert',
    'popover',
    'role',
    'tabIndex',
])

const managedMenuProps = new Set<string>([
    'anchorEl',
    'anchorPosition',
    'anchorReference',
    'aria-hidden',
    'as',
    'autoFocus',
    'BackdropComponent',
    'BackdropProps',
    'children',
    'closeAfterTransition',
    'component',
    'container',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'disableAutoFocus',
    'disableAutoFocusItem',
    'disableEnforceFocus',
    'disablePortal',
    'disableRestoreFocus',
    'hidden',
    'hideBackdrop',
    'id',
    'inert',
    'keepMounted',
    'MenuListProps',
    'onClose',
    'onTransitionEnter',
    'onTransitionExited',
    'open',
    'PaperProps',
    'popover',
    'ref',
    'role',
    'slots',
    'tabIndex',
    'TransitionComponent',
    'TransitionProps',
    'variant',
])

const managedMenuListProps = new Set<string>([
    'aria-hidden',
    'aria-labelledby',
    'aria-multiselectable',
    'autoFocus',
    'autoFocusItem',
    'as',
    'children',
    'component',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'disabledItemsFocusable',
    'disableListWrap',
    'hidden',
    'id',
    'inert',
    'popover',
    'ref',
    'role',
    'subheader',
    'tabIndex',
    'variant',
])

const managedMenuPaperProps = new Set<string>([
    'aria-hidden',
    'as',
    'children',
    'component',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'hidden',
    'inert',
    'popover',
    'ref',
    'role',
    'tabIndex',
])

const managedOptionProps = new Set<string>([
    'aria-disabled',
    'aria-hidden',
    'aria-selected',
    'autoFocus',
    'as',
    'children',
    'component',
    'contentEditable',
    'dangerouslySetInnerHTML',
    'dense',
    'disabled',
    'disableGutters',
    'divider',
    'draggable',
    'focusVisibleClassName',
    'hidden',
    'inert',
    'key',
    'ref',
    'role',
    'popover',
    'selected',
    'tabIndex',
    'value',
])

const getPrimitiveOptionKey = <T, K extends PneSelectKey>(option: T): K => {
    if (typeof option === 'string' || typeof option === 'number') {
        return option as unknown as K
    }

    throw new TypeError('Object PneSelect options require getOptionKey')
}

const getPrimitiveOptionLabel = <T, >(option: T): string => {
    if (typeof option === 'string' || typeof option === 'number') {
        return String(option)
    }

    throw new TypeError('Object PneSelect options require getOptionLabel')
}

const serializeOptionKey = (key: PneSelectKey): string => {
    const serializedKey = String(key)

    if (serializedKey === '') {
        throw new TypeError('PneSelect option keys must not serialize to an empty string')
    }

    return serializedKey
}

const resolveOptions = <T, K extends PneSelectKey>(
    options: readonly T[],
    getOptionKey: (option: T) => K,
): ResolvedOption<T>[] => {
    const seenKeys = new Set<string>()

    return options.map(option => {
        const key = serializeOptionKey(getOptionKey(option))

        if (seenKeys.has(key)) {
            throw new TypeError(`PneSelect option keys must be unique after serialization: ${key}`)
        }

        seenKeys.add(key)

        return {key, option}
    })
}

const resolveSelectedKey = <T, K extends PneSelectKey>(
    value: T | null,
    getOptionKey: (option: T) => K,
    optionsByKey: ReadonlyMap<string, T>,
): string => {
    if (value === null) {
        return ''
    }

    const key = serializeOptionKey(getOptionKey(value))
    return optionsByKey.has(key) ? key : ''
}
