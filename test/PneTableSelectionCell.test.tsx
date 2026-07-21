import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {PneTableSelectionCell, PneTableSelectionHeaderCell} from '../src'

describe('PneTable selection cells', () => {
    it('keeps row and header selection controls within compact table geometry', () => {
        render(
            <table>
                <thead>
                    <tr>
                        <PneTableSelectionHeaderCell
                            aria-label='Select this page'
                            onChange={jest.fn()}
                            state='none'
                        />
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <PneTableSelectionCell
                            aria-label='Select gate 42'
                            checked={false}
                            onChange={jest.fn()}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const checkboxes = screen.getAllByRole('checkbox')

        checkboxes.forEach(checkbox => {
            const cell = checkbox.closest('th, td') as HTMLElement
            const root = checkbox.closest('.MuiCheckbox-root') as HTMLElement
            const cellStyle = getComputedStyle(cell)
            const rootStyle = getComputedStyle(root)

            expect(cellStyle.padding).toBe('0px')
            expect(cellStyle.width).toBe('40px')
            expect(root.classList.contains('MuiCheckbox-sizeSmall')).toBe(true)
            expect(rootStyle.boxSizing).toBe('border-box')
            expect(rootStyle.height).toBe('36px')
            expect(rootStyle.padding).toBe('8px')
            expect(rootStyle.width).toBe('36px')
        })
    })

    it('renders native checked and indeterminate page states', () => {
        const {rerender} = render(
            <table>
                <thead>
                    <tr>
                        <PneTableSelectionHeaderCell
                            aria-label='Select this page'
                            onChange={jest.fn()}
                            state='some'
                        />
                    </tr>
                </thead>
            </table>,
        )
        const checkbox = screen.getByRole('checkbox', {name: 'Select this page'}) as HTMLInputElement

        expect(checkbox.checked).toBe(false)
        expect(checkbox.indeterminate).toBe(true)
        expect(checkbox.getAttribute('aria-checked')).toBe('mixed')

        rerender(
            <table>
                <thead>
                    <tr>
                        <PneTableSelectionHeaderCell
                            aria-label='Select this page'
                            onChange={jest.fn()}
                            state='all'
                        />
                    </tr>
                </thead>
            </table>,
        )

        expect(checkbox.checked).toBe(true)
        expect(checkbox.indeterminate).toBe(false)
        expect(checkbox.getAttribute('aria-checked')).toBe('true')
    })

    it('reports header and row checkbox changes', () => {
        const onPageChange = jest.fn()
        const onRowChange = jest.fn()
        render(
            <table>
                <thead>
                    <tr>
                        <PneTableSelectionHeaderCell
                            aria-label='Select this page'
                            onChange={onPageChange}
                            state='none'
                        />
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <PneTableSelectionCell
                            aria-label='Select gate 42'
                            checked={false}
                            onChange={onRowChange}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        fireEvent.click(screen.getByRole('checkbox', {name: 'Select this page'}))
        fireEvent.click(screen.getByRole('checkbox', {name: 'Select gate 42'}))

        expect(onPageChange).toHaveBeenCalledWith(true, expect.any(Object))
        expect(onRowChange).toHaveBeenCalledWith(true, expect.any(Object))
    })

    it('isolates checkbox and cell clicks from an interactive row', () => {
        const onRowClick = jest.fn()
        const onSelectionChange = jest.fn()
        render(
            <table>
                <tbody>
                    <tr onClick={onRowClick}>
                        <PneTableSelectionCell
                            aria-label='Select gate 42'
                            checked={false}
                            onChange={onSelectionChange}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const checkbox = screen.getByRole('checkbox', {name: 'Select gate 42'})
        fireEvent.click(checkbox)
        fireEvent.click(checkbox.closest('td') as Element)

        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('forwards native disabled state and supports labelled-by naming', () => {
        const onSelectionChange = jest.fn()
        render(
            <table>
                <tbody>
                    <tr>
                        <th id='gate-selection-label'>Select gate</th>
                        <PneTableSelectionCell
                            aria-labelledby='gate-selection-label'
                            checked
                            disabled
                            onChange={onSelectionChange}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const checkbox = screen.getByRole('checkbox', {name: 'Select gate'}) as HTMLInputElement
        expect(checkbox.checked).toBe(true)
        expect(checkbox.disabled).toBe(true)
        fireEvent.click(checkbox)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('keeps the generic locator on the actual checkbox control', () => {
        const {container} = render(
            <table>
                <tbody>
                    <tr>
                        <PneTableSelectionCell
                            aria-label='Select gate 42'
                            checked={false}
                            onChange={jest.fn()}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const locator = container.querySelector('[data-autotest="row-selection"]')
        expect(locator?.matches('input[type="checkbox"]')).toBe(true)
    })

    it('supports consumer locator compatibility and isolates a clickable header row', () => {
        const onHeaderRowClick = jest.fn()
        const onPageChange = jest.fn()
        const {container} = render(
            <table>
                <thead>
                    <tr onClick={onHeaderRowClick}>
                        <PneTableSelectionHeaderCell
                            aria-label='Select this page'
                            autoTestId='parentCheckbox'
                            autoTestValue='gates'
                            onChange={onPageChange}
                            state='none'
                        />
                    </tr>
                </thead>
            </table>,
        )
        const checkbox = screen.getByRole('checkbox', {name: 'Select this page'})

        fireEvent.click(checkbox)

        expect(onPageChange).toHaveBeenCalledTimes(1)
        expect(onHeaderRowClick).not.toHaveBeenCalled()
        expect(container.querySelector(
            'input[data-autotest="parentCheckbox"][data-autotest-value="gates"]',
        )).toBe(checkbox)
    })
})
