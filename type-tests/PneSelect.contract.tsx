import * as React from 'react'

import {
    PneSelect,
    type PneSelectDisplayProps,
    type PneSelectKey,
    type PneSelectMenuListProps,
    type PneSelectMenuPaperProps,
    type PneSelectMenuProps,
    type PneSelectObjectProps,
    type PneSelectOptionProps,
    type PneSelectPrimitiveProps,
    type PneSelectProps,
} from 'pne-ui'

type DeliveryType = 'email' | 'sftp'

type Region = {
    code: string
    disabled: boolean
    title: string
}

const deliveryOptions = ['email', 'sftp'] as const satisfies readonly DeliveryType[]
const numberOptions: readonly number[] = [10, 20]
const regions = [
    {code: 'eu', disabled: false, title: 'Europe'},
    {code: 'apac', disabled: true, title: 'Asia Pacific'},
] as const satisfies readonly Region[]

const rootRef = React.createRef<HTMLDivElement>()
const wrongRootRef = React.createRef<HTMLSelectElement>()
const optionProps: PneSelectOptionProps = {'data-region': 'eu'}
const optionKey: PneSelectKey = 'eu'
const displayProps: PneSelectDisplayProps = {'aria-label': 'Delivery type', 'data-select': 'delivery'}
const menuListProps: PneSelectMenuListProps = {'data-menu': 'delivery'}
const menuPaperProps: PneSelectMenuPaperProps = {sx: {maxHeight: 320}}
const menuProps: PneSelectMenuProps = {slotProps: {list: menuListProps, paper: menuPaperProps}}
const structuralDisplayOverride = {as: () => null}
const primitiveProps: PneSelectPrimitiveProps<DeliveryType> = {
    onChange: () => undefined,
    options: deliveryOptions,
    value: 'email',
}
const regionProps: PneSelectProps<Region, string> = {
    getOptionDisabled: region => region.disabled,
    getOptionKey: region => region.code,
    getOptionLabel: region => region.title,
    onChange: region => {
        const code: string = region.code
        void code
    },
    options: regions,
    value: regions[0],
}
const objectProps: PneSelectObjectProps<Region, string> = regionProps

const LiteralSelect = () => {
    const [value, setValue] = React.useState<DeliveryType | null>(null)

    return <PneSelect
        options={deliveryOptions}
        value={value}
        onChange={setValue}
        ref={rootRef}
    />
}

const NumberSelect = () => {
    const [value, setValue] = React.useState<number | null>(10)

    return <PneSelect
        options={numberOptions}
        value={value}
        onChange={setValue}
    />
}

const ObjectSelect = () => {
    const [value, setValue] = React.useState<Region | null>(regions[0])

    return <PneSelect
        {...regionProps}
        value={value}
        onChange={setValue}
        getOptionProps={region => ({
            'aria-label': region.title,
            'data-region': region.code,
        })}
        renderOption={region => <span>{region.title}</span>}
        renderValue={region => region?.title ?? 'No region'}
    />
}

const validContracts = <>
    <LiteralSelect/>
    <NumberSelect/>
    <ObjectSelect/>
</>

const PrimitiveSelectForHoc = (props: PneSelectPrimitiveProps<DeliveryType>) => <PneSelect {...props}/>
const ObjectSelectForHoc = (props: PneSelectObjectProps<Region, string>) => <PneSelect {...props}/>
const MemoizedPrimitiveSelect = React.memo(PrimitiveSelectForHoc)
const MemoizedObjectSelect = React.memo(ObjectSelectForHoc)
const memoizedPrimitive = <MemoizedPrimitiveSelect
    options={deliveryOptions}
    value='email'
    onChange={() => undefined}
    notched
/>
const memoizedObject = <MemoizedObjectSelect {...regionProps}/>
const createdPrimitive = React.createElement(PrimitiveSelectForHoc, {
    notched: true,
    onChange: () => undefined,
    options: deliveryOptions,
    value: 'email',
})
const createdObject = React.createElement(ObjectSelectForHoc, regionProps)
const introspectedObjectProps: React.ComponentProps<typeof ObjectSelectForHoc> = regionProps

