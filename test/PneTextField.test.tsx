import {createTheme, MenuItem, ThemeProvider} from '@mui/material'
import type {TextFieldOwnerState} from '@mui/material/TextField'
import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

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
                        id: 'ignored-html-input-id',
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
            id: 'ignored-functional-input-id',
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
        expect(input.id).toBe('report-name')
        expect(getDescriptionIds(input)).toEqual(['html-input-slot-help', helperText.id])
        expect(input.title).toBe('Preserved HTML input slot title')
    })

    it('keeps the PneField helper association when both input slots are functional', () => {
        const inputSlot = jest.fn(() => ({
            className: 'preserved-input-slot-class',
            disabled: false,
        }))
        const htmlInputSlot = jest.fn(() => ({
            'aria-disabled': false,
            disabled: false,
            id: 'ignored-functional-field-id',
            title: 'Preserved HTML input slot title',
        }))

        render(<PneField
            disabled
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
        expect(input.id).toBe('report-name-field-control')
        expect((input as HTMLInputElement).disabled).toBe(true)
        expect(input.getAttribute('aria-disabled')).toBe('true')
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
                disabled
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
                            disabled: false,
                            id: 'ignored-select-root-id',
                            SelectDisplayProps: {
                                'aria-describedby': 'select-display-help',
                                'aria-disabled': false,
                                id: 'ignored-select-display-id',
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
        expect(select.getAttribute('aria-disabled')).toBe('true')
        expect(select.id).toBe('delivery-field-control')
        expect(select.title).toBe('Preserved select display title')
        expect(getDescriptionIds(select)).toEqual([
            'select-slot-help',
            'select-display-help',
            helperText.id,
        ])
        expect(select.closest('.MuiInputBase-root')?.classList.contains('preserved-select-slot-class'))
            .toBe(true)
        expect(hiddenInput).not.toBeNull()
        expect((hiddenInput as HTMLInputElement).disabled).toBe(true)
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

    it('lets explicit top-level and display names override the PneField label for a select', () => {
        render(<>
            <PneField id='top-select-field' label='Top field name'>
                <PneTextField
                    aria-label='Explicit top-level select name'
                    aria-labelledby='ignored-top-select-label'
                    defaultValue='email'
                    select
                >
                    <MenuItem value='email'>Email</MenuItem>
                </PneTextField>
            </PneField>
            <PneField id='display-select-field' label='Display field name'>
                <PneTextField
                    defaultValue='sftp'
                    select
                    slotProps={{
                        select: {
                            SelectDisplayProps: {
                                'aria-label': 'Explicit display select name',
                                'aria-labelledby': 'ignored-display-select-label',
                            },
                        },
                    }}
                >
                    <MenuItem value='sftp'>SFTP</MenuItem>
                </PneTextField>
            </PneField>
        </>)

        const topNamed = screen.getByRole('combobox', {name: 'Explicit top-level select name'})
        const displayNamed = screen.getByRole('combobox', {name: 'Explicit display select name'})

        expect(topNamed.hasAttribute('aria-labelledby')).toBe(false)
        expect(displayNamed.hasAttribute('aria-labelledby')).toBe(false)

        fireEvent.click(screen.getByText('Top field name'))
        expect(document.activeElement).toBe(topNamed)
        fireEvent.click(screen.getByText('Display field name'))
        expect(document.activeElement).toBe(displayNamed)
    })

    it('labels a select from PneField and preserves functional SelectDisplayProps', () => {
        const selectSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            SelectDisplayProps: {
                'aria-describedby': 'select-display-help',
                id: 'ignored-functional-display-id',
                tabIndex: 2,
                title: 'Preserved functional select display title',
            },
            id: 'ignored-functional-select-id',
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
        expect(select.id).toBe('delivery-field-control')
        expect(select.getAttribute('tabindex')).toBe('2')
        expect(select.title).toBe('Preserved functional select display title')
        expect(getDescriptionIds(select)).toEqual(['select-display-help', helperText.id])
        expect(select.closest('.MuiInputBase-root')?.getAttribute('title'))
            .toBe('Preserved select root title')
    })

    it('merges functional select label references and keeps field error authoritative', () => {
        const selectSlot = jest.fn((_ownerState: TextFieldOwnerState) => ({
            'aria-labelledby': 'select-slot-label',
            disabled: false,
            SelectDisplayProps: {
                'aria-disabled': false,
                'aria-invalid': 'grammar' as const,
                'aria-labelledby': 'select-display-label',
            },
        }))

        render(<>
            <span id='top-select-label'>Top name</span>
            <span id='input-select-label'>Input name</span>
            <span id='html-select-label'>HTML input name</span>
            <span id='select-slot-label'>Select slot name</span>
            <span id='select-display-label'>Select display name</span>
            <PneField disabled error id='merged-select-field' label='Field name'>
                <PneTextField
                    aria-labelledby='top-select-label'
                    defaultValue='email'
                    select
                    slotProps={{
                        htmlInput: () => ({
                            'aria-disabled': false,
                            'aria-labelledby': 'html-select-label',
                            disabled: false,
                        }),
                        input: () => ({
                            'aria-labelledby': 'input-select-label',
                            disabled: false,
                        }),
                        select: selectSlot,
                    }}
                >
                    <MenuItem value='email'>Email</MenuItem>
                </PneTextField>
            </PneField>
        </>)

        const select = screen.getByRole('combobox', {
            name: 'Field name Top name Input name HTML input name Select slot name Select display name',
        })

        expect(selectSlot).toHaveBeenCalledTimes(1)
        expect(select.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'merged-select-field-label',
            'top-select-label',
            'input-select-label',
            'html-select-label',
            'select-slot-label',
            'select-display-label',
        ])
        expect(select.getAttribute('aria-disabled')).toBe('true')
        expect(select.getAttribute('aria-invalid')).toBe('true')
    })

    it('labels a native select from PneField without enabling native validation', () => {
        render(<PneField
            disabled
            helperText='Outer helper'
            id='delivery-field'
            label='Delivery method'
            required
        >
            <PneTextField
                defaultValue='email'
                select
                slotProps={{
                    htmlInput: {disabled: false, id: 'ignored-native-html-id'},
                    select: {disabled: false, id: 'ignored-native-select-id', native: true},
                }}
            >
                <option value='email'>Email</option>
                <option value='sftp'>SFTP</option>
            </PneTextField>
        </PneField>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Outer helper')

        expect(select.tagName).toBe('SELECT')
        expect(select.id).toBe('delivery-field-control')
        expect((select as HTMLSelectElement).disabled).toBe(true)
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
                    slotProps: {
                        htmlInput: htmlInputSlot,
                        select: {
                            id: 'ignored-theme-select-id',
                            SelectDisplayProps: {id: 'ignored-theme-display-id'},
                        },
                    },
                },
            },
        }

        const {container} = render(<ThemeProvider theme={theme}>
            <span id='external-help'>External help</span>
            <PneField controlId='theme-delivery-control' label='Delivery method'>
                <PneTextField
                    aria-describedby='external-help'
                    defaultValue='email'
                >
                    <MenuItem value='email'>Email</MenuItem>
                    <MenuItem value='sftp'>SFTP</MenuItem>
                </PneTextField>
            </PneField>
        </ThemeProvider>)

        const select = screen.getByRole('combobox', {name: 'Delivery method'})
        const helperText = screen.getByText('Theme helper')
        const hiddenInput = container.querySelector('[data-theme-html-input="preserved"]')

        expect(htmlInputSlot).toHaveBeenCalledTimes(1)
        expect(hiddenInput).not.toBeNull()
        expect(select.id).toBe('theme-delivery-control')
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
                    slotProps: {
                        htmlInput: {
                            'aria-disabled': false,
                            disabled: false,
                            id: 'ignored-theme-html-id',
                        },
                        input: {disabled: false, error: false},
                    },
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
        expect(input.getAttribute('aria-disabled')).toBe('true')
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(root?.classList.contains('MuiFormControl-fullWidth')).toBe(true)
    })

    it('merges every object-slot label reference and keeps field error authoritative', () => {
        render(<>
            <span id='top-level-label'>Top-level context</span>
            <span id='input-slot-label'>Input context</span>
            <span id='html-input-label'>HTML input context</span>
            <PneField error id='report-field' label='Report name'>
                <PneTextField
                    aria-labelledby='top-level-label'
                    slotProps={{
                        htmlInput: {
                            'aria-invalid': false,
                            'aria-labelledby': 'html-input-label',
                        },
                        input: {
                            'aria-invalid': false,
                            'aria-labelledby': 'input-slot-label',
                        },
                    }}
                />
            </PneField>
        </>)

        const input = screen.getByRole('textbox', {
            name: 'Report name Top-level context Input context HTML input context',
        })

        expect(input.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'report-field-label',
            'top-level-label',
            'input-slot-label',
            'html-input-label',
        ])
        expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('applies the same label and invalid merge to functional slots', () => {
        render(<>
            <span id='functional-input-label'>Functional input context</span>
            <span id='functional-html-label'>Functional HTML context</span>
            <PneField error id='functional-field' label='Functional field'>
                <PneTextField
                    slotProps={{
                        htmlInput: () => ({
                            'aria-invalid': false,
                            'aria-labelledby': 'functional-html-label',
                        }),
                        input: () => ({
                            'aria-invalid': false,
                            'aria-labelledby': 'functional-input-label',
                        }),
                    }}
                />
            </PneField>
        </>)

        const input = screen.getByRole('textbox', {
            name: 'Functional field Functional input context Functional HTML context',
        })

        expect(input.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'functional-field-label',
            'functional-input-label',
            'functional-html-label',
        ])
        expect(input.getAttribute('aria-invalid')).toBe('true')
    })

    it('keeps an explicit native aria-label as the naming override', () => {
        render(<PneField id='account-field' label='Account'>
            <PneTextField
                slotProps={{
                    htmlInput: {
                        'aria-label': 'Explicit account name',
                        'aria-labelledby': 'ignored-explicit-reference',
                    },
                }}
            />
        </PneField>)

        const input = screen.getByRole('textbox', {name: 'Explicit account name'})

        expect(input.hasAttribute('aria-labelledby')).toBe(false)
    })
})
