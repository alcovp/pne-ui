import {createTheme, MenuItem, ThemeProvider} from '@mui/material'
import type {TextFieldOwnerState} from '@mui/material/TextField'
import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {PneField, PneTextField} from '../src'

const getDescriptionIds = (control: HTMLElement): string[] => {
    return control.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? []
}

describe('PneTextField', () => {
    it('merges external help with its own helper text when the input id is generated', () => {
        render(<>
            <span id='external-help'>External help</span>
            <PneTextField
                aria-describedby='external-help'
                helperText='Field helper'
                label='Report name'
            />
        </>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')

        expect(input.id).not.toBe('')
        expect(helperText.id).not.toBe('')
        expect(getDescriptionIds(input)).toEqual(['external-help', helperText.id])
    })

    it('keeps an explicit input id while merging object input and htmlInput slot descriptions', () => {
        render(<>
            <span id='external-help'>External help</span>
            <span id='input-slot-help'>Input slot help</span>
            <span id='html-input-slot-help'>HTML input slot help</span>
            <PneTextField
                aria-describedby='external-help'
                helperText='Field helper'
                id='report-name'
                label='Report name'
                slotProps={{
                    input: {
                        'aria-describedby': 'input-slot-help',
                        className: 'preserved-input-slot-class',
                    },
                    htmlInput: {
                        'aria-describedby': 'html-input-slot-help',
                        title: 'Preserved HTML input slot title',
                    },
                }}
            />
        </>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')
        const inputSlot = input.closest('.MuiInputBase-root')

        expect(input.id).toBe('report-name')
        expect(helperText.id).toBe('report-name-helper-text')
        expect(getDescriptionIds(input)).toEqual([
            'external-help',
            'input-slot-help',
            'html-input-slot-help',
            helperText.id,
        ])
        expect(input.title).toBe('Preserved HTML input slot title')
        expect(inputSlot?.classList.contains('preserved-input-slot-class')).toBe(true)
    })

    it('merges a functional input slot description and preserves its props', () => {
        const inputSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            'aria-describedby': 'input-slot-help',
            className: 'preserved-input-slot-class',
        }))

        render(<>
            <span id='input-slot-help'>Input slot help</span>
            <PneTextField
                helperText='Field helper'
                id='report-name'
                label='Report name'
                slotProps={{input: inputSlot}}
            />
        </>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')

        expect(inputSlot).toHaveBeenCalledTimes(1)
        expect(inputSlot.mock.calls[0]?.[0]).toEqual(expect.objectContaining({id: 'report-name'}))
        expect(getDescriptionIds(input)).toEqual(['input-slot-help', helperText.id])
        expect(input.closest('.MuiInputBase-root')?.classList.contains('preserved-input-slot-class')).toBe(true)
    })

    it('merges a functional htmlInput slot description and preserves its props', () => {
        const htmlInputSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            'aria-describedby': 'html-input-slot-help',
            title: 'Preserved HTML input slot title',
        }))

        render(<>
            <span id='html-input-slot-help'>HTML input slot help</span>
            <PneTextField
                helperText='Field helper'
                id='report-name'
                label='Report name'
                slotProps={{htmlInput: htmlInputSlot}}
            />
        </>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')

        expect(htmlInputSlot).toHaveBeenCalledTimes(1)
        expect(htmlInputSlot.mock.calls[0]?.[0]).toEqual(expect.objectContaining({id: 'report-name'}))
        expect(getDescriptionIds(input)).toEqual(['html-input-slot-help', helperText.id])
        expect(input.title).toBe('Preserved HTML input slot title')
    })

    it('keeps the PneField helper association when both input slots are functional', () => {
        const inputSlot = jest.fn(() => ({className: 'preserved-input-slot-class'}))
        const htmlInputSlot = jest.fn(() => ({title: 'Preserved HTML input slot title'}))

        render(<PneField
            helperText='Outer helper'
            id='report-name-field'
            label='Report name'
        >
            <PneTextField
                slotProps={{
                    input: inputSlot,
                    htmlInput: htmlInputSlot,
                }}
            />
        </PneField>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Outer helper')

        expect(inputSlot).toHaveBeenCalledTimes(1)
        expect(htmlInputSlot).toHaveBeenCalledTimes(1)
        expect(getDescriptionIds(input)).toEqual([helperText.id])
        expect(input.title).toBe('Preserved HTML input slot title')
        expect(input.closest('.MuiInputBase-root')?.classList.contains('preserved-input-slot-class')).toBe(true)
    })

    it('keeps PneField required semantics when native required is explicitly disabled', () => {
        render(<PneField label='Report name' required>
            <PneTextField required={false}/>
        </PneField>)

        const input = screen.getByRole('textbox', {name: 'Report name'})

        expect(input.getAttribute('aria-required')).toBe('true')
        expect(input.hasAttribute('required')).toBe(false)
    })

    it('does not evaluate unused functional slots twice while composing active slots', () => {
        const formHelperTextSlot = jest.fn(() => ({title: 'Unused helper slot'}))
        const htmlInputSlot = jest.fn(() => ({title: 'Preserved HTML input slot title'}))
        const selectSlot = jest.fn(() => ({title: 'Unused select slot'}))

        render(<PneTextField
            label='Report name'
            slotProps={{
                formHelperText: formHelperTextSlot,
                htmlInput: htmlInputSlot,
                select: selectSlot,
            }}
        />)

        expect(screen.getByRole('textbox', {name: 'Report name'}).title)
            .toBe('Preserved HTML input slot title')
        expect(formHelperTextSlot).toHaveBeenCalledTimes(1)
        expect(htmlInputSlot).toHaveBeenCalledTimes(1)
        expect(selectSlot).toHaveBeenCalledTimes(1)
    })

    it('uses and preserves an object formHelperText slot id', () => {
        render(<PneTextField
            helperText='Field helper'
            id='report-name'
            label='Report name'
            slotProps={{
                formHelperText: {
                    className: 'preserved-helper-slot-class',
                    id: 'custom-helper',
                    title: 'Preserved helper slot title',
                },
            }}
        />)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')

        expect(helperText.id).toBe('custom-helper')
        expect(getDescriptionIds(input)).toEqual([helperText.id])
        expect(helperText.title).toBe('Preserved helper slot title')
        expect(helperText.classList.contains('preserved-helper-slot-class')).toBe(true)
    })

    it('uses and preserves a functional formHelperText slot id', () => {
        const formHelperTextSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            className: 'preserved-helper-slot-class',
            id: 'functional-helper',
            title: 'Preserved helper slot title',
        }))

        render(<PneTextField
            helperText='Field helper'
            id='report-name'
            label='Report name'
            slotProps={{formHelperText: formHelperTextSlot}}
        />)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const helperText = screen.getByText('Field helper')

        expect(formHelperTextSlot).toHaveBeenCalledTimes(1)
        expect(formHelperTextSlot.mock.calls[0]?.[0]).toEqual(expect.objectContaining({id: 'report-name'}))
        expect(helperText.id).toBe('functional-helper')
        expect(getDescriptionIds(input)).toEqual([helperText.id])
        expect(helperText.title).toBe('Preserved helper slot title')
        expect(helperText.classList.contains('preserved-helper-slot-class')).toBe(true)
    })

    it('forwards the root ref separately from inputRef', () => {
        const rootRef = React.createRef<HTMLDivElement>()
        const inputRef = React.createRef<HTMLInputElement>()

        render(<PneTextField
            data-autotest='report-name'
            inputRef={inputRef}
            label='Report name'
            ref={rootRef}
        />)

        const input = screen.getByRole('textbox', {name: 'Report name'})

        expect(rootRef.current?.tagName).toBe('DIV')
        expect(rootRef.current?.classList.contains('MuiTextField-root')).toBe(true)
        expect(rootRef.current?.getAttribute('data-autotest')).toBe('report-name')
        expect(input.hasAttribute('data-autotest')).toBe(false)
        expect(inputRef.current).toBe(input)
        expect(rootRef.current).not.toBe(inputRef.current)
    })

    it('preserves MuiTextField default sx when caller sx is omitted', () => {
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            MuiTextField: {
                defaultProps: {
                    sx: {marginTop: '13px'},
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <PneTextField label='Report name'/>
        </ThemeProvider>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const root = input.closest('.MuiTextField-root')

        expect(root).not.toBeNull()
        expect(window.getComputedStyle(root as Element).marginTop).toBe('13px')
    })

    it('honors MUI className and style default-prop merging', () => {
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            mergeClassNameAndStyle: true,
            MuiTextField: {
                defaultProps: {
                    className: 'theme-text-field',
                    style: {
                        color: 'rgb(255, 0, 0)',
                        marginTop: '11px',
                    },
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <PneTextField
                className='consumer-text-field'
                label='Report name'
                style={{color: 'rgb(0, 0, 255)'}}
            />
        </ThemeProvider>)

        const root = screen.getByRole('textbox', {name: 'Report name'})
            .closest('.MuiTextField-root') as HTMLElement

        expect(root.classList.contains('theme-text-field')).toBe(true)
        expect(root.classList.contains('consumer-text-field')).toBe(true)
        expect(root.style.color).toBe('rgb(0, 0, 255)')
        expect(root.style.marginTop).toBe('11px')
    })

    it('associates generated helper text and external help with a multiline textarea', () => {
        render(<>
            <span id='external-help'>External help</span>
            <PneTextField
                aria-describedby='external-help'
                helperText='Field helper'
                label='Notes'
                multiline
                minRows={2}
            />
        </>)

        const textarea = screen.getByRole('textbox', {name: 'Notes'})
        const helperText = screen.getByText('Field helper')

        expect(textarea.tagName).toBe('TEXTAREA')
        expect(textarea.id).not.toBe('')
        expect(getDescriptionIds(textarea)).toEqual(['external-help', helperText.id])
    })

    it('associates generated helper text and external help with a select', () => {
        render(<>
            <span id='external-help'>External help</span>
            <PneTextField
                aria-describedby='external-help'
                defaultValue='email'
                helperText='Field helper'
                label='Delivery method'
                select
            >
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='sftp'>SFTP</MenuItem>
            </PneTextField>
        </>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Field helper')

        expect(select.id).not.toBe('')
        expect(getDescriptionIds(select)).toEqual(['external-help', helperText.id])
    })

    it('labels a select from PneField and preserves object SelectDisplayProps', () => {
        const {container} = render(<>
            <span id='select-slot-help'>Select slot help</span>
            <span id='select-display-help'>Select display help</span>
            <PneField
                helperText='Outer helper'
                id='delivery-field'
                label='Delivery method'
                required
            >
                <PneTextField
                    defaultValue='email'
                    select
                    slotProps={{
                        select: {
                            'aria-describedby': 'select-slot-help',
                            className: 'preserved-select-slot-class',
                            SelectDisplayProps: {
                                'aria-describedby': 'select-display-help',
                                title: 'Preserved select display title',
                            },
                        },
                    }}
                >
                    <MenuItem value='email'>Email</MenuItem>
                    <MenuItem value='sftp'>SFTP</MenuItem>
                </PneTextField>
            </PneField>
        </>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Outer helper')
        const hiddenInput = container.querySelector('.MuiSelect-nativeInput')

        expect(select.getAttribute('aria-required')).toBe('true')
        expect(select.title).toBe('Preserved select display title')
        expect(getDescriptionIds(select)).toEqual([
            'select-slot-help',
            'select-display-help',
            helperText.id,
        ])
        expect(select.closest('.MuiInputBase-root')?.classList.contains('preserved-select-slot-class'))
            .toBe(true)
        expect(hiddenInput).not.toBeNull()
        expect(hiddenInput?.hasAttribute('required')).toBe(false)
    })

    it('labels a select from PneField without requiring other accessibility props', () => {
        render(<PneField id='delivery-field' label='Delivery method'>
            <PneTextField defaultValue='email' select>
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='sftp'>SFTP</MenuItem>
            </PneTextField>
        </PneField>)

        expect(screen.getByRole('combobox', {name: 'Delivery method'}).id)
            .toBe('delivery-field-control')
    })

    it('labels a select from PneField and preserves functional SelectDisplayProps', () => {
        const selectSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            SelectDisplayProps: {
                'aria-describedby': 'select-display-help',
                tabIndex: 2,
                title: 'Preserved functional select display title',
            },
            title: 'Preserved select root title',
        }))

        render(<>
            <span id='select-display-help'>Select display help</span>
            <PneField
                helperText='Outer helper'
                id='delivery-field'
                label='Delivery method'
                required
            >
                <PneTextField
                    defaultValue='email'
                    select
                    slotProps={{select: selectSlot}}
                >
                    <MenuItem value='email'>Email</MenuItem>
                    <MenuItem value='sftp'>SFTP</MenuItem>
                </PneTextField>
            </PneField>
        </>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Outer helper')

        expect(selectSlot).toHaveBeenCalledTimes(1)
        expect(selectSlot.mock.calls[0]?.[0]).toEqual(expect.objectContaining({select: true}))
        expect(select.getAttribute('aria-required')).toBe('true')
        expect(select.getAttribute('tabindex')).toBe('2')
        expect(select.title).toBe('Preserved functional select display title')
        expect(getDescriptionIds(select)).toEqual(['select-display-help', helperText.id])
        expect(select.closest('.MuiInputBase-root')?.getAttribute('title'))
            .toBe('Preserved select root title')
    })

    it('labels a native select from PneField without enabling native validation', () => {
        render(<PneField
            helperText='Outer helper'
            id='delivery-field'
            label='Delivery method'
            required
        >
            <PneTextField
                defaultValue='email'
                select
                slotProps={{select: {native: true}}}
            >
                <option value='email'>Email</option>
                <option value='sftp'>SFTP</option>
            </PneTextField>
        </PneField>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Outer helper')

        expect(select.tagName).toBe('SELECT')
        expect(select.getAttribute('aria-required')).toBe('true')
        expect(select.hasAttribute('required')).toBe(false)
        expect(getDescriptionIds(select)).toEqual([helperText.id])
    })

    it('composes MuiTextField default helper, select, and functional slot props', () => {
        const htmlInputSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            'data-theme-html-input': 'preserved',
        }))
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            MuiTextField: {
                defaultProps: {
                    helperText: 'Theme helper',
                    select: true,
                    slotProps: {htmlInput: htmlInputSlot},
                },
            },
        }

        const {container} = render(<ThemeProvider theme={theme}>
            <span id='external-help'>External help</span>
            <PneTextField
                aria-describedby='external-help'
                defaultValue='email'
                label='Delivery method'
            >
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='sftp'>SFTP</MenuItem>
            </PneTextField>
        </ThemeProvider>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Theme helper')
        const hiddenInput = container.querySelector('[data-theme-html-input="preserved"]')

        expect(htmlInputSlot).toHaveBeenCalledTimes(1)
        expect(hiddenInput).not.toBeNull()
        expect(getDescriptionIds(select)).toEqual(['external-help', helperText.id])
    })

    it('keeps explicit PneField control state above MuiTextField defaults', () => {
        const theme = createTheme()
        theme.components = {
            ...theme.components,
            MuiTextField: {
                defaultProps: {
                    disabled: false,
                    error: false,
                    fullWidth: false,
                    id: 'theme-control',
                },
            },
        }

        render(<ThemeProvider theme={theme}>
            <PneField disabled error fullWidth id='report-field' label='Report name'>
                <PneTextField/>
            </PneField>
        </ThemeProvider>)

        const input = screen.getByRole('textbox', {name: 'Report name'})
        const root = input.closest('.MuiTextField-root')

        expect(input.id).toBe('report-field-control')
        expect(input.hasAttribute('disabled')).toBe(true)
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(root?.classList.contains('MuiFormControl-fullWidth')).toBe(true)
    })
})