// @ts-expect-error The controlled value must belong to the inferred literal union.
const wrongValue = <PneSelect options={deliveryOptions} value='push' onChange={() => undefined}/>

// @ts-expect-error The callback receives the exact inferred option type.
const wrongCallback = <PneSelect options={deliveryOptions} value='email' onChange={(value: number) => void value}/>

// @ts-expect-error Object options require an explicit scalar key adapter.
const missingObjectKey: PneSelectProps<Region, string> = {
    options: regions,
    value: regions[0],
    onChange: () => undefined,
    getOptionLabel: region => region.title,
}

// @ts-expect-error Object options require an explicit label adapter.
const missingObjectLabel: PneSelectProps<Region, string> = {
    options: regions,
    value: regions[0],
    onChange: () => undefined,
    getOptionKey: region => region.code,
}

const invalidObjectKey = <PneSelect
    options={regions}
    value={regions[0]}
    onChange={() => undefined}
    // @ts-expect-error Select keys are restricted to strings and numbers.
    getOptionKey={region => region.disabled}
    getOptionLabel={region => region.title}
/>

// @ts-expect-error PneSelect forwards its ref to the non-native MUI root div.
const wrongRef = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} ref={wrongRootRef}/>

// @ts-expect-error A custom MUI input could invalidate the public root-ref contract.
const customInput = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} input={<input/>}/>

// @ts-expect-error Native mode is not implemented by PneSelect.
const nativeMode = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} native/>

// @ts-expect-error Multiple selection has a separate value/callback model and is not implemented by PneSelect.
const multipleMode = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} multiple/>

// @ts-expect-error PneSelect has an intentionally controlled-only contract.
const uncontrolledMode = <PneSelect options={deliveryOptions} defaultValue='email' onChange={() => undefined}/>

// @ts-expect-error null is the empty state and cannot be an option type.
const nullOptionProps: PneSelectProps<null> = {} as never

// @ts-expect-error undefined cannot be an option type.
const undefinedOptionProps: PneSelectProps<undefined> = {} as never

// @ts-expect-error null cannot be inferred as a selectable option.
const nullOptionSelect = <PneSelect options={[null]} value={null} onChange={() => undefined} getOptionKey={() => 'null'} getOptionLabel={() => 'Null'}/>

// @ts-expect-error undefined cannot be inferred as a selectable option.
const undefinedOptionSelect = <PneSelect options={[undefined]} value={null} onChange={() => undefined} getOptionKey={() => 'undefined'} getOptionLabel={() => 'Undefined'}/>

// @ts-expect-error Replacing MUI's SelectInput would invalidate the component contract.
const customInputComponent = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} inputComponent='textarea'/>

// @ts-expect-error Raw MUI input props could restore native or multiple behavior.
const customInputProps = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} inputProps={{multiple: true}}/>

// @ts-expect-error The public ref has one stable HTMLDivElement target.
const customInputRef = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} inputRef={React.createRef<HTMLInputElement>()}/>

// @ts-expect-error Replacing the MUI root slot would invalidate the public ref contract.
const customSlots = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} slots={{root: 'span'}}/>

// @ts-expect-error Raw MUI slot props are not part of the managed select contract.
const customSlotProps = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} slotProps={{root: {role: 'presentation'}}}/>

// @ts-expect-error Text-input modes are not meaningful for PneSelect.
const multilineMode = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} multiline/>

// @ts-expect-error PneSelect owns the interactive combobox role.
const replacementDisplayRole = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} SelectDisplayProps={{role: 'presentation'}}/>

// @ts-expect-error PneSelect owns keyboard and pointer opening behavior.
const replacementDisplayHandler = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} SelectDisplayProps={{onMouseDown: () => undefined}}/>

// @ts-expect-error Capture handlers on the outer MUI root could intercept the managed combobox.
const replacementRootCapture = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} onKeyDownCapture={() => undefined}/>

// @ts-expect-error The outer MUI root always has managed children.
const replacementRootHtml = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} dangerouslySetInnerHTML={{__html: 'replacement'}}/>

