import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import 'jest-canvas-mock'

import {
    createAutoTestAttributes,
    PneAutocomplete,
    PneField,
    type PneAutocompleteHtmlInputProps,
} from '../src'
import {isOptionEqualToValue} from '../src/common/paynet/dropdown'
import {areAutocompleteOptionsEqualBy} from '../src/component/dropdown/PneAutocompleteShared'

const openAutocomplete = (input: HTMLElement) => {
    fireEvent.focus(input)
    fireEvent.mouseDown(input)
    fireEvent.keyDown(input, {key: 'ArrowDown'})
}

describe('PneAutocomplete', () => {
    it('forwards only safe caller attributes to the native input', () => {
        const callerOnChange = jest.fn()
        const onInputChange = jest.fn()
        const unsafeInputProps = {
            ...createAutoTestAttributes('delivery-input'),
            'aria-label': 'Delivery channel',
            autoComplete: 'organization-title',
            name: 'deliveryChannel',
            onChange: callerOnChange,
            role: 'presentation',
            value: 'replacement',
        } as unknown as PneAutocompleteHtmlInputProps

        render(<PneAutocomplete
            options={['Email', 'SFTP']}
            value={null}
            onChange={() => undefined}
            onInputChange={onInputChange}
            htmlInputProps={unsafeInputProps}
        />)

        const input = screen.getByRole('combobox', {name: 'Delivery channel'}) as HTMLInputElement

        expect(input.tagName).toBe('INPUT')
        expect(input.getAttribute('data-autotest')).toBe('delivery-input')
        expect(input.name).toBe('deliveryChannel')
        expect(input.autocomplete).toBe('organization-title')
        expect(input.value).toBe('')

        fireEvent.change(input, {target: {value: 'SFT'}})

        expect(onInputChange).toHaveBeenCalledWith(expect.anything(), 'SFT', 'input')
        expect(callerOnChange).not.toHaveBeenCalled()
    })

    it('supports number options and rehydrated legacy object values', () => {
        expect(isOptionEqualToValue(20, 20)).toBe(true)
        expect(isOptionEqualToValue(
            {id: 'gateway-1', displayName: 'Primary'},
            {id: 'gateway-1', displayName: 'Rehydrated'},
        )).toBe(true)
        expect(isOptionEqualToValue(
            {choiceId: 1, displayName: 'Choice'},
            {id: 1, displayName: 'Entity'} as never,
        )).toBe(false)
        expect(isOptionEqualToValue(
            {id: 1, displayName: 'Entity'},
            'free text' as never,
        )).toBe(false)
    })

    it('uses explicit adapters for arbitrary objects and compares by their key', () => {
        type Region = {code: string; title: string}
        type Variant =
            | {id: string; title: string}
            | {choiceId: string; title: string}

        const options: readonly Region[] = [
            {code: 'eu', title: 'Shared label'},
            {code: 'apac', title: 'Shared label'},
        ]
        const value = {code: 'apac', title: 'Rehydrated label'}
        const onChange = jest.fn()

        expect(areAutocompleteOptionsEqualBy(
            options[1],
            value,
            option => option.code,
        )).toBe(true)
        expect(areAutocompleteOptionsEqualBy<Variant>(
            {id: 'shared', title: 'Entity variant'},
            {choiceId: 'shared', title: 'Choice variant'},
            option => 'id' in option ? option.id : option.choiceId,
        )).toBe(true)

        render(<PneAutocomplete
            getOptionKey={option => option.code}
            getOptionLabel={option => option.title}
            htmlInputProps={{'aria-label': 'Region'}}
            onChange={onChange}
            options={options}
            value={value}
        />)

        const input = screen.getByRole('combobox', {name: 'Region'})
        expect((input as HTMLInputElement).value).toBe('Rehydrated label')

        openAutocomplete(input)
        const matchingOptions = screen.getAllByRole('option', {name: 'Shared label'})
        fireEvent.click(matchingOptions[0])

        expect(onChange).toHaveBeenCalledWith(
            expect.anything(),
            options[0],
            'selectOption',
            {option: options[0]},
        )
    })

    it('forwards the native input ref and renders ReactNode helper text', () => {
        const inputRef = React.createRef<HTMLInputElement>()
        const rootRef = React.createRef<HTMLDivElement>()

        render(<PneAutocomplete
            helperText={<span data-testid='helper-content'>Choose carefully</span>}
            htmlInputProps={{'aria-label': 'Delivery channel'}}
            inputRef={inputRef}
            ref={rootRef}
            options={['Email', 'SFTP']}
            value={null}
            onChange={() => undefined}
        />)

        expect(inputRef.current).toBe(screen.getByRole('combobox', {name: 'Delivery channel'}))
        expect(inputRef.current?.tagName).toBe('INPUT')
        expect(rootRef.current?.tagName).toBe('DIV')
        expect(screen.getByTestId('helper-content').textContent).toBe('Choose carefully')
    })

    it('keeps the root div fixed for untyped runtime override attempts', () => {
        const UnsafeAutocomplete = PneAutocomplete as unknown as React.ComponentType<Record<string, unknown>>
        const {container} = render(<UnsafeAutocomplete
            as="section"
            component="section"
            onChange={() => undefined}
            options={['Email', 'SFTP']}
            slotProps={{root: {component: 'section'}}}
            slots={{root: 'section'}}
            value={null}
        />)

        expect(container.querySelector('.MuiAutocomplete-root')?.tagName).toBe('DIV')
    })

    it('composes caller, component, and PneField descriptions on the input', () => {
        render(<>
            <span id='caller-description'>Caller description</span>
            <PneField
                helperText='Field description'
                id='delivery-field'
                label='Delivery channel'
            >
                <PneAutocomplete
                    helperText={<span>Component description</span>}
                    htmlInputProps={{'aria-describedby': 'caller-description'}}
                    options={['Email', 'SFTP']}
                    value={null}
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const input = screen.getByRole('combobox', {name: 'Delivery channel'})
        const descriptionIds = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
        const descriptions = descriptionIds.map(descriptionId =>
            document.getElementById(descriptionId)?.textContent,
        )

        expect(descriptions).toEqual(expect.arrayContaining([
            'Caller description',
            'Component description',
            'Field description',
        ]))
    })

    it('merges PneField and consumer names on the input and listbox', () => {
        render(<>
            <span id='delivery-context'>Consumer context</span>
            <PneField error id='delivery-field' label='External delivery label'>
                <PneAutocomplete
                    htmlInputProps={{'aria-labelledby': 'delivery-context'}}
                    options={['Email', 'SFTP']}
                    value={null}
                    onChange={() => undefined}
                />
            </PneField>
        </>)

        const input = screen.getByRole('combobox', {
            name: 'External delivery label Consumer context',
        })

        expect(input.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual([
            'delivery-field-label',
            'delivery-context',
        ])
        expect(input.getAttribute('aria-invalid')).toBe('true')

        openAutocomplete(input)
        expect(screen.getByRole('listbox', {
            name: 'External delivery label Consumer context',
        })).toBeTruthy()
    })

    it('gives the listbox the TextField label as its accessible name', () => {
        render(<PneAutocomplete
            label='Delivery channel'
            options={['Email', 'SFTP']}
            value={null}
            onChange={() => undefined}
        />)

        openAutocomplete(screen.getByRole('combobox', {name: 'Delivery channel'}))

        expect(screen.getByRole('listbox', {name: 'Delivery channel'})).toBeTruthy()
    })

    it('propagates PneField and explicit input names to the listbox', () => {
        const {rerender} = render(<PneField label='External delivery label'>
            <PneAutocomplete
                options={['Email', 'SFTP']}
                value={null}
                onChange={() => undefined}
            />
        </PneField>)

        openAutocomplete(screen.getByRole('combobox', {name: 'External delivery label'}))
        expect(screen.getByRole('listbox', {name: 'External delivery label'})).toBeTruthy()

        fireEvent.keyDown(screen.getByRole('combobox'), {key: 'Escape'})
        rerender(<PneAutocomplete
            htmlInputProps={{'aria-label': 'Explicit input label'}}
            options={['Email', 'SFTP']}
            value={null}
            onChange={() => undefined}
        />)

        openAutocomplete(screen.getByRole('combobox', {name: 'Explicit input label'}))
        expect(screen.getByRole('listbox', {name: 'Explicit input label'})).toBeTruthy()
    })
})
