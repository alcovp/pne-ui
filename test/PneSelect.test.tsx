import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    createAutoTestAttributes,
    PneField,
    PneSelect,
    type PneSelectPrimitiveProps,
} from '../src'

describe('PneSelect', () => {
    it('renders placeholder text for an empty value without a floating label', () => {
        const rootRef = React.createRef<HTMLDivElement>()

        render(<PneSelect
            options={['Email', 'SFTP']}
            placeholder='Please select'
            ref={rootRef}
            value={null}
            onChange={() => undefined}
        />)

        expect(screen.getByText('Please select')).toBeTruthy()
        expect(rootRef.current?.tagName).toBe('DIV')
    })

    it('places standalone aria-disabled on the semantic combobox', () => {
        render(<PneSelect
            aria-disabled
            options={['Email', 'SFTP']}
            value='Email'
            onChange={() => undefined}
        />)

        expect(screen.getByRole('combobox').getAttribute('aria-disabled')).toBe('true')
    })

    it('composes top-level managed ARIA with PneField semantics', () => {
        render(<>
            <span id='external-select-label'>External name</span>
            <span id='consumer-select-label'>Consumer label</span>
            <span id='external-select-help'>External help</span>
            <PneField
                disabled
                helperText='Field help'
                id='delivery-field'
                label='Delivery channel'
            >
                <PneSelect
                    aria-describedby='external-select-help'
                    aria-disabled={false}
                    aria-invalid='grammar'
                    aria-labelledby='external-select-label'
                    aria-required
                    labelId='consumer-select-label'
                    options={['Email', 'SFTP']}
                    value='Email'
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const select = screen.getByRole('combobox')

        expect(select.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'delivery-field-label',
            'consumer-select-label',
            'external-select-label',
            'delivery-field-control',
        ])
        expect(select.getAttribute('aria-describedby')?.split(/\s+/)).toEqual([
            'external-select-help',
            'delivery-field-helper-text',
        ])
        expect(select.getAttribute('aria-disabled')).toBe('true')
        expect(select.getAttribute('aria-invalid')).toBe('grammar')
        expect(select.getAttribute('aria-required')).toBe('true')
    })

    it('lets explicit top-level and display names override generated labels', () => {
        render(<>
            <PneField id='top-level-name' label='First field name'>
                <PneSelect
                    aria-label='Explicit top-level name'
                    aria-labelledby='ignored-top-level-label'
                    options={['Email', 'SFTP']}
                    value='Email'
                    onChange={() => undefined}
                />
            </PneField>
            <PneField id='display-name' label='Second field name'>
                <PneSelect
                    aria-label='Ignored top-level name'
                    options={['Email', 'SFTP']}
                    SelectDisplayProps={{
                        'aria-label': 'Explicit display name',
                        'aria-labelledby': 'ignored-display-label',
                    }}
                    value='SFTP'
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const topLevelNamed = screen.getByRole('combobox', {name: 'Explicit top-level name'})
        const displayNamed = screen.getByRole('combobox', {name: 'Explicit display name'})

        expect(topLevelNamed.hasAttribute('aria-labelledby')).toBe(false)
        expect(displayNamed.hasAttribute('aria-labelledby')).toBe(false)

        fireEvent.click(screen.getByText('First field name'))
        expect(document.activeElement).toBe(topLevelNamed)
        fireEvent.click(screen.getByText('Second field name'))
        expect(document.activeElement).toBe(displayNamed)
    })

    it('keeps the PneField label as focus owner when a consumer labelId is merged', () => {
        render(<>
            <span id='consumer-label-id'>Consumer name</span>
            <PneField id='listener-field' label='Field owner'>
                <PneSelect
                    labelId='consumer-label-id'
                    options={['Email', 'SFTP']}
                    value='Email'
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const select = screen.getByRole('combobox', {
            name: 'Field owner Consumer name',
        })

        fireEvent.click(screen.getByText('Field owner'))
        expect(document.activeElement).toBe(select)
    })

    it('forwards caller-owned attributes to each semantic option', () => {
        render(<PneSelect
            options={['Email', 'SFTP']}
            value='Email'
            onChange={() => undefined}
            getOptionProps={option => createAutoTestAttributes('delivery-option', option)}
            SelectDisplayProps={{'aria-label': 'Delivery type'}}
        />)

        fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Delivery type'}))

        expect(document.querySelector(
            '[role="option"][data-autotest="delivery-option"][data-autotest-value="Email"]',
        )).not.toBeNull()
        expect(document.querySelector(
            '[role="option"][data-autotest="delivery-option"][data-autotest-value="SFTP"]',
        )).not.toBeNull()
    })

    it('keeps combobox and listbox behavior when untyped callers pass managed MUI props', () => {
        const replacementMouseDown = jest.fn()
        const replacementClose = jest.fn()
        const unsafeProps = {
            getOptionProps: () => ({
                as: () => null,
                children: 'replacement option',
                dangerouslySetInnerHTML: {__html: 'replacement option html'},
                inert: true,
                onKeyDown: (event: React.KeyboardEvent<HTMLLIElement>) => event.stopPropagation(),
                popover: 'auto',
                tabIndex: -1,
            }),
            MenuProps: {
                as: () => null,
                autoFocus: false,
                component: () => null,
                dangerouslySetInnerHTML: {__html: 'replacement menu'},
                disableAutoFocus: true,
                disableAutoFocusItem: true,
                disableEnforceFocus: true,
                disableRestoreFocus: true,
                onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => {
                    event.stopPropagation()
                },
                onClose: replacementClose,
                open: false,
                slotProps: {
                    list: {
                        as: () => null,
                        autoFocus: false,
                        autoFocusItem: false,
                        component: () => null,
                        dangerouslySetInnerHTML: {__html: 'replacement options'},
                        disableListWrap: false,
                        id: 'replacement-list',
                        inert: true,
                        onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => {
                            event.stopPropagation()
                        },
                        role: 'menu',
                        popover: 'auto',
                    },
                    paper: {
                        as: () => null,
                        component: () => null,
                        dangerouslySetInnerHTML: {__html: 'replacement paper'},
                        onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => {
                            event.stopPropagation()
                        },
                        popover: 'auto',
                    },
                    transition: {in: false, unmountOnExit: true},
                },
                variant: 'menu',
            },
            as: () => null,
            dangerouslySetInnerHTML: {__html: 'replacement root'},
            inert: true,
            onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => {
                event.stopPropagation()
            },
            onMouseDownCapture: (event: React.MouseEvent<HTMLElement>) => {
                event.preventDefault()
            },
            SelectDisplayProps: {
                'aria-controls': 'replacement-list',
                'aria-expanded': 'false',
                'aria-haspopup': 'dialog',
                'aria-hidden': true,
                as: () => null,
                contentEditable: true,
                dangerouslySetInnerHTML: {__html: 'replacement display'},
                hidden: true,
                inert: true,
                onMouseDown: replacementMouseDown,
                popover: 'auto',
                role: 'presentation',
                tabIndex: -1,
            },
        } as unknown as Partial<PneSelectPrimitiveProps<string>>

        render(<PneSelect
            {...unsafeProps}
            options={['Email', 'SFTP']}
            value='Email'
            onChange={() => undefined}
        />)

        const select = screen.getByRole('combobox')
        expect(select.getAttribute('aria-haspopup')).toBe('listbox')
        expect(select.tabIndex).toBe(0)

        fireEvent.mouseDown(select)

        const listbox = screen.getByRole('listbox')
        const selectedOption = screen.getByRole('option', {name: 'Email'})
        const nextOption = screen.getByRole('option', {name: 'SFTP'})
        expect(screen.queryByText('replacement option')).toBeNull()
        expect(screen.queryByText('replacement option html')).toBeNull()
        expect(selectedOption.tabIndex).toBe(0)
        expect(replacementMouseDown).not.toHaveBeenCalled()
        expect(select.getAttribute('aria-expanded')).toBe('true')
        expect(select.getAttribute('aria-controls')).toBe(listbox.id)
        expect(listbox.id).not.toBe('replacement-list')
        expect(document.activeElement).toBe(selectedOption)

        fireEvent.keyDown(selectedOption, {key: 'ArrowDown'})
        expect(document.activeElement).toBe(nextOption)

        fireEvent.click(nextOption)
        expect(screen.queryByRole('listbox')).toBeNull()
        expect(replacementClose).not.toHaveBeenCalled()

        fireEvent.keyDown(select, {key: 'ArrowDown'})
        expect(screen.getByRole('listbox')).toBeTruthy()
    })

    it('preserves primitive numeric values through selection', () => {
        const onChange = jest.fn<void, [number]>()

        render(<PneSelect
            options={[10, 20]}
            value={10}
            onChange={onChange}
            SelectDisplayProps={{'aria-label': 'Page size'}}
        />)

        fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Page size'}))
        fireEvent.click(screen.getByRole('option', {name: '20'}))

        expect(onChange).toHaveBeenCalledWith(20)
    })

    it('selects arbitrary objects by key and keeps raw options in callbacks', () => {
        type Region = {
            code: string
            disabled: boolean
            title: string
        }

        const regions: readonly Region[] = [
            {code: 'eu', disabled: false, title: 'Europe'},
            {code: 'apac', disabled: true, title: 'Asia Pacific'},
            {code: 'americas', disabled: false, title: 'Americas'},
        ]
        const rehydratedValue: Region = {...regions[0]}
        const onChange = jest.fn<void, [Region]>()
        const getOptionLabel = jest.fn((option: Region) => option.title)
        const getOptionProps = jest.fn((option: Region) => ({'data-region': option.code}))
        const getOptionDisabled = jest.fn((option: Region) => option.disabled)
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        try {
            render(<PneSelect
                options={regions}
                value={rehydratedValue}
                onChange={onChange}
                getOptionKey={option => option.code}
                getOptionLabel={getOptionLabel}
                getOptionProps={getOptionProps}
                getOptionDisabled={getOptionDisabled}
                renderOption={option => <span>Choice: {option.title}</span>}
                renderValue={option => option?.title ?? 'No region'}
                SelectDisplayProps={{'aria-label': 'Region'}}
            />)

            expect(screen.getByRole('combobox', {name: 'Region'}).textContent).toContain('Europe')
            expect(consoleWarn).not.toHaveBeenCalledWith(expect.stringContaining('out-of-range'))

            fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Region'}))

            const europe = screen.getByRole('option', {name: 'Europe'})
            const asiaPacific = screen.getByRole('option', {name: 'Asia Pacific'})
            const americas = screen.getByRole('option', {name: 'Americas'})

            expect(europe.getAttribute('data-region')).toBe('eu')
            expect(asiaPacific.getAttribute('aria-disabled')).toBe('true')
            expect(getOptionProps).toHaveBeenCalledWith(regions[0])
            expect(getOptionDisabled).toHaveBeenCalledWith(regions[1])

            fireEvent.click(asiaPacific)
            expect(onChange).not.toHaveBeenCalled()

            fireEvent.click(americas)
            expect(onChange).toHaveBeenCalledWith(regions[2])
        } finally {
            consoleWarn.mockRestore()
        }
    })

    it('renders a stale controlled value as empty without an MUI range warning', () => {
        type Region = {code: string; title: string}

        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        try {
            render(<PneSelect
                options={[{code: 'eu', title: 'Europe'}] satisfies Region[]}
                value={{code: 'removed', title: 'Removed region'}}
                onChange={() => undefined}
                getOptionKey={option => option.code}
                getOptionLabel={option => option.title}
                placeholder='Please select'
                SelectDisplayProps={{'aria-label': 'Region'}}
            />)

            expect(screen.getByRole('combobox', {name: 'Region'}).textContent).toContain('Please select')
            expect(consoleWarn.mock.calls.flat().some(argument => (
                String(argument).includes('out-of-range')
            ))).toBe(false)
        } finally {
            consoleWarn.mockRestore()
        }
    })

    it('rejects keys that collide after serialization', () => {
        expect(() => render(<PneSelect
            options={[1, '1'] as const}
            value={null}
            onChange={() => undefined}
        />)).toThrow('PneSelect option keys must be unique after serialization: 1')
    })

    it('reserves the empty serialized key for the null value', () => {
        expect(() => render(<PneSelect
            options={[''] as const}
            value={null}
            onChange={() => undefined}
        />)).toThrow('PneSelect option keys must not serialize to an empty string')
    })

    it('also rejects an empty key from a non-null controlled value', () => {
        const options: readonly string[] = ['Email']

        expect(() => render(<PneSelect
            options={options}
            value=''
            onChange={() => undefined}
        />)).toThrow('PneSelect option keys must not serialize to an empty string')
    })
})