// @ts-expect-error The display always renders the selected option as its children.
const replacementDisplayHtml = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} SelectDisplayProps={{dangerouslySetInnerHTML: {__html: 'replacement'}}}/>

// @ts-expect-error The managed combobox cannot be hidden through structural HTML props.
const hiddenDisplay = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} SelectDisplayProps={{hidden: true}}/>

// @ts-expect-error Structural variables cannot bypass the display denylist.
const structuralDisplay = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} SelectDisplayProps={structuralDisplayOverride}/>

// @ts-expect-error PneSelect owns the menu open lifecycle.
const replacementMenuOpen = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{open: false}}/>

// @ts-expect-error PneSelect owns menu close handling.
const replacementMenuClose = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{onClose: () => undefined}}/>

// @ts-expect-error PneSelect owns listbox identity and semantics.
const replacementListRole = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{slotProps: {list: {role: 'menu'}}}}/>

// @ts-expect-error PneSelect owns menu and active-option focus management.
const replacementMenuFocus = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{autoFocus: false, slotProps: {list: {autoFocusItem: false}}}}/>

// @ts-expect-error The menu root cannot be replaced.
const replacementMenuRoot = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{component: () => null}}/>

// @ts-expect-error Emotion's structural `as` prop cannot replace the menu root.
const replacementMenuAs = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{as: () => null}}/>

// @ts-expect-error The menu transition lifecycle belongs to PneSelect and MUI.
const replacementMenuTransition = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{slotProps: {transition: {in: false, unmountOnExit: true}}}}/>

// @ts-expect-error Menu transition lifecycle callbacks are not part of the safe customization surface.
const replacementMenuLifecycle = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{onTransitionEnter: () => undefined}}/>

// @ts-expect-error Capture handlers cannot intercept managed listbox keyboard behavior.
const replacementMenuCapture = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{slotProps: {paper: {onKeyDownCapture: () => undefined}}}}/>

// @ts-expect-error The menu paper always contains the managed listbox.
const replacementMenuPaperHtml = <PneSelect options={deliveryOptions} value='email' onChange={() => undefined} MenuProps={{slotProps: {paper: {dangerouslySetInnerHTML: {__html: 'replacement'}}}}}/>

// @ts-expect-error Option content belongs to PneSelect; use renderOption for rich content.
const replacementOptionChildren: PneSelectOptionProps = {children: 'replacement'}

// @ts-expect-error An option always renders managed children.
const replacementOptionHtml: PneSelectOptionProps = {dangerouslySetInnerHTML: {__html: 'replacement'}}

// @ts-expect-error PneSelect owns option focus and keyboard behavior.
const replacementOptionInteraction: PneSelectOptionProps = {onKeyDown: () => undefined, tabIndex: -1}

// @ts-expect-error Managed options cannot be made inert or popovers.
const hiddenOptionInteraction: PneSelectOptionProps = {inert: true, popover: 'auto'}

void optionProps
void optionKey
void displayProps
void menuListProps
void menuPaperProps
void menuProps
void primitiveProps
void objectProps
void validContracts
void memoizedPrimitive
void memoizedObject
void createdPrimitive
void createdObject
void introspectedObjectProps
void wrongValue
void wrongCallback
void missingObjectKey
void missingObjectLabel
void invalidObjectKey
void wrongRef
void customInput
void nativeMode
void multipleMode
void uncontrolledMode
void nullOptionProps
void undefinedOptionProps
void nullOptionSelect
void undefinedOptionSelect
void customInputComponent
void customInputProps
void customInputRef
void customSlots
void customSlotProps
void multilineMode
void replacementDisplayRole
void replacementDisplayHandler
void replacementRootCapture
void replacementRootHtml
void replacementDisplayHtml
void hiddenDisplay
void structuralDisplay
void replacementMenuOpen
void replacementMenuClose
void replacementListRole
void replacementMenuFocus
void replacementMenuRoot
void replacementMenuAs
void replacementMenuTransition
void replacementMenuLifecycle
void replacementMenuCapture
void replacementOptionChildren
void replacementOptionHtml
void replacementOptionInteraction
void hiddenOptionInteraction
void replacementMenuPaperHtml
